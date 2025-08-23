"""
Vector Store Implementation - ChromaDB
"""
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any
import logging
import uuid

from ..domain.entities import DocumentChunk, SearchResult
from ..domain.repositories import VectorStoreRepository
from ..infrastructure.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class ChromaDBVectorStore(VectorStoreRepository):
    """ChromaDB 벡터 스토어 구현"""
    
    def __init__(self):
        """ChromaDB 클라이언트 초기화"""
        self.client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # 컬렉션 초기화
        self._init_collections()
    
    def _init_collections(self):
        """컬렉션 초기화"""
        try:
            # 상담노트 컬렉션
            self.notes_collection = self.client.get_or_create_collection(
                name=settings.CHROMA_COLLECTION_NOTES,
                metadata={"description": "Patient encounter notes"}
            )
            
            # 의학 지식베이스 컬렉션
            self.kb_collection = self.client.get_or_create_collection(
                name=settings.CHROMA_COLLECTION_KB,
                metadata={"description": "Medical knowledge base"}
            )
            
            logger.info("ChromaDB collections initialized")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB collections: {e}")
            raise
    
    async def upsert_chunks(
        self,
        chunks: List[DocumentChunk],
        encounter_id: str
    ) -> None:
        """청크 저장/업데이트"""
        try:
            documents = []
            embeddings = []
            metadatas = []
            ids = []
            
            for chunk in chunks:
                documents.append(chunk.text)
                embeddings.append(chunk.embedding)
                metadatas.append(chunk.metadata)
                ids.append(chunk.chunk_id or str(uuid.uuid4()))
            
            self.notes_collection.upsert(
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            
            logger.info(f"Upserted {len(chunks)} chunks for encounter {encounter_id}")
        except Exception as e:
            logger.error(f"Failed to upsert chunks: {e}")
            raise
    
    async def search_encounter_notes(
        self,
        query_embedding: List[float],
        tenant_id: str,
        patient_id: str,
        encounter_id: str,
        top_k: int = 5
    ) -> List[SearchResult]:
        """특정 encounter의 노트 검색"""
        try:
            results = self.notes_collection.query(
                query_embeddings=[query_embedding],
                where={
                    "tenant_id": tenant_id,
                    "patient_id": patient_id,
                    "encounter_id": encounter_id
                },
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )
            
            # 결과 포맷팅
            search_results = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    search_results.append(SearchResult(
                        document=doc,
                        score=1 - results["distances"][0][i] if results["distances"] else 0,
                        metadata=results["metadatas"][0][i] if results["metadatas"] else {}
                    ))
            
            return search_results
        except Exception as e:
            logger.error(f"Failed to search encounter notes: {e}")
            raise
    
    async def search_knowledge_base(
        self,
        query_embedding: List[float],
        top_k: int = 3
    ) -> List[SearchResult]:
        """의학 지식베이스 검색"""
        try:
            results = self.kb_collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )
            
            # 결과 포맷팅
            search_results = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    search_results.append(SearchResult(
                        document=doc,
                        score=1 - results["distances"][0][i] if results["distances"] else 0,
                        metadata=results["metadatas"][0][i] if results["metadatas"] else {}
                    ))
            
            return search_results
        except Exception as e:
            logger.error(f"Failed to search knowledge base: {e}")
            raise
    
    async def delete_encounter_notes(
        self,
        tenant_id: str,
        patient_id: str,
        encounter_id: str
    ) -> None:
        """특정 encounter의 노트 삭제"""
        try:
            self.notes_collection.delete(
                where={
                    "tenant_id": tenant_id,
                    "patient_id": patient_id,
                    "encounter_id": encounter_id
                }
            )
            logger.info(f"Deleted notes for encounter {encounter_id}")
        except Exception as e:
            logger.error(f"Failed to delete encounter notes: {e}")
            raise