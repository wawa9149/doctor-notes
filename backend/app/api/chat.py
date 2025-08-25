from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatTurn(BaseModel):
    role: str  # "user" or "assistant"
    text: str

class ChatRequest(BaseModel):
    text: str

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
async def chat_query(request: ChatRequest):
    """
    클라이언트로부터 챗 쿼리를 받아 RAG 서비스에 전달하고 응답을 반환합니다.
    """
    global chat_history, rolling_summary
    
    try:
        # 대화 히스토리에 사용자 메시지 추가
        chat_history.append({"role": "user", "text": request.text})
        
        # 최근 5턴만 유지 (10개 메시지 = 5턴)
        recent_turns = chat_history[-10:] if len(chat_history) > 10 else chat_history[:-1]
        
        # RAG 서비스에 보낼 요청 구성
        rag_request = RAGRequest(
            tenant_id="hospA",
            patient_id="p123", 
            encounter_id="e789",
            question=request.text,
            recent_turns=recent_turns,
            rolling_summary=rolling_summary
        )
        
        # RAG 서비스 호출
        async with httpx.AsyncClient() as client:
            try:
                # RAG 서비스 URL (실제 서비스 URL로 변경 필요)
                rag_url = "http://localhost:8001/rag/chat"  # 실제 RAG 서비스 URL로 변경
                
                response = await client.post(
                    rag_url,
                    json=rag_request.dict(),
                    timeout=30.0
                )
                response.raise_for_status()
                
                rag_response = RAGResponse(**response.json())
                
                # 대화 히스토리에 AI 응답 추가
                chat_history.append({"role": "assistant", "text": rag_response.answer})
                
                # rolling_summary 업데이트
                if rag_response.rolling_summary_next:
                    rolling_summary = rag_response.rolling_summary_next
                
                return ChatResponse(
                    answer=rag_response.answer,
                    rolling_summary_next=rag_response.rolling_summary_next
                )
                
            except httpx.RequestError as e:
                logger.error(f"RAG 서비스 연결 오류: {e}")
                # RAG 서비스가 없는 경우 목업 응답
                mock_response = f"'{request.text}'에 대한 답변입니다. (RAG 서비스 연결 실패로 인한 목업 응답)"
                chat_history.append({"role": "assistant", "text": mock_response})
                
                return ChatResponse(
                    answer=mock_response,
                    rolling_summary_next="대화가 진행 중입니다."
                )
                
            except httpx.HTTPStatusError as e:
                logger.error(f"RAG 서비스 HTTP 오류: {e}")
                raise HTTPException(status_code=e.response.status_code, detail="RAG 서비스 오류")
                
    except Exception as e:
        logger.error(f"챗 쿼리 처리 중 오류: {e}")
        raise HTTPException(status_code=500, detail="내부 서버 오류")

@router.get("/history")
async def get_chat_history():
    """현재 대화 히스토리를 반환합니다."""
    return {"history": chat_history, "rolling_summary": rolling_summary}

@router.delete("/history")
async def clear_chat_history():
    """대화 히스토리를 초기화합니다."""
    global chat_history, rolling_summary
    chat_history = []
    rolling_summary = None
    return {"message": "대화 히스토리가 초기화되었습니다."}
