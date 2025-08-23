"""
API Schemas - Request/Response 모델
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class DialogueParagraph(BaseModel):
    """대화 문단"""
    paragraph_speaker: str = Field(..., description="화자 (doctor/patient)")
    paragraph_text: str = Field(..., description="대화 내용")


class MergeRequest(BaseModel):
    """상담요약 생성 요청"""
    tenant_id: str = Field(..., description="병원/기관 ID")
    patient_id: str = Field(..., description="환자 ID")
    encounter_id: str = Field(..., description="진료 세션 ID")
    paragraph: List[DialogueParagraph] = Field(..., description="대화 내용")
    doctor_note: str = Field(..., description="의사 메모")


class MergeResponse(BaseModel):
    """상담요약 생성 응답"""
    soap_summary: str = Field(..., description="SOAP 형식 요약")
    citations: List[str] = Field(default=[], description="참조 출처")


class ChatTurn(BaseModel):
    """대화 턴"""
    role: str = Field(..., description="user/assistant")
    text: str = Field(..., description="메시지 내용")


class ChatRequest(BaseModel):
    """질의응답 요청"""
    tenant_id: str = Field(..., description="병원/기관 ID")
    patient_id: str = Field(..., description="환자 ID")
    encounter_id: str = Field(..., description="진료 세션 ID")
    question: str = Field(..., description="질문")
    recent_turns: List[ChatTurn] = Field(default=[], description="최근 대화 내역")
    rolling_summary: Optional[str] = Field(None, description="대화 요약")
    expected_version: Optional[int] = Field(None, description="예상 버전")


class ChatResponse(BaseModel):
    """질의응답 응답"""
    answer: str = Field(..., description="답변")
    citations: List[str] = Field(default=[], description="참조 출처")
    rolling_summary_next: Optional[str] = Field(None, description="업데이트된 대화 요약")


class ReindexRequest(BaseModel):
    """재색인 요청"""
    tenant_id: str = Field(..., description="병원/기관 ID")
    patient_id: str = Field(..., description="환자 ID")
    encounter_id: str = Field(..., description="진료 세션 ID")
    version: int = Field(..., description="문서 버전")
    soap_summary: str = Field(..., description="SOAP 요약 내용")
    idempotency_key: Optional[str] = Field(None, description="중복 방지 키")


class ReindexResponse(BaseModel):
    """재색인 응답"""
    status: str = Field(..., description="처리 상태")
    encounter_id: str = Field(..., description="진료 세션 ID")
    version: int = Field(..., description="인덱싱된 버전")