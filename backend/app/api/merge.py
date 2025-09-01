import httpx
import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.emr import MergeRequest, MergeResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=MergeResponse)
async def merge_consultation_content(request: MergeRequest):
    """
    진료 대화 내용과 의사 노트를 합쳐 SOAP 노트를 생성합니다.
    RAG 서비스를 호출하여 실제 SOAP 노트를 생성합니다.
    """
    try:
        logger.info(f"RAG 서비스에 merge 요청 전송: encounter_id={request.encounter_id}")
        
        # RAG 서비스 호출
        async with httpx.AsyncClient(timeout=60.0) as client:
            rag_url = "http://localhost:8001/rag/merge"
            
            response = await client.post(
                rag_url,
                json=request.dict(),
                timeout=60.0
            )
            
            if response.status_code == 200:
                rag_response = response.json()
                logger.info("RAG 서비스에서 SOAP 노트 생성 완료")
                return MergeResponse(soap_summary=rag_response.get("soap_summary", ""))
            else:
                logger.error(f"RAG 서비스 오류: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"RAG 서비스 오류: {response.status_code}"
                )
                
    except httpx.RequestError as e:
        logger.error(f"RAG 서비스 연결 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG 서비스에 연결할 수 없습니다. 서비스가 실행 중인지 확인해주세요."
        )
    except httpx.TimeoutException as e:
        logger.error(f"RAG 서비스 타임아웃: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="RAG 서비스 응답 시간이 초과되었습니다."
        )
    except Exception as e:
        logger.error(f"Merge 요청 처리 중 예상치 못한 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="서버 내부 오류가 발생했습니다."
        )
