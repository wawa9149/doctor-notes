from fastapi import APIRouter
from app.schemas.emr import MergeRequest, MergeResponse

router = APIRouter()

@router.post("/", response_model=MergeResponse)
async def merge_consultation_content(request: MergeRequest):
    """
    진료 대화 내용과 의사 노트를 합쳐 SOAP 노트를 생성합니다.
    (현재는 RAG 연동 전으로, 더미 데이터를 반환합니다)
    """
    # TODO: RAG 서비스(/rag/merge) 호출 로직 구현 필요
    
    # 더미 응답 생성
    dummy_soap_summary = (
        "S (Subjective): 환자는 머리가 아프고 어지럽다고 호소함. 오늘 하루 동안 다른 특별한 증상은 없었다고 함.\n"
        "O (Objective): 혈압 정상 범위. 신경학적 검사 상 특이사항 없음. 제공된 의사 노트에 따르면 '두통과 어지러움을 호소. 혈압 정상 범위. 신경학적 검사 특이사항 없음.'으로 기록됨.\n"
        "A (Assessment): 상세 불명의 두통 및 현기증. 추가적인 관찰 및 검사가 필요할 수 있음.\n"
        "P (Plan): 증상 완화를 위한 약물 처방 고려. 환자에게 충분한 휴식을 취하고 증상 변화를 관찰하도록 교육함. 증상 악화 시 즉시 내원하도록 안내함."
    )
    
    return MergeResponse(soap_summary=dummy_soap_summary)
