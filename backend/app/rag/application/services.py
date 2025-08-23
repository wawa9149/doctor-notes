"""
Application Services - 비즈니스 서비스
"""
from typing import List, Dict, Any
import re

from ..domain.entities import SOAPNote, DocumentChunk


class ChunkingService:
    """텍스트 청킹 서비스"""
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def chunk_soap_note(
        self,
        soap_note: SOAPNote,
        metadata: Dict[str, Any]
    ) -> List[DocumentChunk]:
        """SOAP 노트를 청크로 분할"""
        chunks = []
        
        # 각 섹션별로 청킹
        sections = {
            "subjective": soap_note.subjective,
            "objective": soap_note.objective,
            "assessment": soap_note.assessment,
            "plan": soap_note.plan
        }
        
        for section_name, section_content in sections.items():
            if not section_content:
                continue
            
            # 섹션 내용을 청크로 분할
            section_chunks = self._chunk_text(section_content)
            
            for i, chunk_text in enumerate(section_chunks):
                chunk_metadata = {
                    **metadata,
                    "section": section_name,
                    "chunk_index": i,
                    "chunk_total": len(section_chunks)
                }
                
                chunks.append(DocumentChunk(
                    text=chunk_text,
                    metadata=chunk_metadata,
                    chunk_id=f"{metadata['encounter_id']}_v{metadata.get('version', 1)}_{section_name}_{i}"
                ))
        
        return chunks
    
    def _chunk_text(self, text: str) -> List[str]:
        """텍스트를 청크로 분할"""
        if not text:
            return []
        
        # 문장 단위로 분할
        sentences = self._split_sentences(text)
        
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence_length = len(sentence)
            
            if current_length + sentence_length <= self.chunk_size:
                current_chunk.append(sentence)
                current_length += sentence_length
            else:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                
                # 오버랩 처리
                if self.chunk_overlap > 0 and chunks:
                    overlap_text = chunks[-1][-self.chunk_overlap:]
                    current_chunk = [overlap_text, sentence]
                    current_length = len(overlap_text) + sentence_length
                else:
                    current_chunk = [sentence]
                    current_length = sentence_length
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    def _split_sentences(self, text: str) -> List[str]:
        """텍스트를 문장 단위로 분할"""
        # 한국어와 영어 문장 부호 고려
        sentence_endings = r'[.!?。！？]'
        sentences = re.split(sentence_endings, text)
        
        # 빈 문장 제거 및 정리
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # 문장이 너무 길면 추가 분할
        final_sentences = []
        for sentence in sentences:
            if len(sentence) > self.chunk_size:
                # 쉼표나 세미콜론으로 추가 분할
                sub_sentences = re.split(r'[,;，；]', sentence)
                final_sentences.extend([s.strip() for s in sub_sentences if s.strip()])
            else:
                final_sentences.append(sentence)
        
        return final_sentences