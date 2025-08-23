"""
Domain Entities - 핵심 비즈니스 엔티티
"""
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from datetime import datetime


@dataclass
class DialogueTurn:
    """대화 턴"""
    speaker: str  # "doctor" | "patient"
    text: str
    timestamp: Optional[datetime] = None


@dataclass
class MedicalEncounter:
    """진료 세션"""
    tenant_id: str
    patient_id: str
    encounter_id: str
    dialogue: List[DialogueTurn]
    doctor_note: str
    version: int = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class SOAPNote:
    """SOAP 형식 진료 노트"""
    subjective: str  # 주관적 증상
    objective: str   # 객관적 관찰
    assessment: str  # 평가/진단
    plan: str        # 치료 계획
    citations: List[str] = None
    
    def to_text(self) -> str:
        """SOAP 노트를 텍스트로 변환"""
        return f"""S: {self.subjective}
O: {self.objective}
A: {self.assessment}
P: {self.plan}"""


@dataclass
class ChatContext:
    """채팅 컨텍스트"""
    question: str
    recent_turns: List[Dict[str, str]]
    rolling_summary: Optional[str] = None
    expected_version: Optional[int] = None


@dataclass
class ChatResponse:
    """채팅 응답"""
    answer: str
    citations: List[str]
    rolling_summary_next: Optional[str] = None


@dataclass
class DocumentChunk:
    """문서 청크"""
    text: str
    metadata: Dict[str, Any]
    embedding: Optional[List[float]] = None
    chunk_id: Optional[str] = None


@dataclass
class SearchResult:
    """검색 결과"""
    document: str
    score: float
    metadata: Dict[str, Any]