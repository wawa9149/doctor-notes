#!/bin/bash

echo "🧪 RAG 서비스 테스트 시작..."

# 서비스 상태 확인
echo "1. 서비스 상태 확인"
echo "📊 ChromaDB: $(curl -s http://localhost:8003/api/v1/heartbeat || echo 'FAILED')"
echo "🤖 RAG 서비스: $(curl -s http://localhost:8001/health || echo 'FAILED')"
echo "🔧 백엔드 API: $(curl -s http://localhost:8000/health || echo 'FAILED')"
echo ""

# RAG 서비스 직접 테스트
echo "2. RAG 서비스 직접 테스트"
curl -X POST http://localhost:8001/rag/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "tenant_id": "hospA",
    "patient_id": "p123", 
    "encounter_id": "e789",
    "question": "환자의 증상은?",
    "recent_turns": []
  }' | jq '.' 2>/dev/null || echo "RAG 서비스 응답 없음"

echo ""
echo ""

# 백엔드 챗봇 테스트
echo "3. 백엔드 챗봇 테스트"
curl -X POST http://localhost:8000/chat/query \
  -H 'Content-Type: application/json' \
  -d '{"text": "환자의 증상은?"}' | jq '.' 2>/dev/null || echo "백엔드 챗봇 응답 없음"

echo ""
echo "🎉 테스트 완료!"
