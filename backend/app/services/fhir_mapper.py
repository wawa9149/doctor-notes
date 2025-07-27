from datetime import datetime, date
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class FHIRMapper:
    """
    LLM의 FHIR-유사 JSON 출력을 SQLAlchemy 모델 구조에 맞는 딕셔너리로 변환합니다.
    """

    def _to_date(self, date_str: str | None) -> date | None:
        """문자열을 date로 변환합니다."""
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except (ValueError, AttributeError) as e:
            logger.warning(f"날짜 변환 실패: {e}")
            return None

    def _to_datetime(self, date_str: str | None) -> datetime | None:
        """문자열을 datetime으로 변환합니다."""
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError) as e:
            logger.warning(f"날짜 변환 실패: {e}")
            return None

    def _datetime_to_str(self, dt: datetime | None) -> str | None:
        """datetime을 ISO 형식 문자열로 변환합니다."""
        if not dt:
            return None
        return dt.isoformat()

    def map_patient_data(self, llm_result: Dict[str, Any]) -> Dict[str, Any]:
        """LLM 결과에서 Patient 정보를 추출하여 DB 모델 형식으로 매핑합니다."""
        patient_data = llm_result.get("Patient", {})
        if not patient_data:
            return {}
        return {
            "name": patient_data.get("name", {}),
            "birth_date": self._to_date(patient_data.get("birth_date")),
            "gender": patient_data.get("gender"),
        }

    def map_encounter_data(self, llm_result: Dict[str, Any]) -> Dict[str, Any]:
        """LLM 결과에서 Encounter 정보를 추출하여 DB 모델 형식으로 매핑합니다."""
        encounter_data = llm_result.get("Encounter", {})
        if not encounter_data:
            return {}

        # period 처리
        period = encounter_data.get("period", {})
        if isinstance(period, dict):
            if "start" in period:
                period["start"] = self._datetime_to_str(self._to_datetime(period["start"]))
            if "end" in period:
                period["end"] = self._datetime_to_str(self._to_datetime(period["end"]))

        return {
            "status": encounter_data.get("status", "finished"),
            "class_": encounter_data.get("class", "AMB"),
            "type": encounter_data.get("type", "진료"),
            "period": period,
            "reason_text": encounter_data.get("reason_text"),
        }

    def map_sub_resources(self, llm_result: Dict[str, Any], encounter_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """LLM 결과에서 하위 리소스들을 추출하여 DB 모델 형식으로 매핑합니다."""
        conditions = []
        if "Condition" in llm_result:
            condition = llm_result["Condition"]
            if isinstance(condition, dict):
                condition_data = {
                    "encounter_id": encounter_id,
                    "clinical_status": condition.get("clinical_status", "active"),
                    "verification_status": condition.get("verification_status", "provisional"),
                    "code": {"text": condition.get("code", {}).get("text", "상세불명")},
                    "onset_datetime": self._to_datetime(condition.get("onset_datetime")),  # 문자열을 datetime으로 변환
                    "severity": condition.get("severity", "moderate"),
                }
                conditions.append(condition_data)

        observations = []
        if "Observation" in llm_result:
            obs_list = llm_result["Observation"]
            if isinstance(obs_list, list):
                for obs in obs_list:
                    obs_data = {
                        "encounter_id": encounter_id,
                        "status": obs.get("status", "final"),
                        "code": {"text": obs.get("code", {}).get("text", "관찰")},
                        "value_string": obs.get("value_string", ""),
                        "effective_datetime": self._to_datetime(obs.get("effective_datetime")),  # 문자열을 datetime으로 변환
                    }
                    observations.append(obs_data)

        medications = []
        if "MedicationStatement" in llm_result:
            med_list = llm_result["MedicationStatement"]
            if isinstance(med_list, list):
                for med in med_list:
                    effective_period = med.get("effective_period", {})
                    if isinstance(effective_period, dict):
                        if "start" in effective_period:
                            effective_period["start"] = self._to_datetime(effective_period["start"])
                        if "end" in effective_period:
                            effective_period["end"] = self._to_datetime(effective_period["end"])
                    else:
                        effective_period = {"start": None, "end": None}

                    med_data = {
                        "encounter_id": encounter_id,
                        "status": med.get("status", "active"),
                        "medication": {"text": med.get("medication", {}).get("text", "약물명 미상")},
                        "dosage": {"text": med.get("dosage", {}).get("text", "용법 미상")},
                        "effective_period": effective_period,
                    }
                    medications.append(med_data)

        return {
            "conditions": conditions,
            "observations": observations,
            "medication_statements": medications,
        }
