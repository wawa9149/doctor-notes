from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.api import analyze, emr

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # 개발 환경
        "http://localhost:3000",  # Next.js 개발 서버
        
        # 프로덕션 환경 (HTTP)
        "http://localhost",  # 로컬 프로덕션 (포트 80 생략)
        "http://147.47.41.49",  # 서버 IP 프로덕션 (포트 80 생략)
        "http://147.47.41.49:8008",  # 서버 IP 프로덕션 (포트 80 생략)
        
        # 프로덕션 환경 (HTTPS) - 향후 SSL 적용 시
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,  # 프리플라이트 요청 캐시 시간
)

# 헬스체크 엔드포인트
@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# 라우터 등록
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(emr.router, prefix="/emr", tags=["emr"])
