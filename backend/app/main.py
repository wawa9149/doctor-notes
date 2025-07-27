from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import analyze, emr

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:65028"],  # Vite 기본 포트
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,  # 프리플라이트 요청 캐시 시간
)

# 라우터 등록
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(emr.router, prefix="/emr", tags=["emr"])
