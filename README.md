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


### RAG Service (독립 서비스)

- **LangChain** - LLM 오케스트레이션
- **ChromaDB** - 벡터 데이터베이스
- **HuggingFace** - 한국어 임베딩 (jhgan/ko-sroberta-multitask)
- **OpenAI/Google AI** - LLM 프로바이더
- **Clean Architecture** - 도메인 중심 설계

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
│   │   ├── main.py       # 메인 API
│   │   ├── api/          # API 라우터
│   │   ├── models/       # SQLAlchemy 모델
│   │   ├── schemas/      # Pydantic 스키마
│   │   ├── services/     # 비즈니스 로직
│   │   └── rag/          # RAG 서비스
│   │       ├── domain/       # 도메인 로직
│   │       ├── application/  # 유스케이스
│   │       ├── infrastructure/ # 외부 서비스
│   │       └── presentation/ # API 엔드포인트
│   ├── requirements.txt  # Python 의존성
│   ├── Dockerfile        # 백엔드용
│   └── Dockerfile.rag    # RAG 서비스용
├── frontend-vite-backup/ # 기존 Vite 프로젝트 (백업)
└── docker-compose.yml    # Docker 설정
```

## 🏗️ 주요 기능

- 환자 정보 관리
- 상담 내용 분석
- EMR 데이터 생성
- 진료 기록 조회

### **RAG 서비스 기능**

- **하이브리드 검색** - BM25 + Dense Retrieval 결합
- **SOAP 노트 생성** - 의사-환자 대화를 구조화된 형식으로 변환
- **의료 지식 기반 채팅** - ChromaDB 벡터 검색 기반 응답
- **실시간 인덱싱** - 상담 내용 즉시 벡터화 및 저장

## 🚀 시작하기

### **개발 환경**

```bash
# 전체 서비스 실행 (개발 모드)
docker compose --profile dev up -d

# RAG 서비스 포함 실행
docker-compose up -d chromadb rag-service

# 프론트엔드만 개발
cd frontend
npm run dev

# 백엔드만 개발
cd backend
uvicorn app.main:app --reload

# RAG 서비스만 개발
cd backend
uvicorn app.rag.main:app --reload --port 8001
```

### **프로덕션 환경**

```bash
# 전체 서비스 실행
docker compose up -d
```

## 📱 접속 정보

- **프론트엔드**: http://localhost:3000 (개발) / http://localhost:80 (프로덕션)
- **백엔드 API**: http://localhost:8000
- **RAG Service**: http://localhost:8001
- **ChromaDB**: http://localhost:8003

### RAG Service API 엔드포인트

- `GET /health` - 헬스체크
- `GET /rag/health` - 상세 헬스체크 (의존성 포함)
- `POST /rag/merge` - 상담 요약 생성 및 인덱싱
- `POST /rag/chat` - 의료 지식 기반 채팅
- `POST /rag/reindex` - 기존 상담 재인덱싱

## 🔄 마이그레이션 히스토리

- **2024-08-24**: RAG 서비스 독립 구축 완료
  - Clean Architecture 기반 설계
  - ChromaDB 벡터 데이터베이스 통합
  - 하이브리드 검색 시스템 구현
  - Docker 컨테이너화 및 헬스체크 구성
- **2024-08-08**: Vite + React Router → Next.js 15 + React 19 마이그레이션 완료
  - App Router 도입
  - 서버 컴포넌트 활용
  - React 19 use Hook 적용
  - Docker 설정 업데이트

## 🔐 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# LLM 설정
LLM_MODEL=gpt-4  # 또는 gemini-pro, claude-3 등
LLM_API_KEY=your-api-key

# 임베딩 모델 (선택사항)
EMBEDDING_MODEL=jhgan/ko-sroberta-multitask
```

## 📝 라이선스

MIT License
