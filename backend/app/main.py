from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import analyze, emr

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite 개발 서버
        "http://147.47.41.49:5173",  # 서버 IP
        "http://147.47.41.49:8081",  # 서버 IP 프로덕션
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,  # 프리플라이트 요청 캐시 시간
)

# 라우터 등록
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(emr.router, prefix="/emr", tags=["emr"])
