"""
Embedding Implementation - HuggingFace 임베딩
"""
from typing import List
import logging
from langchain_huggingface import HuggingFaceEmbeddings

from ..domain.repositories import EmbeddingRepository
from ..infrastructure.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class HuggingFaceEmbedding(EmbeddingRepository):
    """HuggingFace 임베딩 구현"""
    
    def __init__(self):
        """임베딩 모델 초기화"""
        # 기존 테스트된 한국어 임베딩 모델 사용
        self.embeddings = HuggingFaceEmbeddings(
            model_name="jhgan/ko-sroberta-multitask",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True}
        )
        logger.info("Initialized HuggingFace embedding model: ko-sroberta-multitask")
    
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