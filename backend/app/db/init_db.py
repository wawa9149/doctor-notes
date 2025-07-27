import logging
from sqlalchemy.exc import SQLAlchemyError
from app.db.base import Base
from app.db.session import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db() -> None:
    """
    데이터베이스 테이블 생성
    """
    try:
        # 모든 테이블 생성
        Base.metadata.create_all(bind=engine)
        logger.info("✅ 데이터베이스 테이블이 성공적으로 생성되었습니다.")
    except SQLAlchemyError as e:
        logger.error(f"❌ 데이터베이스 초기화 중 오류 발생: {e}")
        raise

if __name__ == "__main__":
    logger.info("데이터베이스 테이블을 생성합니다...")
    init_db() 