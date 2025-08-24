"""
Dependency Injection - 의존성 주입
"""
from typing import Optional

from ..application.use_cases import (
    GenerateSOAPUseCase, ChatQueryUseCase, ReindexEncounterUseCase
)
from ..application.services import ChunkingService
from ..infrastructure.vector_store import ChromaDBVectorStore
from ..infrastructure.embedding import HuggingFaceEmbedding
from ..infrastructure.llm import LLMService
from ..infrastructure.config import get_settings

settings = get_settings()

# 싱글톤 인스턴스들
_vector_store: Optional[ChromaDBVectorStore] = None
_embedding_service: Optional[HuggingFaceEmbedding] = None
_llm_service: Optional[LLMService] = None
_chunking_service: Optional[ChunkingService] = None


def get_vector_store():
    """벡터 스토어 인스턴스"""
    global _vector_store
    if _vector_store is None:
        _vector_store = ChromaDBVectorStore()
    return _vector_store


def get_embedding_service():
    """임베딩 서비스 인스턴스"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = HuggingFaceEmbedding()
    return _embedding_service


def get_llm_service():
    """LLM 서비스 인스턴스"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


def get_chunking_service():
    """청킹 서비스 인스턴스"""
    global _chunking_service
    if _chunking_service is None:
        _chunking_service = ChunkingService(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
    return _chunking_service


def get_generate_soap_use_case() -> GenerateSOAPUseCase:
    """SOAP 생성 유스케이스 인스턴스"""
    return GenerateSOAPUseCase(
        vector_store=get_vector_store(),
        embedding_repo=get_embedding_service(),
        llm_repo=get_llm_service(),
        chunking_service=get_chunking_service()
    )


def get_chat_query_use_case() -> ChatQueryUseCase:
    """채팅 질의 유스케이스 인스턴스"""
    return ChatQueryUseCase(
        vector_store=get_vector_store(),
        embedding_repo=get_embedding_service(),
        llm_repo=get_llm_service()
    )


def get_reindex_use_case() -> ReindexEncounterUseCase:
    """재색인 유스케이스 인스턴스"""
    return ReindexEncounterUseCase(
        vector_store=get_vector_store(),
        embedding_repo=get_embedding_service(),
        chunking_service=get_chunking_service()
    )