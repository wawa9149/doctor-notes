from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi import status
import httpx
import logging
import asyncio
import uuid
import os
from typing import Dict, Any, List, Optional, Tuple
from pydantic import SecretStr

from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# (선택) 자동 슬래시 리다이렉트 방지: app.py 쪽에서
# app.router.redirect_slashes = False

# ---- 유틸리티 -------------------------------------------------------------

def ensure_secret_str(s: Optional[SecretStr], key_name: str) -> str:
    if not s:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"서버 설정 오류: {key_name}가 누락되었습니다."
        )
    v = s.get_secret_value()
    if not v:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"서버 설정 오류: {key_name}가 비어 있습니다."
        )
    return v

def build_bearer_headers(api_key_str: str) -> Dict[str, str]:
    """
    당신의 업스트림이 'Bearer'라는 커스텀 헤더명을 요구한다면 아래를 유지.
    표준 OAuth라면 'Authorization': f'Bearer {api_key_str}' 를 사용하세요.
    """
    return {
        "accept": "application/json",
        "Bearer": api_key_str,                   # ← 커스텀 헤더
        # "Authorization": f"Bearer {api_key_str}"  # ← 표준 헤더일 경우
    }

def map_upstream_failure_to_http(status_code: int) -> int:
    """
    업스트림 오류를 우리 API로 매핑.
    - 인증 실패 → 401
    - 4xx → 502 (업스트림 요청 문제로 간주)
    - 5xx → 502 (게이트웨이 오류)
    """
    if status_code in (401, 403):
        return status.HTTP_401_UNAUTHORIZED
    if 400 <= status_code < 500:
        return status.HTTP_502_BAD_GATEWAY
    if 500 <= status_code:
        return status.HTTP_502_BAD_GATEWAY
    return status.HTTP_502_BAD_GATEWAY

async def retry_with_backoff(coro_fn, *, retries=2, base_delay=0.7, factor=2.0):
    """
    심플 재시도(지수 백오프). 네트워크 순간 장애 대비.
    - coro_fn: awaitable(호출 없이 넣기! ex: lambda: client.post(...))
    """
    last_exc = None
    delay = base_delay
    for attempt in range(retries + 1):
        try:
            return await coro_fn()
        except (httpx.TransportError, httpx.ReadTimeout) as e:
            last_exc = e
            if attempt == retries:
                break
            await asyncio.sleep(delay)
            delay *= factor
    raise last_exc  # 최종 실패

def validate_upload_file(file: UploadFile) -> Tuple[str, str]:
    """
    파일 기본 검증:
    - 파일명/콘텐츠타입 보정
    - 스니핑은 비용 크므로 최소만
    """
    filename = file.filename or "recording.wav"
    content_type = file.content_type or "application/octet-stream"
    # FastAPI의 UploadFile에는 size 속성이 없을 수 있으니 read 전 검증은 최소화
    return filename, content_type

# ---- 업스트림 호출부 ------------------------------------------------------

async def upload_audio_file(
    client: httpx.AsyncClient,
    file: UploadFile,
    api_key: SecretStr,
    request_id: str
) -> Dict[str, Any]:
    """
    음성/영상 파일 업로드 → 작업 ID 반환.
    """
    api_key_str = ensure_secret_str(api_key, "MAGOV_API_KEY")
    filename, content_type = validate_upload_file(file)

    url = f"{settings.STT_API_BASE_URL.rstrip('/')}/speech2text/run"
    print("url", url)
    headers = build_bearer_headers(api_key_str)
    print("headers", headers)

    # 파일 포인터 초기화(이전 read 방지)
    try:
      file.file.seek(0)
    except Exception:
      pass

    files = {"file": (filename, file.file, content_type)}
    print("files", files)
    async def _do():
        return await client.post(
            url, headers=headers, files=files,
            timeout=getattr(settings, "HTTP_TIMEOUT", 30.0),
        )

    response = await retry_with_backoff(_do, retries=2)

    if response.status_code != 200:
        logger.error(
            "upload_failed",
            extra={"rid": request_id, "status": response.status_code, "body": response.text[:300]}
        )
        raise HTTPException(
            status_code=map_upstream_failure_to_http(response.status_code),
            detail="음성 파일 업로드에 실패했습니다."
        )

    return response.json()

