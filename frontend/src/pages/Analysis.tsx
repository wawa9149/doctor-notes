import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { AnalyzeResponse, PatientListItem } from "../services/apiClient";
import { saveEMR } from "../services/apiClient";
import AnalysisCard from "../components/AnalysisCard";

interface LocationState {
  analysisData: AnalyzeResponse;
  conversationText: string;
  selectedPatient: PatientListItem | null;
}

export default function Analysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysisData, conversationText, selectedPatient } =
    location.state as LocationState;

  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    name: selectedPatient?.name.text || "",
    birthDate: selectedPatient?.birth_date || "",
    gender: selectedPatient?.gender || "",
    identifier: selectedPatient?.identifier || "", // 차트번호
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPatientInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    // 필수 입력값 검증
    if (!patientInfo.identifier.trim()) {
      alert("환자 식별자(차트 번호)를 입력해주세요.");
      return;
    }
    if (!patientInfo.name.trim()) {
      alert("환자 이름을 입력해주세요.");
      return;
    }
    if (!patientInfo.birthDate.trim()) {
      alert("생년월일을 입력해주세요.");
      return;
    }
    if (!patientInfo.gender) {
      alert("성별을 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      const response = await saveEMR({
        patient_identifier: patientInfo.identifier,
        patient_name: patientInfo.name,
        patient_birth_date: patientInfo.birthDate,
        patient_gender: patientInfo.gender,
        conversation_text: conversationText,
        llm_analysis_result: analysisData,
      });

      alert("진료 기록이 저장되었습니다.");
      navigate(`/records/${response.patient_id}`);
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-screen items-center justify-center">
      <h1 className="text-2xl font-bold mb-6 text-center">
        진료 내용 분석 결과
      </h1>

      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">환자 정보 입력</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              차트번호
            </label>
            <input
              type="text"
              name="identifier"
              value={patientInfo.identifier}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="차트번호를 입력하세요"
              readOnly={!!selectedPatient}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              type="text"
              name="name"
              value={patientInfo.name}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="환자 이름을 입력하세요"
              readOnly={!!selectedPatient}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              생년월일
            </label>
            <input
              type="date"
              name="birthDate"
              value={patientInfo.birthDate}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              readOnly={!!selectedPatient}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              성별
            </label>
            <select
              name="gender"
              value={patientInfo.gender}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!!selectedPatient}
            >
              <option value="">선택해주세요</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <AnalysisCard data={analysisData} />
      </div>

      <div className="text-center">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "저장 중..." : "진료 기록 저장"}
        </button>
      </div>
    </div>
  );
}
