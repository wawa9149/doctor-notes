from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Azure OpenAI 설정
    AZURE_API_KEY: str
    AZURE_ENDPOINT: str
    AZURE_API_VERSION: str
    AZURE_DEPLOYMENT_NAME: str

    # 데이터베이스 설정
    DATABASE_URL: str = "sqlite:///./emr.db"

    class Config:
        env_file = ".env"

settings = Settings()
