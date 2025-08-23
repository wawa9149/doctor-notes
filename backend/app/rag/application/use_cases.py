"""
Application Use Cases - 핵심 비즈니스 유스케이스
"""
from typing import List, Optional
import logging
from datetime import datetime

from ..domain.entities import (
    MedicalEncounter, SOAPNote, DialogueTurn,
    ChatContext, ChatResponse, DocumentChunk
)
from ..domain.repositories import (
    VectorStoreRepository, EmbeddingRepository, LLMRepository
)
from .services import ChunkingService

logger = logging.getLogger(__name__)


class GenerateSOAPUseCase:
    """SOAP 노트 생성 및 인덱싱 유스케이스"""
    
    def __init__(
        self,
        vector_store: VectorStoreRepository,
        embedding_repo: EmbeddingRepository,
        llm_repo: LLMRepository,
        chunking_service: ChunkingService
    ):
        self.vector_store = vector_store
        self.embedding_repo = embedding_repo
        self.llm_repo = llm_repo
        self.chunking_service = chunking_service
    
    async def execute(self, encounter: MedicalEncounter) -> SOAPNote:
        """
        SOAP 노트 생성 및 인덱싱 실행
        1. 의학 지식베이스 검색
        2. SOAP 노트 생성
        3. 생성된 노트 인덱싱
        """
        try:
            # 1. 의학 지식베이스 검색
            query_embedding = await self.embedding_repo.generate_embedding(
                encounter.doctor_note
            )
            kb_results = await self.vector_store.search_knowledge_base(
                query_embedding=query_embedding,
                top_k=3
            )
            knowledge_context = [r.document for r in kb_results]
            
            # 2. SOAP 노트 생성
            soap_note = await self.llm_repo.generate_soap_note(
                encounter=encounter,
                knowledge_context=knowledge_context
            )
            
            # 3. 생성된 노트 인덱싱
            await self._index_soap_note(encounter, soap_note)
            
            return soap_note
            
        except Exception as e:
            logger.error(f"Failed to generate SOAP note: {e}")
            raise
    
    async def _index_soap_note(
        self,
        encounter: MedicalEncounter,
        soap_note: SOAPNote
    ):
        """SOAP 노트 인덱싱"""
        # 청킹
        chunks = self.chunking_service.chunk_soap_note(
            soap_note=soap_note,
            metadata={
                "tenant_id": encounter.tenant_id,
                "patient_id": encounter.patient_id,
                "encounter_id": encounter.encounter_id,
                "version": encounter.version,
                "indexed_at": datetime.now().isoformat()
            }
        )
        
        # 임베딩 생성
        texts = [chunk.text for chunk in chunks]
        embeddings = await self.embedding_repo.generate_embeddings(texts)
        
        # 임베딩 할당
        for chunk, embedding in zip(chunks, embeddings):
            chunk.embedding = embedding
        
        # 벡터 스토어에 저장
        await self.vector_store.upsert_chunks(
            chunks=chunks,
            encounter_id=encounter.encounter_id
        )


class ChatQueryUseCase:
    """채팅 질의응답 유스케이스"""
    
    def __init__(
        self,
        vector_store: VectorStoreRepository,
        embedding_repo: EmbeddingRepository,
        llm_repo: LLMRepository
    ):
        self.vector_store = vector_store
        self.embedding_repo = embedding_repo
        self.llm_repo = llm_repo
    
    async def execute(
        self,
        tenant_id: str,
        patient_id: str,
        encounter_id: str,
        chat_context: ChatContext
    ) -> ChatResponse:
        """
        채팅 질의응답 실행
        1. 질문 임베딩 생성
        2. 관련 문서 검색
        3. LLM으로 답변 생성
        """
        try:
            # 1. 질문 임베딩 생성
            query_embedding = await self.embedding_repo.generate_embedding(
                chat_context.question
            )
            
            # 2. encounter 노트 검색
            note_results = await self.vector_store.search_encounter_notes(
                query_embedding=query_embedding,
                tenant_id=tenant_id,
                patient_id=patient_id,
                encounter_id=encounter_id,
                top_k=5
            )
            
            # 3. 의학 지식베이스 검색
            kb_results = await self.vector_store.search_knowledge_base(
                query_embedding=query_embedding,
                top_k=3
            )
            
            # 4. 컨텍스트 조합
            context = []
            context.extend([r.document for r in note_results])
            context.extend([r.document for r in kb_results])
            
            # 5. LLM으로 답변 생성
            response_data = await self.llm_repo.generate_chat_response(
                question=chat_context.question,
                context=context,
                recent_turns=chat_context.recent_turns,
                rolling_summary=chat_context.rolling_summary
            )
            
            return ChatResponse(
                answer=response_data["answer"],
                citations=response_data.get("citations", []),
                rolling_summary_next=response_data.get("rolling_summary_next")
            )
            
        except Exception as e:
            logger.error(f"Failed to process chat query: {e}")
            raise


