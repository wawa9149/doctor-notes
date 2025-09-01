from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
import httpx
import logging
import uuid
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.emr import ChatSession, ChatMessage
from app.schemas.emr import (
    ChatSessionCreate, ChatSessionResponse,
    ChatMessageCreate, ChatMessageResponse
)
from app.models.emr import Patient

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatTurn(BaseModel):
    role: str  # "user" or "assistant"
    text: str

class ChatRequest(BaseModel):
    text: str
    patient_id: Optional[str] = None
    encounter_id: Optional[str] = None
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    rolling_summary_next: Optional[str] = None

class RAGRequest(BaseModel):
    tenant_id: str
    patient_id: str
    encounter_id: str
    question: str
    recent_turns: List[ChatTurn] = []
    rolling_summary: Optional[str] = None
    expected_version: Optional[int] = None

class RAGResponse(BaseModel):
    answer: str
    rolling_summary_next: Optional[str] = None

# 임시 대화 히스토리 저장 (실제 구현에서는 DB 사용)
chat_history = []
rolling_summary = None

@router.post("/query", response_model=ChatResponse)
async def chat_query(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    클라이언트로부터 챗 쿼리를 받아 RAG 서비스에 전달하고 응답을 반환합니다.
    """
    # global chat_history, rolling_summary # 전역 변수 대신 DB 사용
    
    try:
        # 세션 관리
        session_id = request.session_id
        chat_session = None

        if session_id:
            chat_session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
        
        if not chat_session:
            # 세션이 없거나 ID가 유효하지 않으면 새로 생성
            if not request.patient_id or not request.encounter_id:
                raise HTTPException(status_code=400, detail="새로운 채팅 시작을 위해 patient_id와 encounter_id가 필요합니다.")
            
            # patient_id (identifier)로 환자 정보 조회
            patient = db.query(Patient).filter(Patient.identifier == request.patient_id).first()
            if not patient:
                raise HTTPException(status_code=404, detail=f"환자 ID {request.patient_id}를 찾을 수 없습니다.")

            new_session_id = str(uuid.uuid4())
            chat_session = ChatSession(
                session_id=new_session_id,
                patient_id=patient.id, # 조회한 환자의 숫자 ID 사용
                encounter_id=int(request.encounter_id)
            )
            db.add(chat_session)
            db.flush()
            session_id = new_session_id
        
        # DB에서 최근 대화와 요약 불러오기
        recent_messages = db.query(ChatMessage).filter(ChatMessage.session_id == chat_session.id).order_by(ChatMessage.timestamp.desc()).limit(10).all()
        recent_turns = [{"role": m.role, "text": m.content} for m in reversed(recent_messages)]
        rolling_summary = chat_session.rolling_summary

        # RAG 서비스에 보낼 요청 구성
        rag_request = RAGRequest(
            tenant_id="hospA",
            patient_id=request.patient_id or "p123",  # 실제 환자 ID 또는 기본값
            encounter_id=request.encounter_id or "e789",  # 실제 Encounter ID 또는 기본값
            question=request.text,
            recent_turns=recent_turns,
            rolling_summary=rolling_summary
        )
        
        logger.info(f"Sending request to RAG service: {rag_request.dict()}")
        
        # 사용자 메시지 DB에 저장
        user_message = ChatMessage(session_id=chat_session.id, role="user", content=request.text)
        db.add(user_message)
        db.commit()

        # RAG 서비스 호출
        async with httpx.AsyncClient() as client:
            try:
                # RAG 서비스 URL (실제 서비스 URL로 변경 필요)
                rag_url = "http://localhost:8001/rag/chat"  # 실제 RAG 서비스 URL로 변경
                
                response = await client.post(
                    rag_url,
                    json=rag_request.dict(),
                    timeout=60.0
                )
                response.raise_for_status()
                
                rag_response = RAGResponse(**response.json())
                
                # AI 응답 DB에 저장
                assistant_message = ChatMessage(session_id=chat_session.id, role="assistant", content=rag_response.answer)
                db.add(assistant_message)

                # rolling_summary 업데이트
                if rag_response.rolling_summary_next:
                    chat_session.rolling_summary = rag_response.rolling_summary_next
                
                db.commit()
                
                return ChatResponse(
                    answer=rag_response.answer,
                    rolling_summary_next=rag_response.rolling_summary_next
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
                
            except httpx.HTTPStatusError as e:
                logger.error(f"RAG 서비스 HTTP 오류: {e}")
                raise HTTPException(status_code=e.response.status_code, detail="RAG 서비스 오류")
                
    except Exception as e:
        logger.error(f"챗 쿼리 처리 중 오류: {e}")
        raise HTTPException(status_code=500, detail="내부 서버 오류")


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    request: ChatSessionCreate,
    db: Session = Depends(get_db)
):
    """새로운 채팅 세션을 생성합니다."""
    try:
        session_id = str(uuid.uuid4())
        chat_session = ChatSession(
            session_id=session_id,
            patient_id=request.patient_id,
            encounter_id=request.encounter_id,
            rolling_summary=request.rolling_summary
        )
        db.add(chat_session)
        db.commit()
        db.refresh(chat_session)
        
        return chat_session
    except Exception as e:
        logger.error(f"채팅 세션 생성 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="채팅 세션 생성에 실패했습니다."
        )


@router.get("/sessions/encounter/{encounter_id}", response_model=List[ChatSessionResponse])
async def get_chat_sessions_by_encounter(
    encounter_id: int,
    db: Session = Depends(get_db)
):
    """특정 Encounter에 속한 모든 채팅 세션을 조회합니다."""
    chat_sessions = db.query(ChatSession).filter(ChatSession.encounter_id == encounter_id).all()
    if not chat_sessions:
        # 오류 대신 빈 리스트를 반환하여 클라이언트 처리를 용이하게 함
        return []
    return chat_sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """채팅 세션과 메시지들을 조회합니다."""
    chat_session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="채팅 세션을 찾을 수 없습니다."
        )
    return chat_session


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def add_chat_message(
    session_id: str,
    request: ChatMessageCreate,
    db: Session = Depends(get_db)
):
    """채팅 세션에 메시지를 추가합니다."""
    chat_session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="채팅 세션을 찾을 수 없습니다."
        )
    
    chat_message = ChatMessage(
        session_id=chat_session.id,
        role=request.role,
        content=request.content
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    
    return chat_message


@router.put("/sessions/{session_id}/rolling-summary")
async def update_rolling_summary(
    session_id: str,
    rolling_summary: str,
    db: Session = Depends(get_db)
):
    """채팅 세션의 rolling summary를 업데이트합니다."""
    chat_session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="채팅 세션을 찾을 수 없습니다."
        )
    
    chat_session.rolling_summary = rolling_summary
    db.commit()
    
    return {"message": "Rolling summary가 업데이트되었습니다."}


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """채팅 세션을 삭제합니다."""
    chat_session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="채팅 세션을 찾을 수 없습니다."
        )
    
    db.delete(chat_session)
    db.commit()
    
    return {"message": "채팅 세션이 삭제되었습니다."}
