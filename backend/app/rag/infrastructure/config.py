"""
Infrastructure Configuration
"""
import os
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # ChromaDB 설정
    CHROMA_HOST: str = os.getenv("CHROMA_HOST", "localhost")
    CHROMA_PORT: int = int(os.getenv("CHROMA_PORT", "8000"))
    CHROMA_COLLECTION_NOTES: str = "notes_by_encounter"
    CHROMA_COLLECTION_KB: str = "kb_psych"
    
    # Azure OpenAI 설정
    AZURE_API_KEY: str = os.getenv("AZURE_API_KEY", "")
    AZURE_ENDPOINT: str = os.getenv("AZURE_ENDPOINT", "")
    AZURE_API_VERSION: str = os.getenv("AZURE_API_VERSION", "2024-02-01")
    AZURE_DEPLOYMENT_NAME: str = os.getenv("AZURE_DEPLOYMENT_NAME", "")
    
    # LLM 호출 공통 설정
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 2000
    
    # 임베딩 설정
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "jhgan/ko-sroberta-multitask")
    
    # 검색 설정
    RETRIEVAL_TOP_K: int = int(os.getenv("RETRIEVAL_TOP_K", "5"))
    RETRIEVAL_TOP_M: int = int(os.getenv("RETRIEVAL_TOP_M", "3"))
    
    # 청킹 설정
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "500"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "50"))
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True
        extra = "ignore"  # .env에 정의되지 않은 필드가 있어도 무시


@lru_cache()
def get_settings() -> Settings:
    """설정 싱글톤 인스턴스 반환"""
    return Settings()