class ReindexEncounterUseCase:
    """Encounter 재인덱싱 유스케이스"""
    
    def __init__(
        self,
        vector_store: VectorStoreRepository,
        embedding_repo: EmbeddingRepository,
        chunking_service: ChunkingService
    ):
        self.vector_store = vector_store
        self.embedding_repo = embedding_repo
        self.chunking_service = chunking_service
    
    async def execute(
        self,
        tenant_id: str,
        patient_id: str,
        encounter_id: str,
        soap_text: str,
        version: int
    ) -> dict:
        """
        Encounter 재인덱싱 실행
        1. 기존 인덱스 삭제
        2. 새로운 청킹 및 임베딩
        3. 재인덱싱
        """
        try:
            # 1. 기존 인덱스 삭제
            await self.vector_store.delete_encounter_notes(
                tenant_id=tenant_id,
                patient_id=patient_id,
                encounter_id=encounter_id
            )
            
            # 2. SOAP 텍스트를 SOAPNote 객체로 파싱
            soap_note = self._parse_soap_text(soap_text)
            
            # 3. 청킹
            chunks = self.chunking_service.chunk_soap_note(
                soap_note=soap_note,
                metadata={
                    "tenant_id": tenant_id,
                    "patient_id": patient_id,
                    "encounter_id": encounter_id,
                    "version": version,
                    "indexed_at": datetime.now().isoformat()
                }
            )
            
            # 4. 임베딩 생성
            texts = [chunk.text for chunk in chunks]
            embeddings = await self.embedding_repo.generate_embeddings(texts)
            
            # 5. 임베딩 할당
            for chunk, embedding in zip(chunks, embeddings):
                chunk.embedding = embedding
            
            # 6. 재인덱싱
            await self.vector_store.upsert_chunks(
                chunks=chunks,
                encounter_id=encounter_id
            )
            
            return {
                "status": "indexed",
                "encounter_id": encounter_id,
                "version": version,
                "chunks_count": len(chunks)
            }
            
        except Exception as e:
            logger.error(f"Failed to reindex encounter: {e}")
            raise
    
    def _parse_soap_text(self, soap_text: str) -> SOAPNote:
        """SOAP 텍스트 파싱"""
        # 간단한 파싱 로직 (실제로는 더 정교하게 구현 필요)
        lines = soap_text.split('\n')
        soap_dict = {"S": "", "O": "", "A": "", "P": ""}
        current_section = None
        
        for line in lines:
            if line.startswith("S:"):
                current_section = "S"
                soap_dict["S"] = line[2:].strip()
            elif line.startswith("O:"):
                current_section = "O"
                soap_dict["O"] = line[2:].strip()
            elif line.startswith("A:"):
                current_section = "A"
                soap_dict["A"] = line[2:].strip()
            elif line.startswith("P:"):
                current_section = "P"
                soap_dict["P"] = line[2:].strip()
            elif current_section:
                soap_dict[current_section] += " " + line.strip()
        
        return SOAPNote(
            subjective=soap_dict["S"],
            objective=soap_dict["O"],
            assessment=soap_dict["A"],
            plan=soap_dict["P"]
        )