"""
RAG Service - 독립 실행 FastAPI Application
Clean Architecture 기반 구조
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.rag.presentation.api import router

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# FastAPI 앱 생성
app = FastAPI(
    title="RAG Service API",
    version="1.0.0",
    description="독립 RAG 서비스 - Clean Architecture"
)

# CORS 설정 - Backend 서비스만 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://backend:8000",  # Docker 네트워크 내부 통신
        "http://localhost:8000",  # 로컬 개발
        "http://localhost:8002",  # 로컬 개발 (포트 변경 시)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(router)

# 루트 헬스체크
@app.get("/")
async def root():
    return {
        "service": "RAG Service",
        "version": "1.0.0",
        "architecture": "Clean Architecture",
        "endpoints": [
            "/rag/merge",
            "/rag/chat", 
            "/rag/reindex",
            "/rag/health",
            "/health"
        ]
    }

# 간단한 헬스체크 (Docker용)
@app.get("/health")
async def health():
    """Docker 헬스체크용 간단한 엔드포인트"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)