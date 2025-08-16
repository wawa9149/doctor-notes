from fastapi import APIRouter, HTTPException, UploadFile, File
import httpx
import logging
import asyncio
from typing import Dict, Any, List

from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


async def upload_audio_file(client: httpx.AsyncClient, file: UploadFile, api_key: str) -> Dict[str, Any]:
    """음성 파일을 STT API에 업로드하고 작업 ID를 반환합니다."""
    url = f"{settings.STT_API_BASE_URL}/speech2text/upload"
    params = {"media_type": "audio", "num_speakers": "0", "language": "ko"}
    headers = {"accept": "application/json", "Bearer": api_key}
    files = {"file": (file.filename, file.file, "audio/wav")}

    response = await client.post(url, params=params, headers=headers, files=files, timeout=30.0)

    if response.status_code != 200:
        logger.error(f"Magovoice API 업로드 오류: {response.status_code} - {response.text}")
        raise HTTPException(status_code=response.status_code, detail="음성 파일 업로드에 실패했습니다.")
    
    return response.json()


async def poll_for_stt_result(client: httpx.AsyncClient, task_id: str, api_key: str) -> Dict[str, Any] | None:
    """작업 ID를 사용하여 STT 결과를 폴링합니다. 최종 응답(성공/실패)을 반환하거나, 타임아웃 시 None을 반환합니다."""
    result_url = f"{settings.STT_API_BASE_URL}/speech2text/result/{task_id}"
    params = {"return_type": "dict"}
    headers = {"accept": "application/json", "Bearer": api_key}

    for attempt in range(settings.STT_MAX_POLL_ATTEMPTS):
        logger.info(f"결과 조회 시도 {attempt + 1}/{settings.STT_MAX_POLL_ATTEMPTS}")
        
        result_response = await client.get(result_url, params=params, headers=headers, timeout=30.0)

        if result_response.status_code == 200:
            result_data = result_response.json()
            api_code = result_data.get("code")

            if api_code == 703:  # 처리 중
                logger.info("아직 처리 중 (API 코드 703)...")
                await asyncio.sleep(settings.STT_POLL_INTERVAL)
                continue
            
            # 성공(700) 또는 실패(501 등) 시, 루프를 중단하고 결과 반환
            logger.info(f"폴링 종료 (API 코드 {api_code})")
            return result_data

        elif result_response.status_code == 202:  # 202도 처리 중으로 간주
            logger.info("아직 처리 중 (HTTP 상태 코드 202)...")
            await asyncio.sleep(settings.STT_POLL_INTERVAL)
            continue
        
        else:  # 그 외 HTTP 오류
            logger.error(f"결과 조회 오류: {result_response.status_code} - {result_response.text}")
            raise HTTPException(status_code=result_response.status_code, detail="결과 조회에 실패했습니다.")

    logger.warning("결과 조회 타임아웃")
    return None  # 타임아웃 시 None 반환


def extract_utterances(result_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """STT 결과에서 필요한 발화 정보만 추출합니다."""
    try:
        # 가능한 utterances 경로들을 순서대로 탐색
        possible_paths = [
            ("content", "result", "s2t", "utterances"),
            ("content", "utterances"),
            ("utterances",)
        ]

        utterances = None
        for path in possible_paths:
            temp_data = result_data
            try:
                for key in path:
                    temp_data = temp_data[key]
                if isinstance(temp_data, list):
                    utterances = temp_data
                    break
            except (KeyError, TypeError):
                continue
        
        if utterances is None:
            logger.error(f"Utterances를 찾을 수 없음. 전체 응답: {result_data}")
            return []

        return [
            {
                "speaker": u.get("speaker", "UNKNOWN"),
                "start": u.get("start", 0),
                "end": u.get("end", 0),
                "text": u.get("text", ""),
            }
            for u in utterances
        ]
    except Exception as e:
        logger.error(f"Utterances 추출 중 예외 발생: {e}")
        return []


@router.post("/")
async def speech_to_text(file: UploadFile = File(description="음성 파일")):
    """음성 파일을 텍스트로 변환합니다."""
    if file.size == 0:
        raise HTTPException(status_code=400, detail="빈 파일은 업로드할 수 없습니다.")

    api_key = settings.MAGOV_API_KEY
    if not api_key:
        logger.error("MAGOV_API_KEY가 설정되지 않았습니다.")
        raise HTTPException(status_code=500, detail="서버 설정 오류: API 키가 누락되었습니다.")

    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            # 1. 파일 업로드
            upload_result = await upload_audio_file(client, file, api_key)
            logger.info(f"업로드 결과: {upload_result}")

            if upload_result.get("code") != 703 or not upload_result.get("content", {}).get("id"):
                logger.error(f"예상치 못한 업로드 응답: {upload_result}")
                raise HTTPException(status_code=500, detail="음성 인식 처리를 시작하지 못했습니다.")

            task_id = upload_result["content"]["id"]

            # 2. 결과 폴링
            result_data = await poll_for_stt_result(client, task_id, api_key)

            if result_data is None:
                # 타임아웃 처리
                return {"utterances": [{"text": "음성 인식 처리 시간이 초과되었습니다."}]}

            api_code = result_data.get("code")

            if api_code == 700: # 성공
                # 3. 결과 추출
                extracted_utterances = extract_utterances(result_data)
                logger.info(f"추출된 utterances: {extracted_utterances}")
                return {"utterances": extracted_utterances}
            
            elif api_code == 501: # 녹음 내용 없음
                logger.warning("API에서 501 오류 반환: 녹음된 내용 없음")
                return {"utterances": [{"speaker": "SYSTEM", "text": "음성 입력이 감지되지 않았습니다."}]}
            
            else: # 그 외 실패
                logger.error(f"STT 처리 실패 (API 코드 {api_code}): {result_data.get('message')}")
                raise HTTPException(status_code=500, detail="음성 인식 처리에 실패했습니다.")

        except httpx.HTTPStatusError as e:
            # httpx에서 발생한 HTTP 오류 처리
            logger.error(f"HTTP 상태 오류: {e.response.status_code} - {e.response.text}")
            if e.response.status_code == 401:
                return {"utterances": [{"text": "API 키 인증에 실패했습니다."}]}
            raise HTTPException(status_code=e.response.status_code, detail="음성 인식 API 통신 오류가 발생했습니다.")
        except httpx.RequestError as e:
            logger.error(f"Magovoice API 요청 오류: {str(e)}")
            raise HTTPException(status_code=500, detail="음성 인식 서비스 연결에 실패했습니다.")
        except HTTPException as e:
            # 이미 처리된 예외는 그대로 전달
            raise e
        except Exception as e:
            logger.error(f"음성 인식 중 예상치 못한 오류 발생: {str(e)}")
            raise HTTPException(status_code=500, detail="음성 인식 중 서버 오류가 발생했습니다.")
