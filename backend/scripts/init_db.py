#!/usr/bin/env python3
import sys
import os

# 상위 디렉토리를 Python 경로에 추가하여 app 모듈을 import할 수 있게 함
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.init_db import init_db

def main() -> None:
    print("데이터베이스 테이블을 생성합니다...")
    init_db()
    print("완료되었습니다!")

if __name__ == "__main__":
    main() 