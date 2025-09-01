from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import logging
from pydantic import ValidationError

from app.db.session import get_db
from app.services.fhir_mapper import FHIRMapper
from app.models.emr import Patient, Encounter, Condition, Observation, MedicationStatement, Conversation, SOAPNote, ChatSession
from app.schemas.emr import (
    EMRSaveRequest,
    EMRSaveResponse,
    EMRRecord,
    PatientListResponse,
    EncounterResponse,
    EncounterCreateRequest,
    EncounterStatusUpdate,
    PatientResponse,
    PatientCreateRequest,
    ConditionResponse,
    ObservationResponse,
    MedicationStatementResponse,
    ConversationResponse,
    SOAPNoteResponse,
    ChatSessionResponse,
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


@router.post("/encounters", response_model=EncounterResponse)
def create_encounter(
    request: EncounterCreateRequest,
    db: Session = Depends(get_db)
):
    """새로운 진료 접수를 생성합니다."""
    try:
        # 환자 존재 확인
        patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="환자를 찾을 수 없습니다."
            )
        
        # Encounter 생성
        encounter_data = {
            'patient_id': request.patient_id,
            'status': 'in-progress',  # 기본값: 진행 중
            'class_': 'AMB',  # 외래진료
            'type': request.encounter_type or 'consultation',
            'period': {
                'start': datetime.now().isoformat(),
                'end': None
            },
            'reason_code': request.reason_code,
            'reason_text': request.reason_text
        }
        
        encounter = Encounter(**encounter_data)
        db.add(encounter)
        db.flush()  # ID 생성을 위해 flush
        
        # Encounter 종료 시 period.end 업데이트를 위한 메타데이터 저장
        encounter.meta = {
            'created_by': request.created_by,
            'notes': request.notes
        }
        
        db.commit()
        db.refresh(encounter)
        
        return EncounterResponse(
            id=encounter.id,
            patient_id=encounter.patient_id,
            status=encounter.status,
            class_=encounter.class_,
            type=encounter.type,
            period=encounter.period,
            reason_code=encounter.reason_code,
            reason_text=encounter.reason_text,
            created_at=encounter.created_at,
            updated_at=encounter.updated_at
        )
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in create_encounter: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"데이터베이스 오류가 발생했습니다: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in create_encounter: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"진료 접수 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    request: PatientCreateRequest,
    db: Session = Depends(get_db)
):
    """새로운 환자를 등록합니다."""
    logger.info(f"Received request to create patient: {request.dict()}")
    try:
        # 중복 확인
        existing_patient = db.query(Patient).filter(Patient.identifier == request.identifier).first()
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 동일한 환자 식별자(차트번호)가 존재합니다."
            )

        patient_data = {
            'identifier': request.identifier,
            'name': {'text': request.name},
            'birth_date': datetime.strptime(request.birth_date, '%Y-%m-%d').date(),
            'gender': request.gender
        }
        
        patient = Patient(**patient_data)
        db.add(patient)
        db.commit()
        db.refresh(patient)
        
        return patient

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in create_patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"데이터베이스 오류가 발생했습니다: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in create_patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"환자 생성 중 오류가 발생했습니다: {str(e)}"
        )

@router.put("/encounters/{encounter_id}/status")
def update_encounter_status(
    encounter_id: int,
    status_update: EncounterStatusUpdate,
    db: Session = Depends(get_db)
):
    """진료 접수 상태를 업데이트합니다."""
    try:
        encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
        if not encounter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="진료 접수를 찾을 수 없습니다."
            )
        
        encounter.status = status_update.status
        
        # finished 상태로 변경 시 period.end 설정
        if status_update.status == 'finished':
            encounter.period = {
                'start': encounter.period.get('start'),
                'end': datetime.now().isoformat()
            }
        
        db.commit()
        db.refresh(encounter)
        
        return {"message": f"진료 접수 상태가 '{status_update.status}'로 업데이트되었습니다."}
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in update_encounter_status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"데이터베이스 오류가 발생했습니다: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in update_encounter_status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"진료 접수 상태 업데이트 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/patients", response_model=List[PatientListResponse])
def get_patients(db: Session = Depends(get_db)):
    """모든 환자 목록을 조회합니다."""
    patients = db.query(Patient).order_by(Patient.created_at.desc()).all()
    return patients

