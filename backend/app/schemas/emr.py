from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

# 기본 스키마
class CodeableConcept(BaseModel):
    text: str

class Period(BaseModel):
    start: Optional[datetime] = None
    end: Optional[datetime] = None

# 공통 설정
model_config_with_json_encoders = ConfigDict(
    from_attributes=True,
    json_encoders={
        datetime: lambda v: v.isoformat(),
        date: lambda v: v.isoformat()
    }
)

# 응답 스키마
class PatientListResponse(BaseModel):
    id: int
    identifier: str
    name: Dict[str, Any]
    gender: str
    birth_date: date
    created_at: datetime
    model_config = model_config_with_json_encoders

class PatientCreateRequest(BaseModel):
    identifier: str
    name: str
    birth_date: str  # YYYY-MM-DD
    gender: str      # male | female | other | unknown

class PatientResponse(PatientListResponse):
    pass

class EncounterResponse(BaseModel):
    id: int
    patient_id: int
    status: str
    class_: str
    type: str
    period: Optional[Dict[str, Any]] = None
    reason_code: Optional[Dict[str, Any]] = None
    reason_text: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EncounterCreateRequest(BaseModel):
    patient_id: int
    encounter_type: Optional[str] = "consultation"
    reason_code: Optional[Dict[str, Any]] = None
    reason_text: Optional[str] = None
    created_by: Optional[str] = "system"
    notes: Optional[str] = None


class EncounterStatusUpdate(BaseModel):
    status: str  # planned | arrived | triaged | in-progress | finished | cancelled


class TenantInfo(BaseModel):
    tenant_id: str
    name: str
    description: Optional[str] = None

class ConditionResponse(BaseModel):
    id: int
    clinical_status: str
    verification_status: str
    code: CodeableConcept
    onset_datetime: Optional[datetime] = None
    severity: str
    created_at: datetime
    model_config = model_config_with_json_encoders

class ObservationResponse(BaseModel):
    id: int
    status: str
    code: CodeableConcept
    value_string: str
    effective_datetime: Optional[datetime] = None
    created_at: datetime
    model_config = model_config_with_json_encoders

class MedicationStatementResponse(BaseModel):
    id: int
    status: str
    medication: CodeableConcept
    dosage: Dict[str, str]
    effective_period: Optional[Period] = None
    created_at: datetime
    model_config = model_config_with_json_encoders

class ConversationResponse(BaseModel):
    id: int
    raw_text: str
    summary: Optional[str] = None
    participants: Optional[Dict[str, str]] = None
    language: str = "ko"
    created_at: datetime
    model_config = model_config_with_json_encoders

# 요청 스키마
class EMRSaveRequest(BaseModel):
    patient_identifier: str
    patient_name: str
    patient_birth_date: str
    patient_gender: str
    conversation_text: str
    llm_analysis_result: Dict[str, Any]

class EMRSaveResponse(BaseModel):
    patient_id: int
    encounter_id: int

class EMRRecord(BaseModel):
    encounter: EncounterResponse
    conditions: List[ConditionResponse] = []
    observations: List[ObservationResponse] = []
    medications: List[MedicationStatementResponse] = []
    conversation: Optional[ConversationResponse] = None
    model_config = model_config_with_json_encoders

class Paragraph(BaseModel):
    paragraph_speaker: str  # "doctor" | "patient"
    paragraph_text: str

class MergeRequest(BaseModel):
    tenant_id: str
    patient_id: str
    encounter_id: str
    paragraph: List[Paragraph]
    doctor_note: str

class MergeResponse(BaseModel):
    soap_summary: str

class SOAPNoteResponse(BaseModel):
    id: int
    encounter_id: int
    soap_summary: str
    citations: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionResponse(BaseModel):
    id: int
    session_id: str
    patient_id: int
    encounter_id: int
    rolling_summary: Optional[str] = None
    messages: List[ChatMessageResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatSessionCreate(BaseModel):
    patient_id: int
    encounter_id: int
    rolling_summary: Optional[str] = None


class ChatMessageCreate(BaseModel):
    session_id: int
    role: str
    content: str


class SOAPNoteCreate(BaseModel):
    encounter_id: int
    soap_summary: str
    citations: Optional[List[Dict[str, Any]]] = None
