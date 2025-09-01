from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Azure OpenAI 설정
    AZURE_API_KEY: Optional[str] = None
    AZURE_ENDPOINT: Optional[str] = None
    AZURE_API_VERSION: Optional[str] = None
    AZURE_DEPLOYMENT_NAME: Optional[str] = None
    
    # OpenAI 설정 (필요 시)
    OPENAI_API_KEY: Optional[str] = None
    
    # Magovoice API 설정
    MAGOV_API_KEY: Optional[str] = None
    STT_API_BASE_URL: str = "http://61.74.187.69:8703"
    STT_POLL_INTERVAL: int = 3  # 초
    STT_MAX_POLL_ATTEMPTS: int = 30 # 최대 90초 대기
    # 데이터베이스 설정
    DATABASE_URL: str = "sqlite:///./emr.db"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = "ignore"  # .env에 정의되지 않은 필드가 있어도 무시

settings = Settings()
