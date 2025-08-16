from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Azure OpenAI 설정
    AZURE_API_KEY: str
    AZURE_ENDPOINT: str
    AZURE_API_VERSION: str
    AZURE_DEPLOYMENT_NAME: str

    # Magovoice API 설정
    MAGOV_API_KEY: str
    STT_API_BASE_URL: str = "http://61.74.187.69:8703"
    STT_POLL_INTERVAL: int = 3  # 초
    STT_MAX_POLL_ATTEMPTS: int = 30 # 최대 90초 대기

    # 데이터베이스 설정
    DATABASE_URL: str = "sqlite:///./emr.db"

    class Config:
        env_file = ".env"

settings = Settings()
