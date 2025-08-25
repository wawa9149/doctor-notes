# Doctor Notes Frontend

AI를 활용한 의료진과 환자의 대화 분석 및 EMR(전자의무기록) 시스템의 프론트엔드 애플리케이션입니다.

## 🚀 기술 스택

- **Framework**: Next.js 15
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **State Management**: React Hooks (useState, useEffect, use)
- **API Communication**: Fetch API
- **Build Tool**: Turbopack
- **Container**: Docker

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── analysis/           # 분석 결과 페이지
│   │   │   └── page.tsx
│   │   ├── records/            # 환자 기록 페이지
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── error.tsx           # 에러 페이지
│   │   ├── global-error.tsx    # 전역 에러 페이지
│   │   ├── globals.css         # 전역 스타일
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   └── page.tsx            # 홈페이지
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   ├── ErrorBoundary.tsx   # 에러 경계 컴포넌트
│   │   ├── HomePage.tsx        # 홈페이지 컴포넌트
│   │   └── PatientDetail.tsx   # 환자 상세 컴포넌트
│   ├── hooks/                  # 커스텀 훅
│   │   ├── useEMR.ts           # EMR 관련 훅
│   │   └── usePatients.tsx     # 환자 데이터 훅 (React 19 use)
│   ├── services/               # API 서비스
│   │   ├── emrService.ts       # EMR API 호출
│   │   └── patientService.ts   # 환자 API 호출
│   ├── types/                  # TypeScript 타입 정의
│   │   ├── api.ts              # API 관련 타입
│   │   ├── emr.ts              # EMR 관련 타입
│   │   └── patient.ts          # 환자 관련 타입
│   └── constants/              # 상수 정의
│       └── api.ts              # API 엔드포인트
├── public/                     # 정적 파일
├── Dockerfile                  # 프로덕션 Docker 설정
├── Dockerfile.dev              # 개발용 Docker 설정
├── next.config.ts              # Next.js 설정
├── package.json                # 프로젝트 의존성
├── tsconfig.json               # TypeScript 설정
└── tailwind.config.js          # Tailwind CSS 설정
```

## 🛠️ 설치 및 실행

### 1. 로컬 개발 환경

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 환경 변수 설정

# 3. 개발 서버 실행
npm run dev
```

### 2. Docker를 사용한 실행

```bash
# 1. 개발용 Docker 이미지 빌드
docker build -f Dockerfile.dev -t doctor-notes-frontend:dev .

# 2. 개발용 컨테이너 실행
docker run -p 3000:3000 -v $(pwd):/app doctor-notes-frontend:dev

# 3. 프로덕션용 Docker 이미지 빌드
docker build -t doctor-notes-frontend:prod .

# 4. 프로덕션용 컨테이너 실행
docker run -p 80:3000 doctor-notes-frontend:prod
```

### 3. Docker Compose를 사용한 실행

프로젝트 루트 디렉토리에서:

```bash
# 전체 스택 실행 (프론트엔드 + 백엔드 + 데이터베이스)
docker-compose up -d

# 개발 환경 실행
docker-compose --profile dev up -d
```

## 🔧 환경 변수

`.env.local` 파일에 다음 환경 변수들을 설정하세요:

```env
# 백엔드 API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Next.js 설정
NEXT_TELEMETRY_DISABLED=1
```

## 📱 주요 기능

### 🏠 홈페이지 (`/`)

- **새로운 진료 시작**: 환자 선택 및 대화 입력
- **환자 기록 조회**: 등록된 환자 목록 및 검색
- **AI 분석**: 대화 내용을 AI로 분석하여 EMR 데이터 생성

### 📊 분석 결과 페이지 (`/analysis`)

- **분석 결과 표시**: AI가 생성한 FHIR 형식의 EMR 데이터
- **환자 정보**: 선택된 환자의 상세 정보
- **상담 내용**: 입력된 대화 내용
- **EMR 저장**: 분석 결과를 데이터베이스에 저장

### 📋 환자 기록 페이지 (`/records/[id]`)

- **환자 상세 정보**: 환자의 기본 정보
- **진료 기록 목록**: 환자의 모든 진료 기록
- **기록 삭제**: 개별 진료 기록 삭제
- **환자 삭제**: 환자와 관련된 모든 데이터 삭제

## 🔧 개발 가이드

### **컴포넌트 작성 규칙**

```typescript
// 컴포넌트 파일명: PascalCase
// 예: PatientDetail.tsx

interface ComponentProps {
  // Props 타입 정의
}

export default function ComponentName({ prop }: ComponentProps) {
  // 컴포넌트 로직
  return (
    // JSX 반환
  );
}
```

### **API 호출 패턴**

```typescript
// services/exampleService.ts
export async function apiCall() {
  const response = await fetch(`${API_BASE_URL}/endpoint`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) throw new Error("API 호출 실패");
  return response.json();
}
```

### **React 19 use() Hook 사용**

```typescript
// hooks/useData.tsx
import { use } from "react";

let dataPromise: Promise<Data[]> | null = null;

function getDataPromise() {
  if (!dataPromise) {
    dataPromise = fetchData();
  }
  return dataPromise;
}

export function useData(): Data[] {
  return use(getDataPromise());
}
```

## 🧪 테스트

```bash
# 테스트 실행 (추후 Jest/React Testing Library 추가 예정)
npm test

# E2E 테스트 (추후 Playwright 추가 예정)
npm run test:e2e
```

## 📦 빌드 및 배포

### **개발 빌드**

```bash
npm run build
npm start
```

### **프로덕션 배포**

```bash
# Docker 이미지 빌드
docker build -t doctor-notes-frontend:prod .

# 컨테이너 실행
docker run -d -p 80:3000 doctor-notes-frontend:prod
```

### **정적 내보내기 (선택사항)**

```bash
# next.config.ts에서 output: 'export' 설정 후
npm run build
# out/ 디렉토리에 정적 파일 생성
```

## 🔒 보안

- **환경 변수**: 민감한 정보는 `NEXT_PUBLIC_` 접두사 없이 사용
- **API 호출**: `credentials: 'include'`로 쿠키 기반 인증
- **입력 검증**: 클라이언트 및 서버 양쪽에서 데이터 검증
- **XSS 방지**: React의 기본 XSS 방지 기능 활용

## 🚀 성능 최적화

### **Next.js 15 최적화**

- **App Router**: 서버 컴포넌트로 초기 로딩 속도 향상
- **Turbopack**: 빠른 개발 서버 및 빌드
- **자동 코드 분할**: 페이지별 자동 번들 분할

### **React 19 최적화**

- **use() Hook**: Promise 기반 데이터 페칭
- **Suspense**: 로딩 상태 관리
- **Error Boundary**: 에러 처리 및 복구

### **이미지 최적화**

- **Next.js Image**: 자동 이미지 최적화
- **WebP 포맷**: 최신 이미지 포맷 지원

## 🐛 디버깅

### **개발자 도구**

```bash
# 개발 서버 로그 확인
npm run dev

# 빌드 로그 확인
npm run build

# 린트 검사
npm run lint
```

### **브라우저 디버깅**

- React Developer Tools 설치
- Network 탭에서 API 호출 확인
- Console에서 에러 로그 확인

## 📚 참고 자료

- [Next.js 15 공식 문서](https://nextjs.org/docs)
- [React 19 공식 문서](https://react.dev)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.
