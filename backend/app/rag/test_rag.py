"""
RAG 서비스 테스트 스크립트
독립 실행 RAG 서비스의 엔드포인트 테스트
"""
import asyncio
import httpx
import json
import sys
import os
from typing import Dict, Any

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# RAG 서비스 URL
RAG_SERVICE_URL = "http://localhost:8001"

# 테스트 데이터
TEST_DATA = {
    "tenant_id": "test_hospital",
    "patient_id": "patient_001",
    "encounter_id": "encounter_20250823_001",
    "paragraph": [
        {
            "paragraph_speaker": "doctor",
            "paragraph_text": "안녕하세요. 오늘 어떻게 오셨나요?"
        },
        {
            "paragraph_speaker": "patient",
            "paragraph_text": "며칠 전부터 머리가 계속 아프고 어지러워요."
        },
        {
            "paragraph_speaker": "doctor",
            "paragraph_text": "언제부터 증상이 시작되었나요? 다른 증상은 없으신가요?"
        },
        {
            "paragraph_speaker": "patient",
            "paragraph_text": "3일 전부터요. 가끔 속도 울렁거려요."
        },
        {
            "paragraph_speaker": "doctor",
            "paragraph_text": "혈압을 측정해보겠습니다. 최근에 스트레스를 많이 받으셨나요?"
        },
        {
            "paragraph_speaker": "patient",
            "paragraph_text": "네, 회사 일로 스트레스가 많았어요."
        }
    ],
    "doctor_note": "환자는 3일 전부터 두통과 어지럼증 호소. 스트레스성 긴장성 두통 의심. 혈압 120/80, 맥박 72회/분 정상. 신경학적 검사 특이사항 없음."
}


async def test_health():
    """헬스체크 테스트"""
    print("\n=== 헬스체크 테스트 ===")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{RAG_SERVICE_URL}/health")
            print(f"Status: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
            return response.status_code == 200
        except Exception as e:
            print(f"Error: {e}")
            return False


async def test_merge():
    """상담요약 생성 테스트"""
    print("\n=== /rag/merge 테스트 ===")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{RAG_SERVICE_URL}/rag/merge",
                json=TEST_DATA
            )
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"SOAP Summary:\n{result.get('soap_summary', 'N/A')}")
                print(f"Citations: {result.get('citations', [])}")
                return True
            else:
                print(f"Error: {response.text}")
                return False
        except Exception as e:
            print(f"Error: {e}")
            return False


async def test_chat():
    """질의응답 테스트"""
    print("\n=== /rag/chat 테스트 ===")
    
    chat_data = {
        "tenant_id": TEST_DATA["tenant_id"],
        "patient_id": TEST_DATA["patient_id"],
        "encounter_id": TEST_DATA["encounter_id"],
        "question": "환자가 호소한 주요 증상은 무엇인가요?",
        "recent_turns": [
            {"role": "user", "text": "혈압은 정상인가요?"},
            {"role": "assistant", "text": "네, 혈압은 120/80으로 정상 범위입니다."}
        ]
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{RAG_SERVICE_URL}/rag/chat",
                json=chat_data
            )
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Answer: {result.get('answer', 'N/A')}")
                print(f"Citations: {result.get('citations', [])}")
                print(f"Rolling Summary: {result.get('rolling_summary_next', 'N/A')}")
                return True
            else:
                print(f"Error: {response.text}")
                return False
        except Exception as e:
            print(f"Error: {e}")
            return False


async def test_reindex():
    """재색인 테스트"""
    print("\n=== /rag/reindex 테스트 ===")
    
    reindex_data = {
        "tenant_id": TEST_DATA["tenant_id"],
        "patient_id": TEST_DATA["patient_id"],
        "encounter_id": TEST_DATA["encounter_id"],
        "version": 2,
        "soap_summary": """S: 환자는 3일 전부터 두통과 어지럼증을 호소함. 스트레스가 원인으로 추정.
O: 혈압 120/80, 맥박 72회/분. 신경학적 검사 정상.
A: 스트레스성 긴장성 두통
P: 충분한 휴식 권고, 진통제 처방, 증상 지속 시 재방문.""",
        "idempotency_key": "reindex_test_001"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{RAG_SERVICE_URL}/rag/reindex",
                json=reindex_data
            )
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Result: {json.dumps(result, indent=2, ensure_ascii=False)}")
                return True
            else:
                print(f"Error: {response.text}")
                return False
        except Exception as e:
            print(f"Error: {e}")
            return False


async def main():
    """모든 테스트 실행"""
    print("=" * 50)
    print("RAG 서비스 테스트 시작")
    print("=" * 50)
    
    # 헬스체크
    if not await test_health():
        print("\n⚠️ RAG 서비스가 실행 중이지 않습니다.")
        print("다음 명령으로 서비스를 시작하세요:")
        print("  cd backend/app/rag")
        print("  python main.py")
        return
    
    # 순차적으로 테스트 실행
    print("\n1. 상담요약 생성 테스트...")
    await test_merge()
    
    print("\n2. 잠시 대기 (인덱싱 완료 대기)...")
    await asyncio.sleep(2)
    
    print("\n3. 질의응답 테스트...")
    await test_chat()
    
    print("\n4. 재색인 테스트...")
    await test_reindex()
    
    print("\n" + "=" * 50)
    print("테스트 완료")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())