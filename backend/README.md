# Doctor Notes Backend

AI를 활용한 의료진과 환자의 대화 분석 및 EMR(전자의무기록) 시스템의 백엔드 API 서버입니다.

## 🚀 기술 스택

- **Framework**: FastAPI
- **Database**: SQLite (개발) / PostgreSQL (프로덕션)
- **ORM**: SQLAlchemy 2.0+
- **AI/LLM**: OpenAI GPT
- **Validation**: Pydantic
- **API Documentation**: FastAPI 자동 생성 (Swagger UI)
- **Container**: Docker

## 📁 프로젝트 구조

```
backend/
├── app/
│   ├── api/              # API 라우터
│   │   ├── analyze.py    # 대화 분석 API
│   │   └── emr.py        # EMR 관리 API
│   ├── models/           # 데이터베이스 모델
│   │   └── emr.py        # EMR 관련 모델
│   ├── schemas/          # Pydantic 스키마
│   ├── services/         # 비즈니스 로직
│   ├── db/               # 데이터베이스 설정
│   ├── config.py         # 환경 설정
│   └── main.py           # FastAPI 앱 진입점
├── scripts/              # 유틸리티 스크립트
├── requirements.txt      # Python 의존성
├── Dockerfile           # Docker 이미지 설정
├── uvicorn_run.sh       # 개발 서버 실행 스크립트
└── emr.db               # SQLite 데이터베이스 (개발용)
```

## 🛠️ 설치 및 실행

### 1. 로컬 개발 환경

```bash
# 1. Python 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 또는
venv\Scripts\activate     # Windows

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 환경 변수 설정

# 4. 개발 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Docker를 사용한 실행

```bash
# 1. Docker 이미지 빌드
docker build -t doctor-notes-backend .

# 2. 컨테이너 실행
docker run -p 8000:8000 doctor-notes-backend
```

### 3. Docker Compose를 사용한 실행

프로젝트 루트 디렉토리에서:

```bash
# 전체 스택 실행 (프론트엔드 + 백엔드 + 데이터베이스)
docker-compose up -d

# 백엔드만 실행
docker-compose up backend
```

## 🔧 환경 변수

`.env` 파일에 다음 환경 변수들을 설정하세요:

```env
# OpenAI API 설정
OPENAI_API_KEY=your_openai_api_key_here

# 데이터베이스 설정
DATABASE_URL=sqlite:///./emr.db

# CORS 설정
ALLOWED_ORIGINS=http://localhost:3000,http://147.47.41.49:3000,http://147.47.41.49:8008

# 서버 설정
HOST=0.0.0.0
PORT=8000
```

## 📚 API 문서

서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔌 API 엔드포인트

### 대화 분석 API (`/analyze`)

#### POST `/analyze`

의사와 환자의 대화를 AI로 분석하여 FHIR 형식의 EMR 데이터로 변환합니다.

**Request Body:**

```json
{
  "text": "의사와 환자의 대화 내용"
}
```

**Response:**

```json
{
  "Patient": { ... },
  "Encounter": { ... },
  "Condition": { ... },
  "Observation": [ ... ],
  "MedicationStatement": [ ... ]
}
```

### EMR 관리 API (`/emr`)

#### GET `/emr/patients`

등록된 환자 목록을 조회합니다.

#### GET `/emr/patients/{patient_id}`

특정 환자의 상세 정보를 조회합니다.

#### GET `/emr/records/{patient_id}`

특정 환자의 진료 기록을 조회합니다.

#### POST `/emr/save`

분석된 EMR 데이터를 데이터베이스에 저장합니다.

**Request Body:**

```json
{
  "conversation_text": "대화 내용",
  "llm_analysis_result": { ... },
  "patient_identifier": "CH-12345",
  "patient_name": "홍길동",
  "patient_birth_date": "1990-01-01",
  "patient_gender": "male"
}
```

#### DELETE `/emr/records/{encounter_id}`

특정 진료 기록을 삭제합니다.

**Response:**

```json
{
  "message": "진료 기록이 성공적으로 삭제되었습니다."
}
```

#### DELETE `/emr/patients/{patient_id}`

환자와 관련된 모든 데이터를 삭제합니다.

**Response:**

```json
{
  "message": "환자와 관련된 모든 데이터가 성공적으로 삭제되었습니다."
}
```

## 🗄️ 데이터베이스 모델

### 주요 엔티티

- **Patient**: 환자 정보
- **Encounter**: 진료 접수 정보
- **Condition**: 진단 정보
- **Observation**: 관찰/검사 결과
- **MedicationStatement**: 처방 정보
- **Conversation**: 대화 내용

### FHIR 표준 준수

모든 데이터 모델은 FHIR(HL7 Fast Healthcare Interoperability Resources) 표준을 따릅니다.

## 🔒 보안

- **CORS**: 허용된 도메인에서만 API 접근 가능
- **입력 검증**: Pydantic을 통한 자동 데이터 검증
- **에러 처리**: 구조화된 에러 응답

## 🧪 테스트

```bash
# 테스트 실행
pytest

# 커버리지와 함께 테스트 실행
pytest --cov=app
```

## 📦 배포

### Docker 배포

```bash
# 프로덕션 이미지 빌드
docker build -t doctor-notes-backend:prod .

# 프로덕션 컨테이너 실행
docker run -d \
  -p 8000:8000 \
  -e OPENAI_API_KEY=your_key \
  -e DATABASE_URL=postgresql://... \
  doctor-notes-backend:prod
```

### 환경별 설정

- **개발**: SQLite 데이터베이스, 디버그 모드
- **프로덕션**: PostgreSQL 데이터베이스, 최적화된 설정

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 문제 해결

### 일반적인 문제들

1. **CORS 오류**: `.env` 파일에서 `ALLOWED_ORIGINS` 설정 확인
2. **OpenAI API 오류**: API 키가 올바르게 설정되었는지 확인
3. **데이터베이스 연결 오류**: `DATABASE_URL` 설정 확인

### 로그 확인

```bash
# Docker 로그 확인
docker logs <container_name>

# 로컬 실행 시 로그
uvicorn app.main:app --log-level debug
```

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.
