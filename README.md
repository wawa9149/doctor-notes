# Doctor Notes

의료 상담 기록 및 분석을 위한 웹 애플리케이션입니다.

## 🚀 기술 스택

### Frontend (Next.js 15 + React 19)

- **Next.js 15** - React 프레임워크
- **React 19** - 사용자 인터페이스 라이브러리
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링 프레임워크
- **App Router** - 서버 컴포넌트 기반 라우팅

### Backend

- **FastAPI** - Python 웹 프레임워크
- **SQLAlchemy** - ORM
- **PostgreSQL** - 데이터베이스

## 📁 프로젝트 구조

```
doctor-notes/
├── frontend/              # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/          # App Router 페이지
│   │   ├── components/   # React 컴포넌트
│   │   ├── services/     # API 통신
│   │   ├── types/        # TypeScript 타입
│   │   └── hooks/        # 커스텀 훅
│   ├── Dockerfile        # 프로덕션용
│   └── Dockerfile.dev    # 개발용
├── backend/              # FastAPI 백엔드
│   ├── app/
│   │   ├── api/          # API 라우터
│   │   ├── models/       # SQLAlchemy 모델
│   │   ├── schemas/      # Pydantic 스키마
│   │   ├── services/     # 비즈니스 로직
│   │   ├── core/         # 핵심 설정
│   │   └── utils/        # 유틸리티 함수
│   ├── requirements.txt  # Python 의존성
│   ├── Dockerfile        # 프로덕션용
│   └── Dockerfile.dev    # 개발용
└── docker-compose.yml    # Docker 설정
```

## 🏗️ 주요 기능

- 환자 정보 관리
- 상담 내용 분석
- EMR 데이터 생성
- 진료 기록 조회

## 🚀 시작하기

### **개발 환경**

```bash
# 전체 서비스 실행 (개발 모드)
docker compose --profile dev up -d

# 프론트엔드만 개발
cd frontend
npm run dev

# 백엔드만 개발
cd backend
uvicorn app.main:app --reload
```

### **프로덕션 환경**

```bash
# 전체 서비스 실행
docker compose up -d
```

## 📱 접속 정보

- **프론트엔드**: http://localhost:3000 (개발) / http://localhost:80 (프로덕션)
- **백엔드 API**: http://localhost:8000

## 🔄 마이그레이션 히스토리

- **2024-08-08**: Vite + React Router → Next.js 15 + React 19 마이그레이션 완료
- **주요 변경사항**:
  - App Router 도입
  - 서버 컴포넌트 활용
  - React 19 use Hook 적용
  - Docker 설정 업데이트

## �� 라이선스

MIT License