@router.get("/patients/{patient_id}", response_model=PatientListResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """환자 상세 정보를 조회합니다."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="환자를 찾을 수 없습니다."
        )
    return patient

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
        # 각 Encounter에 대한 상세 정보 조회
        conditions = db.query(Condition).filter(Condition.encounter_id == encounter.id).all()
        observations = db.query(Observation).filter(Observation.encounter_id == encounter.id).all()
        medications = db.query(MedicationStatement).filter(MedicationStatement.encounter_id == encounter.id).all()
        conversation = db.query(Conversation).filter(Conversation.encounter_id == encounter.id).first()
        soap_notes_from_db = db.query(SOAPNote).filter(SOAPNote.encounter_id == encounter.id).all()
        chat_sessions = db.query(ChatSession).filter(ChatSession.encounter_id == encounter.id).all()

        validated_soap_notes = []
        for s in soap_notes_from_db:
            try:
                validated_soap_notes.append(SOAPNoteResponse.model_validate(s))
            except ValidationError as e:
                logger.warning(f"SOAPNote(id={s.id}) validation failed for citations: {e}. Replacing with empty list.")
                # Pydantic 모델은 불변이므로, 딕셔너리로 변환하여 수정 후 다시 검증
                s_dict = {c.name: getattr(s, c.name) for c in s.__table__.columns}
                s_dict["citations"] = []
                validated_soap_notes.append(SOAPNoteResponse.model_validate(s_dict))


        record = EMRRecord(
            encounter=EncounterResponse.model_validate(encounter),
            conditions=[ConditionResponse.model_validate(c) for c in conditions],
            observations=[ObservationResponse.model_validate(o) for o in observations],
            medications=[MedicationStatementResponse.model_validate(m) for m in medications],
            conversation=ConversationResponse.model_validate(conversation) if conversation else None,
            soap_notes=validated_soap_notes,
            chat_sessions=[ChatSessionResponse.model_validate(cs) for cs in chat_sessions]
        )
        records.append(record)
    
    return records


@router.delete("/records/{encounter_id}")
def delete_encounter_record(
    encounter_id: int,
    db: Session = Depends(get_db)
):
    """특정 진료 기록을 삭제합니다."""
    try:
        # Encounter 조회
        encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
        if not encounter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="진료 기록을 찾을 수 없습니다."
            )
        
        # 관련 데이터 삭제 (CASCADE 설정에 따라 자동 삭제됨)
        # Conversation 삭제
        if encounter.conversation:
            db.delete(encounter.conversation)
        
        # Condition 삭제
        for condition in encounter.conditions:
            db.delete(condition)
        
        # Observation 삭제
        for observation in encounter.observations:
            db.delete(observation)
        
        # MedicationStatement 삭제
        for medication in encounter.medications:
            db.delete(medication)
        
        # Encounter 삭제
        db.delete(encounter)
        db.commit()
        
        return {"message": "진료 기록이 성공적으로 삭제되었습니다."}
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in delete_encounter_record: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"데이터베이스 오류가 발생했습니다: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in delete_encounter_record: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"기록 삭제 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """환자와 관련된 모든 데이터를 삭제합니다."""
    try:
        # 환자 조회
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="환자를 찾을 수 없습니다."
            )
        
        # 환자의 모든 Encounter 조회
        encounters = db.query(Encounter).filter(Encounter.patient_id == patient_id).all()
        
        # 각 Encounter의 관련 데이터 삭제
        for encounter in encounters:
            # Conversation 삭제
            if encounter.conversation:
                db.delete(encounter.conversation)
            
            # Condition 삭제
            for condition in encounter.conditions:
                db.delete(condition)
            
            # Observation 삭제
            for observation in encounter.observations:
                db.delete(observation)
            
            # MedicationStatement 삭제
            for medication in encounter.medications:
                db.delete(medication)
            
            # Encounter 삭제
            db.delete(encounter)
        
        # 환자 삭제
        db.delete(patient)
        db.commit()
        
        return {"message": "환자와 관련된 모든 데이터가 성공적으로 삭제되었습니다."}
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in delete_patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"데이터베이스 오류가 발생했습니다: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in delete_patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"환자 삭제 중 오류가 발생했습니다: {str(e)}"
        )
