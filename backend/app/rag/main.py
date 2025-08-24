"""
RAG Service - 독립 실행 FastAPI Application
Clean Architecture 기반 구조
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.rag.presentation.api import router
from app.rag.presentation.dependencies import (
    get_embedding_service,
    get_vector_store,
    get_llm_service,
    get_chunking_service
)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행되는 컨텍스트 매니저"""
    # 시작 시: 모든 싱글톤 서비스 초기화
    logger.info("Initializing RAG services...")
    
    # 각 서비스를 한 번씩 호출하여 초기화
    logger.info("Initializing embedding service...")
    _ = get_embedding_service()
    
    logger.info("Initializing vector store...")
    _ = get_vector_store()
    
    logger.info("Initializing LLM service...")
    _ = get_llm_service()
    
    logger.info("Initializing chunking service...")
    _ = get_chunking_service()
    
    logger.info("All services initialized successfully!")
    
    yield
    
    # 종료 시: 정리 작업 (필요한 경우)
    logger.info("Shutting down RAG services...")


# FastAPI 앱 생성
app = FastAPI(
    title="RAG Service API",
    version="1.0.0",
    description="독립 RAG 서비스 - Clean Architecture",
    lifespan=lifespan
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