async def poll_for_stt_result(
    client: httpx.AsyncClient,
    task_id: str,
    api_key: SecretStr,
    request_id: str
) -> Optional[Dict[str, Any]]:
    """
    작업 ID로 결과 폴링. 성공/실패 응답 또는 타임아웃(None).
    """
    api_key_str = ensure_secret_str(api_key, "MAGOV_API_KEY")

    result_url = f"{settings.STT_API_BASE_URL.rstrip('/')}/speech2text/result/{task_id}"
    params = {"return_type": "dict"}
    headers = build_bearer_headers(api_key_str)

    attempts = getattr(settings, "STT_MAX_POLL_ATTEMPTS", 30)
    interval = getattr(settings, "STT_POLL_INTERVAL", 2.0)

    for attempt in range(1, attempts + 1):
        try:
            result_response = await client.get(
                result_url, params=params, headers=headers,
                timeout=getattr(settings, "HTTP_TIMEOUT", 30.0),
            )
        except httpx.RequestError as e:
            # 네트워크 이슈 → 재시도
            if attempt == attempts:
                logger.error(
                    "poll_request_failed",
                    extra={"rid": request_id, "error": str(e)}
                )
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="음성 인식 결과 조회 중 네트워크 오류가 발생했습니다."
                )
            await asyncio.sleep(interval)
            continue

        if result_response.status_code in (200, 202):
            # 202: 처리중
            if result_response.status_code == 202:
                await asyncio.sleep(interval)
                continue

            # 200: 응답 본문 확인
            try:
                result_data = result_response.json()
            except ValueError:
                logger.error(
                    "poll_invalid_json",
                    extra={"rid": request_id, "body": result_response.text[:300]}
                )
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="음성 인식 결과의 형식이 올바르지 않습니다."
                )

            api_code = result_data.get("code")
            if api_code == 703:  # 처리중
                await asyncio.sleep(interval)
                continue

            # 700(성공), 501(내용 없음), 기타 실패 모두 반환하여 상위에서 분기
            return result_data

        # 그 외 HTTP 오류
        logger.error(
            "poll_http_error",
            extra={"rid": request_id, "status": result_response.status_code, "body": result_response.text[:300]}
        )
        raise HTTPException(
            status_code=map_upstream_failure_to_http(result_response.status_code),
            detail="결과 조회에 실패했습니다."
        )

    logger.warning("poll_timeout", extra={"rid": request_id})
    return None

# ---- 결과 가공 ------------------------------------------------------------

