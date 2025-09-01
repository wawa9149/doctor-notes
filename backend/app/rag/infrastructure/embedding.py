"""
Embedding Implementation - HuggingFace 임베딩
"""
from typing import List, Optional
import logging
import os
from langchain_huggingface import HuggingFaceEmbeddings

from ..domain.repositories import EmbeddingRepository
from ..infrastructure.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# 전역 싱글톤 인스턴스
_embedding_model: Optional[HuggingFaceEmbeddings] = None


def get_embedding_model() -> HuggingFaceEmbeddings:
    """싱글톤 임베딩 모델 반환"""
    global _embedding_model
    if _embedding_model is None:
        # 환경변수에서 로컬 모델 경로 가져오기
        model_path = os.getenv("EMBEDDING_MODEL_PATH", "jhgan/ko-sroberta-multitask")
        
        logger.info(f"Initializing HuggingFace embedding model from: {model_path}")
        
        _embedding_model = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True},
            # 네트워크 문제로 모델 다운로드 실패 시 온라인 다운로드 강제
            # 일부 환경에서는 기본값이 local_files_only=True일 수 있음
            cache_folder=os.path.join(os.path.dirname(__file__), "..", "models"),
            # local_files_only=False 
        )
        logger.info("HuggingFace embedding model initialized successfully")
    return _embedding_model


class HuggingFaceEmbedding(EmbeddingRepository):
    """HuggingFace 임베딩 구현"""
    
    def __init__(self):
        """임베딩 모델 초기화"""
        # 싱글톤 패턴으로 모델 재사용
        self.embeddings = get_embedding_model()
    
    async def generate_embedding(self, text: str) -> List[float]:
        """단일 텍스트 임베딩 생성"""
        try:
            embedding = self.embeddings.embed_query(text)
            return embedding
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """여러 텍스트 임베딩 생성"""
        if not texts:
            return []
        
        try:
            embeddings = self.embeddings.embed_documents(texts)
            return embeddings
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise