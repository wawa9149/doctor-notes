from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.orm import relationship, declarative_base
import enum
from datetime import datetime

Base = declarative_base()

class ResourceType(enum.Enum):
    Patient = "Patient"
    Encounter = "Encounter"
    Condition = "Condition"
    Observation = "Observation"
    MedicationStatement = "MedicationStatement"
    Conversation = "Conversation"

class Patient(Base):
    __tablename__ = "patients"
    
    # Resource 메타데이터
    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String, default="Patient")
    meta = Column(JSON)  # 버전, 프로필, 태그 등
    
    # 필수 정보
    identifier = Column(String, unique=True)  # 환자 식별자 (차트번호 등)
    name = Column(JSON)  # { "text": "전체 이름", "family": "성", "given": ["이름"] }
    gender = Column(String)  # male | female | other | unknown
    birth_date = Column(Date)
    
    # 선택 정보
    telecom = Column(JSON)  # [{ "system": "phone", "value": "번호", "use": "home" }]
    address = Column(JSON)  # { "text": "전체 주소", "postalCode": "우편번호" }
    
    # 관계
    encounters = relationship("Encounter", back_populates="patient")
    
    # 메타데이터
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Encounter(Base):
    __tablename__ = "encounters"
    
    # Resource 메타데이터
    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String, default="Encounter")
    meta = Column(JSON)
    
    # 필수 정보
    patient_id = Column(Integer, ForeignKey("patients.id"))
    status = Column(String)  # planned | arrived | triaged | in-progress | finished | cancelled
    class_ = Column(String)  # Column name 'class_' to avoid Python keyword conflict
    type = Column(String)
    
    # 선택 정보
    period = Column(JSON)  # { "start": "2024-03-15T09:00:00", "end": "2024-03-15T09:30:00" }
    reason_code = Column(JSON)  # CodeableConcept
    reason_text = Column(String)
    
    # 관계
    patient = relationship("Patient", back_populates="encounters")
    conditions = relationship("Condition", back_populates="encounter")
    observations = relationship("Observation", back_populates="encounter")
    medications = relationship("MedicationStatement", back_populates="encounter")
    conversation = relationship("Conversation", back_populates="encounter", uselist=False)
    
    # 메타데이터
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Condition(Base):
    __tablename__ = "conditions"
    
    # Resource 메타데이터
    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String, default="Condition")
    meta = Column(JSON)
    
    # 필수 정보
    encounter_id = Column(Integer, ForeignKey("encounters.id"))
    code = Column(JSON)  # { "code": "코드", "system": "코드체계", "display": "표시명" }
    clinical_status = Column(String)  # active | recurrence | inactive | remission | resolved
    verification_status = Column(String)  # unconfirmed | provisional | differential | confirmed
    
    # 시간 정보
    onset_datetime = Column(DateTime)  # 증상 시작 시간
    abatement_datetime = Column(DateTime)  # 증상 종료 시간
    recorded_date = Column(DateTime, default=datetime.utcnow)
    
    # 부가 정보
    severity = Column(String)  # mild | moderate | severe
    body_site = Column(JSON)  # [{ "code": "코드", "display": "부위명" }]
    
    # 관계
    encounter = relationship("Encounter", back_populates="conditions")
    
    # 메타데이터
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Observation(Base):
    __tablename__ = "observations"
    
    # Resource 메타데이터
    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String, default="Observation")
    meta = Column(JSON)
    
    # 필수 정보
    encounter_id = Column(Integer, ForeignKey("encounters.id"))
    status = Column(String)  # registered | preliminary | final | amended
    code = Column(JSON)  # { "code": "코드", "system": "코드체계", "display": "관찰항목명" }
    
    # 관찰 값
    value_quantity = Column(JSON)  # { "value": 수치, "unit": "단위", "system": "단위체계" }
    value_string = Column(Text)    # 문자열 값
    value_boolean = Column(Boolean)  # 참/거짓 값
    value_codeable_concept = Column(JSON)  # 코드화된 값
    
    # 시간 정보
    effective_datetime = Column(DateTime)  # 관찰 시점
    
    # 관계
    encounter = relationship("Encounter", back_populates="observations")
    
    # 메타데이터
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MedicationStatement(Base):
    __tablename__ = "medication_statements"
    
    # Resource 메타데이터
    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String, default="MedicationStatement")
    meta = Column(JSON)
    
    # 필수 정보
    encounter_id = Column(Integer, ForeignKey("encounters.id"))
    status = Column(String)  # active | completed | entered-in-error | intended | stopped | on-hold
    medication = Column(JSON)  # { "code": "약품코드", "system": "코드체계", "display": "약품명" }
    
    # 투약 정보
    dosage = Column(JSON)  # {
                          #   "text": "1일 3회 식후 30분",
                          #   "timing": { "frequency": 3, "period": 1, "periodUnit": "d" },
                          #   "route": { "code": "PO", "display": "경구" },
                          #   "doseAndRate": [{ "doseQuantity": { "value": 1, "unit": "정" }}]
                          # }
    
    # 시간 정보
    effective_period = Column(JSON)  # { "start": "시작일", "end": "종료일" }
    date_asserted = Column(DateTime, default=datetime.utcnow)
    
    # 관계
    encounter = relationship("Encounter", back_populates="medications")
    
    # 메타데이터
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Conversation(Base):
    __tablename__ = "conversations"
    
    # Resource 메타데이터
    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String, default="Conversation")
    meta = Column(JSON)
    
    # 필수 정보
    encounter_id = Column(Integer, ForeignKey("encounters.id"), unique=True)  # 1:1 관계
    raw_text = Column(Text, nullable=False)  # 원본 대화 내용
    
    # 선택 정보
    summary = Column(Text)  # 대화 요약 (향후 LLM으로 생성 가능)
    participants = Column(JSON)  # { "doctor": "김의사", "patient": "이환자" }
    language = Column(String, default="ko")  # 대화 언어
    
    # 관계
    encounter = relationship("Encounter", back_populates="conversation")
    
    # 메타데이터
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Base를 명시적으로 export
__all__ = ['Base']
