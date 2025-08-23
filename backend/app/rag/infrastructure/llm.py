"""
LLM Implementation - LLM 서비스 구현
"""
from typing import List, Optional, Dict, Any
import json
import logging
import os

from ..domain.entities import MedicalEncounter, SOAPNote
from ..domain.repositories import LLMRepository
from ..infrastructure.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMService(LLMRepository):
    """LLM 서비스 구현"""
    
    def __init__(self):
        """LLM 서비스 초기화"""
        self.llm_client = None
        self.use_llm = False
        
        if settings.LLM_API_KEY:
            if "gemini" in settings.LLM_MODEL.lower():
                # Gemini 사용
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=settings.LLM_API_KEY)
                    self.llm_client = genai.GenerativeModel(settings.LLM_MODEL)
                    self.use_llm = True
                    self.llm_type = "gemini"
                    logger.info(f"Using Gemini model: {settings.LLM_MODEL}")
                except ImportError:
                    logger.error("google-generativeai not installed. Install with: pip install google-generativeai")
            elif "gpt" in settings.LLM_MODEL.lower():
                # OpenAI 사용
                try:
                    import openai
                    openai.api_key = settings.LLM_API_KEY
                    self.llm_client = openai
                    self.use_llm = True
                    self.llm_type = "openai"
                    logger.info(f"Using OpenAI model: {settings.LLM_MODEL}")
                except ImportError:
                    logger.error("openai not installed. Install with: pip install openai")
        
        if not self.use_llm:
            logger.warning("No LLM configured, using mock responses")
    
    async def generate_soap_note(
        self,
        encounter: MedicalEncounter,
        knowledge_context: List[str]
    ) -> SOAPNote:
        """SOAP 노트 생성"""
        
        # 프롬프트 구성
        prompt = self._build_soap_prompt(encounter, knowledge_context)
        
        if self.use_llm:
            try:
                if self.llm_type == "gemini":
                    # Gemini API 사용
                    full_prompt = f"{self._get_soap_system_prompt()}\n\n{prompt}"
                    response = self.llm_client.generate_content(
                        full_prompt,
                        generation_config={
                            "temperature": settings.LLM_TEMPERATURE,
                            "max_output_tokens": settings.LLM_MAX_TOKENS,
                        }
                    )
                    content = response.text
                    
                elif self.llm_type == "openai":
                    # OpenAI API 사용
                    response = self.llm_client.ChatCompletion.create(
                        model=settings.LLM_MODEL,
                        messages=[
                            {"role": "system", "content": self._get_soap_system_prompt()},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=settings.LLM_TEMPERATURE,
                        max_tokens=settings.LLM_MAX_TOKENS
                    )
                    content = response.choices[0].message.content
                
                return self._parse_soap_response(content)
                
            except Exception as e:
                logger.error(f"Failed to generate SOAP note: {e}")
                return self._generate_mock_soap_note()
        else:
            return self._generate_mock_soap_note()
    
    async def generate_chat_response(
        self,
        question: str,
        context: List[str],
        recent_turns: List[dict],
        rolling_summary: Optional[str] = None
    ) -> dict:
        """채팅 응답 생성"""
        
        # 프롬프트 구성
        prompt = self._build_chat_prompt(question, context, recent_turns, rolling_summary)
        
        if self.use_llm:
            try:
                if self.llm_type == "gemini":
                    # Gemini API 사용
                    full_prompt = f"{self._get_chat_system_prompt()}\n\n{prompt}"
                    response = self.llm_client.generate_content(
                        full_prompt,
                        generation_config={
                            "temperature": settings.LLM_TEMPERATURE,
                            "max_output_tokens": settings.LLM_MAX_TOKENS,
                        }
                    )
                    content = response.text
                    
                elif self.llm_type == "openai":
                    # OpenAI API 사용
                    response = self.llm_client.ChatCompletion.create(
                        model=settings.LLM_MODEL,
                        messages=[
                            {"role": "system", "content": self._get_chat_system_prompt()},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=settings.LLM_TEMPERATURE,
                        max_tokens=settings.LLM_MAX_TOKENS
                    )
                    content = response.choices[0].message.content
                
                return self._parse_chat_response(content)
                
            except Exception as e:
                logger.error(f"Failed to generate chat response: {e}")
                return self._generate_mock_chat_response(question)
        else:
            return self._generate_mock_chat_response(question)
    
    def _get_soap_system_prompt(self) -> str:
        """SOAP 시스템 프롬프트"""
        return """당신은 의료 전문가입니다. 의사-환자 대화와 의사 메모를 바탕으로 SOAP 형식의 상담 요약을 작성해주세요.

SOAP 형식:
- S (Subjective): 환자의 주관적 증상 및 호소
- O (Objective): 객관적 관찰 사항, 검사 결과
- A (Assessment): 평가 및 진단
- P (Plan): 치료 계획

응답은 반드시 JSON 형식으로 해주세요:
{
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "...",
    "citations": ["참조1", "참조2"]
}"""
    
    def _get_chat_system_prompt(self) -> str:
        """채팅 시스템 프롬프트"""
        return """당신은 의료 AI 어시스턴트입니다. 상담 노트와 의학 지식을 바탕으로 의사의 질문에 답변해주세요.

주의사항:
1. 상담 노트에 있는 정보를 우선적으로 참조
2. 명확하고 간결하게 답변
3. 불확실한 정보는 추측하지 않기

응답은 반드시 JSON 형식으로:
{
    "answer": "답변 내용",
    "citations": ["참조1"],
    "rolling_summary_next": "대화 요약"
}"""
    
    def _build_soap_prompt(
        self,
        encounter: MedicalEncounter,
        knowledge_context: List[str]
    ) -> str:
        """SOAP 프롬프트 구성"""
        
        # 대화 내용 포맷팅
        dialogue_text = "\n".join([
            f"{turn.speaker}: {turn.text}" for turn in encounter.dialogue
        ])
        
        # 지식베이스 컨텍스트
        kb_text = "\n".join(knowledge_context) if knowledge_context else "없음"
        
        return f"""다음 의사-환자 대화와 의사 메모를 바탕으로 SOAP 형식의 상담 요약을 작성해주세요.

[대화 내용]
{dialogue_text}

[의사 메모]
{encounter.doctor_note}

[참고 의학 정보]
{kb_text}"""
    
    def _build_chat_prompt(
        self,
        question: str,
        context: List[str],
        recent_turns: List[dict],
        rolling_summary: Optional[str]
    ) -> str:
        """채팅 프롬프트 구성"""
        
        context_text = "\n".join(context) if context else "없음"
        turns_text = "\n".join([
            f"{turn['role']}: {turn['text']}" for turn in recent_turns
        ]) if recent_turns else "없음"
        summary_text = rolling_summary if rolling_summary else "없음"
        
        return f"""[질문]
{question}

[상담 노트 컨텍스트]
{context_text}

[최근 대화]
{turns_text}

[대화 요약]
{summary_text}"""
    
    def _parse_soap_response(self, content: str) -> SOAPNote:
        """SOAP 응답 파싱"""
        try:
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            data = json.loads(content)
            
            return SOAPNote(
                subjective=data.get("subjective", ""),
                objective=data.get("objective", ""),
                assessment=data.get("assessment", ""),
                plan=data.get("plan", ""),
                citations=data.get("citations", [])
            )
        except:
            # 파싱 실패 시 기본 구조로 반환
            return self._generate_mock_soap_note()
    
    def _parse_chat_response(self, content: str) -> dict:
        """채팅 응답 파싱"""
        try:
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            return json.loads(content)
        except:
            return {
                "answer": content,
                "citations": [],
                "rolling_summary_next": ""
            }
    
    def _generate_mock_soap_note(self) -> SOAPNote:
        """모의 SOAP 노트 생성"""
        return SOAPNote(
            subjective="환자는 두통과 어지럼증을 호소함",
            objective="혈압 120/80, 맥박 72회/분, 체온 36.5도. 신경학적 검사 정상",
            assessment="긴장성 두통 의심",
            plan="진통제 처방, 충분한 휴식 권고, 증상 지속 시 재방문",
            citations=["의학 지식베이스: 두통 진단 가이드라인"]
        )
    
    def _generate_mock_chat_response(self, question: str) -> dict:
        """모의 채팅 응답 생성"""
        return {
            "answer": f"'{question}'에 대한 답변: 상담 노트를 확인한 결과, 관련 정보를 찾을 수 없습니다.",
            "citations": [],
            "rolling_summary_next": "의사와 AI가 환자 정보를 검토 중"
        }