def extract_utterances(result_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    다양한 응답 스키마를 방어적으로 처리해 utterances만 추출.
    """
    try:
        candidate_paths = [
            # 신규 Magovoice /run 응답 형태
            ("content", "result", "utterances"),
            # 기존(또는 다른) 스키마들에 대한 호환
            ("content", "result", "s2t", "utterances"),
            ("content", "utterances"),
            ("utterances",),
        ]
        utterances = None
        for path in candidate_paths:
            node = result_data
            for k in path:
                if not isinstance(node, dict) or k not in node:
                    node = None
                    break
                node = node[k]
            if isinstance(node, list):
                utterances = node
                break

        if not isinstance(utterances, list):
            logger.error("utterances_not_found", extra={"body": str(result_data)[:400]})
            return []

        out = []
        for u in utterances:
            if not isinstance(u, dict):
                continue
            out.append({
                "speaker": u.get("speaker", "UNKNOWN"),
                "start": u.get("start", 0),
                "end": u.get("end", 0),
                "text": u.get("text", ""),
            })
        return out
    except Exception as e:
        logger.exception("extract_utterances_error", extra={"error": str(e)})
        return []

# ---- 라우터 ---------------------------------------------------------------

@router.post("", status_code=status.HTTP_200_OK)
@router.post("/", status_code=status.HTTP_200_OK)  # /stt, /stt/ 둘 다 허용
async def speech_to_text(file: UploadFile = File(description="음성 파일")):
    """
    음성/영상 파일을 텍스트로 변환.
    - 업로드 → 작업 생성 → 폴링 → 결과 추출
    """
    print("=== STT API 호출됨 ===")
    print("file", file)
    logger.info("=== STT API 호출됨 ===")

    try:
        file.file.seek(0, 2)   # EOF
        size = file.file.tell()
        file.file.seek(0)      # 포인터 복원
    except Exception:
        size = None

    if size is not None and size == 0:
        raise HTTPException(status_code=400, detail="빈 파일은 업로드할 수 없습니다.")

    # 필수 설정값 로드
    api_key: SecretStr = settings.MAGOV_API_KEY  # SecretStr 기대
    # ensure_secret_str에서 누락/빈값 체크

    # 상관관계 ID로 요청 추적
    rid = uuid.uuid4().hex

    limits = httpx.Limits(max_connections=50, max_keepalive_connections=20, keepalive_expiry=30.0)
    timeout = getattr(settings, "HTTP_TIMEOUT", httpx.Timeout(30.0))

    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=getattr(settings, "HTTP_TIMEOUT", 30.0),
        limits=limits,
        headers={"x-request-id": rid}
    ) as client:
        try:
            # 1) 업로드(/run 호출) - 이 엔드포인트는 보통 최종 결과를 바로 반환함
            upload_result = await upload_audio_file(client, file, api_key, rid)
            logger.info("upload_ok", extra={"rid": rid, "resp": str(upload_result)[:200]})

            api_code = upload_result.get("code")

            # ---- 1) /run 모드: 업로드 응답이 곧 최종 결과인 경우 --------------------
            if api_code == 700:
                # 최종 인식 결과 포함
                utterances = extract_utterances(upload_result)
                return {"utterances": utterances}

            if api_code == 501:
                # 녹음 내용 없음
                return {"utterances": [{"speaker": "SYSTEM", "text": "음성 입력이 감지되지 않았습니다."}]}

            # ---- 2) 구(舊) /upload + 폴링 방식과의 호환 --------------------------
            # code==703 & content.id 가 넘어오면 작업 ID 기반 폴링 수행
            if api_code == 703:
                task_id = upload_result.get("content", {}).get("id")
                if not task_id:
                    logger.error("unexpected_upload_response", extra={"rid": rid, "resp": str(upload_result)[:300]})
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="음성 인식 처리를 시작하지 못했습니다."
                    )

                # 2) 폴링
                result_data = await poll_for_stt_result(client, task_id, api_key, rid)
                if result_data is None:
                    # 타임아웃
                    return {
                        "utterances": [
                            {
                                "speaker": "SYSTEM",
                                "text": "음성 인식 처리 시간이 초과되었습니다."
                            }
                        ]
                    }

                api_code = result_data.get("code")
                if api_code == 700:
                    # 3) 결과 추출
                    utterances = extract_utterances(result_data)
                    return {"utterances": utterances}

                if api_code == 501:
                    # 녹음 내용 없음
                    return {
                        "utterances": [
                            {
                                "speaker": "SYSTEM",
                                "text": "음성 입력이 감지되지 않았습니다."
                            }
                        ]
                    }

                # 그 외 실패 코드
                logger.error(
                    "stt_failed",
                    extra={"rid": rid, "code": api_code, "msg": result_data.get("message")}
                )
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="음성 인식 처리에 실패했습니다."
                )

            # ---- 3) 알 수 없는 code 값 처리 --------------------------------------
            logger.error(
                "unexpected_upload_response",
                extra={"rid": rid, "resp": str(upload_result)[:300]}
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="음성 인식 처리에 실패했습니다."
            )

        except HTTPException:
            # 이미 의미 있는 상태코드/메시지로 정제됨
            raise
        except httpx.HTTPStatusError as e:
            logger.error("http_status_error", extra={"rid": rid, "status": e.response.status_code, "body": e.response.text[:300]})
            if e.response.status_code == 401:
                return {"utterances": [{"speaker": "SYSTEM", "text": "API 키 인증에 실패했습니다."}]}
            raise HTTPException(status_code=map_upstream_failure_to_http(e.response.status_code), detail="음성 인식 API 통신 오류가 발생했습니다.")
        except httpx.RequestError as e:
            logger.error(
                "request_error_detail",
                extra={
                    "rid": rid,
                    "type": e.__class__.__name__,
                    "url": str(getattr(e, "request", None).url if getattr(e, "request", None) else ""),
                    "cause": repr(getattr(e, "__cause__", None)),
                    }
            )
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="음성 인식 서비스 연결에 실패했습니다.")
        except Exception as e:
            logger.exception("unexpected_server_error", extra={"rid": rid, "error": str(e)})
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="음성 인식 중 서버 오류가 발생했습니다.")
