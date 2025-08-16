from fastapi import APIRouter, HTTPException
import logging
from app.services.llm_service import analyze_with_llm

router = APIRouter()
logger = logging.getLogger(__name__)

from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    text: str

@router.post("/")
async def analyze_dialogue(req: AnalyzeRequest):
    """대화 내용을 분석하여 FHIR 형식의 EMR 데이터로 변환합니다."""
    try:
        result = analyze_with_llm(req.text)
        return result
    except Exception as e:
        logger.error(f"분석 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"분석 실패: {str(e)}")


