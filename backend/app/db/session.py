from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings

# SQLite 데이터베이스 URL 설정
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL or "sqlite:///./emr.db"

# 엔진 생성
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite 전용 설정
)

# 세션 팩토리 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    """
    FastAPI 의존성 주입을 위한 데이터베이스 세션 제공자
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
