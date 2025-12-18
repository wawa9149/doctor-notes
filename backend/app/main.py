from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.api import emr, stt, merge, chat

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # 개발 환경
        "http://localhost:3000",  # Next.js 개발 서버
        "http://61.74.187.69:8004", # 운영 서버
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
app.include_router(emr.router, prefix="/emr", tags=["emr"])
app.include_router(stt.router, prefix="/stt", tags=["stt"])
app.include_router(merge.router, prefix="/merge", tags=["merge"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
