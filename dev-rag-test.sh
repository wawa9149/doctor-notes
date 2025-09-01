#!/bin/bash

echo "🚀 Doctor Notes RAG 테스트 환경 시작..."

# 기존 프로세스 정리
echo "🧹 기존 프로세스 정리 중..."
pkill -f "uvicorn.*8000" 2>/dev/null
pkill -f "uvicorn.*8001" 2>/dev/null
pkill -f "next.*300" 2>/dev/null

# ChromaDB 컨테이너 정리 및 시작
echo "📊 ChromaDB 컨테이너 준비 중..."
docker stop doctor-notes-chromadb-dev 2>/dev/null
docker rm doctor-notes-chromadb-dev 2>/dev/null

docker run -d --name doctor-notes-chromadb-dev -p 8003:8000 \
  -e CHROMA_SERVER_AUTH_PROVIDER=none \
  -e CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER=none \
  -e ANONYMIZED_TELEMETRY=false \
  chromadb/chroma:latest

echo "⏳ ChromaDB 시작 대기 중..."
sleep 10

# ChromaDB 연결 확인
echo "🔍 ChromaDB 연결 확인 중..."
if curl -s http://localhost:8003/api/v1/heartbeat > /dev/null; then
    echo "✅ ChromaDB 연결 성공!"
else
    echo "❌ ChromaDB 연결 실패. 잠시 더 대기 중..."
    sleep 5
fi

# 백엔드 디렉토리로 이동
cd backend

# 가상환경 활성화 확인
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "🔄 가상환경 활성화 중..."
    source venv/bin/activate
fi

# 의존성 설치 확인
echo "📦 의존성 설치 확인 중..."
pip install -r requirements.txt

# RAG 서비스 환경변수 설정 및 시작
echo "🤖 RAG 서비스 시작 중..."
export PYTHONPATH=$(pwd)
export CHROMA_HOST=localhost
export CHROMA_PORT=8003

# RAG 서비스 백그라운드 실행
uvicorn app.rag.main:app --host 0.0.0.0 --port 8001 --reload &
RAG_PID=$!

echo "⏳ RAG 서비스 시작 대기 중..."
sleep 5

# RAG 서비스 연결 확인
echo "🔍 RAG 서비스 연결 확인 중..."
if curl -s http://localhost:8001/health > /dev/null; then
    echo "✅ RAG 서비스 연결 성공!"
else
    echo "⚠️ RAG 서비스 연결 실패. 로그를 확인하세요."
fi

# 메인 백엔드 시작
echo "🔧 백엔드 API 시작 중..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "⏳ 백엔드 API 시작 대기 중..."
sleep 3

# 백엔드 연결 확인
echo "🔍 백엔드 API 연결 확인 중..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ 백엔드 API 연결 성공!"
else
    echo "⚠️ 백엔드 API 연결 실패. 로그를 확인하세요."
fi

# 프론트엔드 시작
echo "🎨 프론트엔드 시작 중..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 모든 서비스가 시작되었습니다!"
echo ""
echo "📌 서비스 정보:"
echo "🌐 프론트엔드: http://localhost:3000 (또는 3001)"
echo "🔧 백엔드 API: http://localhost:8000"
echo "🤖 RAG 서비스: http://localhost:8001"
echo "📊 ChromaDB: http://localhost:8003"
echo ""
echo "🧪 RAG 테스트 명령어:"
echo "curl -X POST http://localhost:8001/rag/chat \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"tenant_id\": \"hospA\","
echo "    \"patient_id\": \"p123\","
echo "    \"encounter_id\": \"e789\","
echo "    \"question\": \"환자의 증상은?\","
echo "    \"recent_turns\": []"
echo "  }'"
echo ""
echo "🧪 백엔드 챗봇 테스트:"
echo "curl -X POST http://localhost:8000/chat/query \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"text\": \"환자의 증상은?\"}'"
echo ""
echo "🔍 서비스 상태 확인:"
echo "- 백엔드: curl http://localhost:8000/health"
echo "- RAG: curl http://localhost:8001/health"
echo "- ChromaDB: curl http://localhost:8003/api/v1/heartbeat"
echo ""
echo "❌ 종료하려면 Ctrl+C를 누르세요..."

# 종료 시그널 처리
cleanup() {
    echo ""
    echo "🛑 서비스 종료 중..."
    echo "- RAG 서비스 종료..."
    kill $RAG_PID 2>/dev/null
    echo "- 백엔드 API 종료..."
    kill $BACKEND_PID 2>/dev/null
    echo "- 프론트엔드 종료..."
    kill $FRONTEND_PID 2>/dev/null
    echo "- ChromaDB 컨테이너 종료..."
    docker stop doctor-notes-chromadb-dev 2>/dev/null
    docker rm doctor-notes-chromadb-dev 2>/dev/null
    echo "✅ 모든 서비스가 종료되었습니다."
    exit 0
}

trap cleanup SIGINT SIGTERM

# 무한 대기
wait
