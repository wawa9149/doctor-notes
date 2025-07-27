from fastapi import APIRouter, Response
from pydantic import BaseModel
from app.services.llm_service import analyze_with_llm

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str

@router.options("/")
async def analyze_options():
    return Response(status_code=200)

@router.post("/")
async def analyze(req: AnalyzeRequest):
    return analyze_with_llm(req.text)
