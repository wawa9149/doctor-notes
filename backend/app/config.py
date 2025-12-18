# settings.py
from functools import lru_cache
from typing import Optional

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # .env 로딩과 동작 방식 정의 (v2)
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),   # 필요 없으면 ".env"만
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,               # 환경변수 대소문자 구분
    )

    # RAG 서비스 설정
    RAG_SERVICE_URL: str = "http://doctor-notes-rag:8001"

    # === Azure OpenAI ===
    AZURE_API_KEY: Optional[SecretStr] = None
    AZURE_ENDPOINT: Optional[str] = None
    AZURE_API_VERSION: Optional[str] = None
    AZURE_DEPLOYMENT_NAME: Optional[str] = None

    # === OpenAI ===
    OPENAI_API_KEY: Optional[SecretStr] = None

    # === Magovoice / STT ===
    MAGOV_API_KEY: Optional[SecretStr] = None
    STT_API_BASE_URL: str = "https://api.magovoice.com/s2t/"
    STT_POLL_INTERVAL: int = Field(3, ge=1, le=300)       # 1~300초
    STT_MAX_POLL_ATTEMPTS: int = Field(30, ge=1, le=1000) # 1~1000회

    # === Database ===
    # 컨테이너 내부 절대경로 권장 (sqlite는 슬래시 4개)
    DATABASE_URL: str = "sqlite:////app/data/emr.db"


@lru_cache
def get_settings() -> Settings:
    # 필요하면 여기서 _env_file 로 런타임 경로 재지정 가능
    # return Settings(_env_file="/app/.env", _env_file_encoding="utf-8")
    return Settings()


# 전역에서 바로 쓰고 싶으면:
settings = get_settings()
