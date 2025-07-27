from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.db.session import get_db
from app.services.fhir_mapper import FHIRMapper
from app.models.emr import Patient, Encounter, Condition, Observation, MedicationStatement, Conversation
from app.schemas.emr import (
    EMRSaveRequest,
    EMRSaveResponse,
    EMRRecord,
    PatientListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()
fhir_mapper = FHIRMapper()

@router.post("/save", response_model=EMRSaveResponse, status_code=status.HTTP_201_CREATED)
def save_emr(
    request: EMRSaveRequest,
    db: Session = Depends(get_db)
):
    try:
        # 환자 정보 매핑 (LLM 결과 대신 입력받은 정보 사용)
        patient_data = {
            'identifier': request.patient_identifier,
            'name': {'text': request.patient_name},
            'birth_date': datetime.strptime(request.patient_birth_date, '%Y-%m-%d').date(),
            'gender': request.patient_gender
        }
        
        patient = db.query(Patient).filter(Patient.identifier == request.patient_identifier).first()
        
        if not patient:
            patient = Patient(**patient_data)
            db.add(patient)
            db.flush()
        else:
            # 기존 환자 정보 업데이트
            for key, value in patient_data.items():
                setattr(patient, key, value)
        
        # Encounter 생성
        encounter_data = fhir_mapper.map_encounter_data(request.llm_analysis_result)
        encounter = Encounter(patient_id=patient.id, **encounter_data)
        db.add(encounter)
        db.flush()
        
        # Conversation 생성
        conversation_data = {
            'raw_text': request.conversation_text,
            'participants': {
                'patient': request.patient_name,
                # 향후 의사 정보도 추가 가능
            }
        }
        conversation = Conversation(encounter_id=encounter.id, **conversation_data)
        db.add(conversation)
        
        # 기타 리소스 생성
        sub_resources = fhir_mapper.map_sub_resources(request.llm_analysis_result, encounter.id)
        
        for condition_data in sub_resources.get("conditions", []):
            db.add(Condition(**condition_data))
        for obs_data in sub_resources.get("observations", []):
            db.add(Observation(**obs_data))
        for med_data in sub_resources.get("medication_statements", []):
            db.add(MedicationStatement(**med_data))
        
        db.commit()
        
        return EMRSaveResponse(
            patient_id=patient.id,
            encounter_id=encounter.id
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in save_emr: {str(e)}")
        logger.error(f"Request data: {request}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"데이터베이스 오류가 발생했습니다: {str(e)}")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in save_emr: {str(e)}")
        logger.error(f"Request data: {request}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"데이터 처리 중 오류가 발생했습니다: {str(e)}")


@router.get("/patients", response_model=List[PatientListResponse])
def get_patients(db: Session = Depends(get_db)):
    """모든 환자 목록을 조회합니다."""
    patients = db.query(Patient).order_by(Patient.created_at.desc()).all()
    return patients


@router.get("/records/{patient_id}", response_model=List[EMRRecord])
def get_patient_records(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """환자의 모든 진료 기록을 조회합니다."""
    encounters = (
        db.query(Encounter)
        .filter(Encounter.patient_id == patient_id)
        .order_by(Encounter.created_at.desc())
        .all()
    )
    
    if not encounters:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="환자를 찾을 수 없습니다."
        )
    
    records = []
    for encounter in encounters:
        record = EMRRecord(
            encounter=encounter,
            conditions=encounter.conditions,
            observations=encounter.observations,
            medications=encounter.medications,
            conversation=encounter.conversation
        )
        records.append(record)
    
    return records
