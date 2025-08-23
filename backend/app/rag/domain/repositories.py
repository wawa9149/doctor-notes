"""
Repository Interfaces - 도메인 레이어의 레포지토리 인터페이스
구현은 Infrastructure 레이어에서 수행
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from .entities import (
    DocumentChunk, SearchResult, MedicalEncounter, SOAPNote
)


class VectorStoreRepository(ABC):
    """벡터 스토어 레포지토리 인터페이스"""
    
    @abstractmethod
    async def upsert_chunks(
        self,
        chunks: List[DocumentChunk],
        encounter_id: str
    ) -> None:
        """청크 저장/업데이트"""
        pass
    
    @abstractmethod
    async def search_encounter_notes(
        self,
        query_embedding: List[float],
        tenant_id: str,
        patient_id: str,
        encounter_id: str,
        top_k: int = 5
    ) -> List[SearchResult]:
        """특정 encounter의 노트 검색"""
        pass
    
    @abstractmethod
    async def search_knowledge_base(
        self,
        query_embedding: List[float],
        top_k: int = 3
    ) -> List[SearchResult]:
        """의학 지식베이스 검색"""
        pass
    
    @abstractmethod
    async def delete_encounter_notes(
        self,
        tenant_id: str,
        patient_id: str,
        encounter_id: str
    ) -> None:
        """특정 encounter의 노트 삭제"""
        pass


class EmbeddingRepository(ABC):
    """임베딩 생성 레포지토리 인터페이스"""
    
    @abstractmethod
    async def generate_embedding(self, text: str) -> List[float]:
        """단일 텍스트 임베딩 생성"""
        pass
    
    @abstractmethod
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """여러 텍스트 임베딩 생성"""
        pass


class LLMRepository(ABC):
    """LLM 레포지토리 인터페이스"""
    
    @abstractmethod
    async def generate_soap_note(
        self,
        encounter: MedicalEncounter,
        knowledge_context: List[str]
    ) -> SOAPNote:
        """SOAP 노트 생성"""
        pass
    
    @abstractmethod
    async def generate_chat_response(
        self,
        question: str,
        context: List[str],
        recent_turns: List[dict],
        rolling_summary: Optional[str] = None
    ) -> dict:
        """채팅 응답 생성"""
        pass