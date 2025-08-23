"""
Dependency Injection - 의존성 주입
"""
from functools import lru_cache

from ..application.use_cases import (
    GenerateSOAPUseCase, ChatQueryUseCase, ReindexEncounterUseCase
)
from ..application.services import ChunkingService
from ..infrastructure.vector_store import ChromaDBVectorStore
from ..infrastructure.embedding import HuggingFaceEmbedding
from ..infrastructure.llm import LLMService
from ..infrastructure.config import get_settings

settings = get_settings()


@lru_cache()
def get_vector_store():
    """벡터 스토어 인스턴스"""
    return ChromaDBVectorStore()


@lru_cache()
def get_embedding_service():
    """임베딩 서비스 인스턴스"""
    return HuggingFaceEmbedding()


@lru_cache()
def get_llm_service():
    """LLM 서비스 인스턴스"""
    return LLMService()


@lru_cache()
def get_chunking_service():
    """청킹 서비스 인스턴스"""
    return ChunkingService(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP
    )


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