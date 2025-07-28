import json
import logging
import re
from datetime import datetime
from typing import Dict, Any

from openai import AzureOpenAI
from app.config import settings

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = AzureOpenAI(
    api_key=settings.AZURE_API_KEY,
    api_version=settings.AZURE_API_VERSION,
    azure_endpoint=settings.AZURE_ENDPOINT
)

def clean_json_string(json_str: str) -> str:
    """LLM이 생성한 JSON 문자열을 정리합니다."""
    # 코드 블록 마커 제거
    if "```json" in json_str:
        json_str = json_str.split("```json")[-1]
    if "```" in json_str:
        json_str = json_str.split("```")[0]
    
    # 줄바꿈, 탭 정리
    json_str = json_str.strip()
    
    # 후행 쉼표 제거 (배열과 객체 모두)
    json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
    
    # 누락된 쌍따옴표 추가
    json_str = re.sub(r'([{,]\s*)(\w+)(\s*:)', r'\1"\2"\3', json_str)
    
    # 잘못된 작은따옴표를 큰따옴표로 변경
    json_str = json_str.replace("'", '"')
    
    # 빈 값을 null로 변경
    json_str = re.sub(r':\s*,', ': null,', json_str)
    json_str = re.sub(r':\s*}', ': null}', json_str)
    
    return json_str

def analyze_with_llm(text: str) -> Dict[str, Any]:
    """대화 내용을 LLM으로 분석하여 구조화된 정보를 반환합니다."""
    logger.info("대화 분석을 시작합니다.")
    
    try:
        # 현재 시간을 미리 설정
        current_time = datetime.utcnow().isoformat()
        
        completion = client.chat.completions.create(
            model=settings.AZURE_DEPLOYMENT_NAME,
            messages=[
                {
                    "role": "system",
                    "content": """다음은 의사와 환자 간의 정신과 진료 대화입니다.  
이 대화를 분석하여 진료 정보를 FHIR 리소스 구조에 맞는 JSON 형식으로 출력해 주세요.
각 필드의 값은 대화 내용에 근거해야 하며, 추론이 필요한 경우 가장 가능성이 높은 값을 사용해 주세요.

- **Patient**: 환자 정보 (대화에서 파악되는 정보만 기입)
  - `name.text`: 환자 이름
  - `birth_date`: 생년월일 (YYYY-MM-DD)
  - `gender`: 'male' 또는 'female'

- **Encounter**: 진료 정보
  - `status`: 'finished' (진료가 완료되었으므로)
  - `class`: 'AMB' (Ambulatory - 외래)
  - `type`: '진료'
  - `period.start`: 진료 시작 시간 (현재 시간으로 설정)
  - `reason_text`: 방문 이유 (환자가 주로 호소하는 문제)

- **Condition**: 진단명
  - `clinical_status`: 'active'
  - `verification_status`: 'provisional' (대화 기반이므로 잠정적 진단)
  - `code.text`: 진단명 (예: "주요우울장애")
  - `onset_datetime`: 증상 시작 시점 (대화에서 유추)
  - `severity`: 'mild' | 'moderate' | 'severe' (대화에서 유추)

- **Observation**: 증상, 상태, 행동 등 (여러 개일 수 있음)
  - `status`: 'final'
  - `code.text`: 관찰 항목명 (예: "수면 문제", "불안", "식욕 저하")
  - `value_string`: 환자의 상태에 대한 구체적인 설명 (환자의 말을 인용하거나 요약)
  - `effective_datetime`: 관찰된 시점 (현재 시간으로 설정)

- **MedicationStatement**: 복용 중인 약물 (여러 개일 수 있음)
  - `status`: 'active' (현재 복용 중인 경우)
  - `medication.text`: 약물명 + 용량 (예: "프로작 20mg")
  - `dosage.text`: 복용 방법 (예: "아침 식후 1정")
  - `effective_period.start`: 복용 시작일 (대화에서 유추)

반드시 유효한 JSON 형식으로 출력해주세요. 모든 키는 큰따옴표(")로 감싸주세요."""
                },
                {
                    "role": "user",
                    "content": text
                }
            ],
            temperature=0.1,  # 일관된 출력을 위해 낮은 temperature 사용
            max_tokens=2000,
        )
        
        result_str = completion.choices[0].message.content
        logger.info("LLM 응답 받음")
        logger.debug(f"Raw LLM response: {result_str}")
        
        # JSON 문자열 정리
        result_str = clean_json_string(result_str)
        logger.debug(f"Cleaned JSON string: {result_str}")
        
        try:
            result_dict = json.loads(result_str)
            # 현재 시간으로 period.start와 effective_datetime 강제 설정
            if "Encounter" in result_dict:
                if "period" not in result_dict["Encounter"]:
                    result_dict["Encounter"]["period"] = {}
                result_dict["Encounter"]["period"]["start"] = current_time

            if "Observation" in result_dict and isinstance(result_dict["Observation"], list):
                for obs in result_dict["Observation"]:
                    obs["effective_datetime"] = current_time

            logger.info("JSON 파싱 성공")
            return result_dict
        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 실패: {e}", exc_info=True)
            logger.error(f"문제가 있는 JSON 문자열: {result_str}")
            
            # 기본 구조 반환
            return {
                "Patient": {
                    "name": {"text": "알 수 없음"},
                    "birth_date": None,
                    "gender": None
                },
                "Encounter": {
                    "status": "finished",
                    "class": "AMB",
                    "type": "진료",
                    "period": {"start": current_time},
                    "reason_text": "상담"
                },
                "Condition": {
                    "clinical_status": "active",
                    "verification_status": "provisional",
                    "code": {"text": "상담 필요"},
                    "onset_datetime": current_time,
                    "severity": "moderate"
                },
                "Observation": [{
                    "status": "final",
                    "code": {"text": "초기 상담"},
                    "value_string": "자세한 내용 파악 필요",
                    "effective_datetime": current_time
                }],
                "MedicationStatement": []
            }
            
    except Exception as e:
        logger.error(f"LLM 분석 중 오류 발생: {e}", exc_info=True)
        raise ValueError(f"대화 분석 중 오류가 발생했습니다: {str(e)}")
