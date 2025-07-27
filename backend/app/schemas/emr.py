from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

# 기본 스키마
class CodeableConcept(BaseModel):
    text: str

class Period(BaseModel):
    start: datetime
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
class EncounterResponse(BaseModel):
    id: int
    status: str
    class_: str = "AMB"
    type: str
    period: Optional[Period] = None
    reason_text: Optional[str] = None
    created_at: datetime
    model_config = model_config_with_json_encoders

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
