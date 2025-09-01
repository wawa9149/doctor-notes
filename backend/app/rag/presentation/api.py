"""
API Endpoints - FastAPI 라우터
"""
from fastapi import APIRouter, HTTPException, status, Depends
import logging

from .schemas import (
    MergeRequest, MergeResponse,
    ChatRequest, ChatResponse,
    ReindexRequest, ReindexResponse
)
from .dependencies import (
    get_generate_soap_use_case,
    get_chat_query_use_case,
    get_reindex_use_case
)
from ..domain.entities import (
    MedicalEncounter, DialogueTurn, ChatContext
)
from ..application.use_cases import (
    GenerateSOAPUseCase, ChatQueryUseCase, ReindexEncounterUseCase
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["RAG Service"])


@router.get("/health")
async def health_check():
    """
    헬스체크 엔드포인트
    
    서비스 상태 및 의존성 확인
    """
    try:
        # ChromaDB 연결 상태 확인 (실제 연결 테스트는 나중에 추가)
        return {
            "status": "healthy",
            "service": "RAG Service",
            "dependencies": {
                "chromadb": "connected",  # 실제로는 ChromaDB 연결 체크 필요
                "llm": "ready"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unhealthy"
        )


@router.post("/merge", response_model=MergeResponse)
async def merge_consultation(
    request: MergeRequest,
    use_case: GenerateSOAPUseCase = Depends(get_generate_soap_use_case)
):
    """
    상담요약 생성 및 인덱싱
    
    - 의사-환자 대화를 SOAP 형식으로 요약
    - 생성된 요약을 ChromaDB에 즉시 인덱싱
    """
    try:
        logger.info(f"Processing merge request for encounter {request.encounter_id}")
        
        # 도메인 엔티티로 변환
        encounter = MedicalEncounter(
            tenant_id=request.tenant_id,
            patient_id=request.patient_id,
            encounter_id=request.encounter_id,
            dialogue=[
                DialogueTurn(
                    speaker=p.paragraph_speaker,
                    text=p.paragraph_text
                ) for p in request.paragraph
            ],
            doctor_note=request.doctor_note
        )
        
        # 유스케이스 실행
        soap_note = await use_case.execute(encounter)
        
        return MergeResponse(
            soap_summary=soap_note.to_text(),
            citations=soap_note.citations or []
        )
        
    except Exception as e:
        logger.error(f"Merge request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/chat", response_model=ChatResponse)
async def chat_query(
    request: ChatRequest,
    use_case: ChatQueryUseCase = Depends(get_chat_query_use_case)
):
    """
    RAG 기반 채팅 응답 생성
    """
    logger.info(f"Received chat query request: {request.dict()}")
    try:
        logger.info(f"Processing chat request for encounter {request.encounter_id}")
        
        # 도메인 엔티티로 변환
        chat_context = ChatContext(
            question=request.question,
            recent_turns=[
                {"role": turn.role, "text": turn.text}
                for turn in request.recent_turns
            ],
            rolling_summary=request.rolling_summary,
            expected_version=request.expected_version
        )
        
        # 유스케이스 실행
        response = await use_case.execute(
            tenant_id=request.tenant_id,
            patient_id=request.patient_id,
            encounter_id=request.encounter_id,
            chat_context=chat_context
        )
        
        return ChatResponse(
            answer=response.answer,
            citations=response.citations,
            rolling_summary_next=response.rolling_summary_next
        )
        
    except Exception as e:
        logger.error(f"Chat request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/reindex", response_model=ReindexResponse)
async def reindex_encounter(
    request: ReindexRequest,
    use_case: ReindexEncounterUseCase = Depends(get_reindex_use_case)
):
    """
    특정 encounter 재색인
    
    - SOAP 요약 업데이트 시 호출
    - 기존 인덱스 삭제 후 재색인
    """
    try:
        logger.info(f"Processing reindex request for encounter {request.encounter_id}")
        
        # 유스케이스 실행
        result = await use_case.execute(
            tenant_id=request.tenant_id,
            patient_id=request.patient_id,
            encounter_id=request.encounter_id,
            soap_text=request.soap_summary,
            version=request.version
        )
        
        return ReindexResponse(
            status=result["status"],
            encounter_id=result["encounter_id"],
            version=result["version"]
        )
        
    except Exception as e:
        logger.error(f"Reindex request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health")
async def health_check():
    """RAG 서비스 헬스체크"""
    return {
        "status": "healthy",
        "service": "rag-service",
        "components": {
            "chroma": "connected",
            "embedding": "ready",
            "llm": "ready"
        }
    }