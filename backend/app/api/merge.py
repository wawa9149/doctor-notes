import httpx
import logging
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.schemas.emr import MergeRequest, MergeResponse, SOAPNoteCreate, SOAPNoteResponse
from app.models.emr import SOAPNote
from app.db.session import get_db
from typing import List

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=MergeResponse)
async def merge_consultation_content(request: MergeRequest, db: Session = Depends(get_db)):
    """
    진료 대화 내용과 의사 노트를 합쳐 SOAP 노트를 생성합니다.
    RAG 서비스를 호출하여 실제 SOAP 노트를 생성합니다.
    """
    try:
        logger.info(f"RAG 서비스에 merge 요청 전송: encounter_id={request.encounter_id}")
        
        # RAG 서비스 호출
        async with httpx.AsyncClient(timeout=60.0) as client:
            rag_url = "http://localhost:8001/rag/merge"
            
            response = await client.post(
                rag_url,
                json=request.dict(),
                timeout=60.0
            )
            
            if response.status_code == 200:
                rag_response = response.json()
                soap_summary = rag_response.get("soap_summary", "")
                citations = rag_response.get("citations", [])
                
                logger.info("RAG 서비스에서 SOAP 노트 생성 완료")
                
                # SOAP 노트를 데이터베이스에 저장
                # encounter_id가 문자열인 경우 숫자로 변환
                encounter_id = request.encounter_id
                if isinstance(encounter_id, str) and encounter_id.startswith("e"):
                    encounter_id = int(encounter_id.replace("e", ""))
                elif isinstance(encounter_id, str):
                    encounter_id = int(encounter_id)
                
                soap_note = SOAPNote(
                    encounter_id=encounter_id,
                    soap_summary=soap_summary,
                    citations=citations
                )
                db.add(soap_note)
                db.commit()
                db.refresh(soap_note)
                
                return MergeResponse(soap_summary=soap_summary)
            else:
                logger.error(f"RAG 서비스 오류: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"RAG 서비스 오류: {response.status_code}"
                )
                
    except httpx.RequestError as e:
        logger.error(f"RAG 서비스 연결 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG 서비스에 연결할 수 없습니다. 서비스가 실행 중인지 확인해주세요."
        )
    except httpx.TimeoutException as e:
        logger.error(f"RAG 서비스 타임아웃: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="RAG 서비스 응답 시간이 초과되었습니다."
        )
    except Exception as e:
        logger.error(f"Merge 요청 처리 중 예상치 못한 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="서버 내부 오류가 발생했습니다."
        )


@router.post("/save-soap", response_model=SOAPNoteResponse)
async def save_soap_note(request: SOAPNoteCreate, db: Session = Depends(get_db)):
    """SOAP 노트를 데이터베이스에 저장합니다."""
    try:
        soap_note = SOAPNote(
            encounter_id=request.encounter_id,
            soap_summary=request.soap_summary,
            citations=request.citations
        )
        db.add(soap_note)
        db.commit()
        db.refresh(soap_note)
        
        return soap_note
    except Exception as e:
        logger.error(f"SOAP 노트 저장 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SOAP 노트 저장에 실패했습니다."
        )


@router.get("/soap/{encounter_id}", response_model=List[SOAPNoteResponse])
async def get_soap_notes(encounter_id: int, db: Session = Depends(get_db)):
    """특정 encounter의 SOAP 노트들을 조회합니다."""
    soap_notes = db.query(SOAPNote).filter(SOAPNote.encounter_id == encounter_id).all()
    return soap_notes
