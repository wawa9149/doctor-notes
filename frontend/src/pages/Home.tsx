// src/pages/Home.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  analyzeDialogue,
  getPatients,
  type PatientListItem,
} from "../services/apiClient";

export default function Home() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [selectedPatient, setSelectedPatient] =
    useState<PatientListItem | null>(null);

  useEffect(() => {
    // 환자 목록 로드
    getPatients().then(setPatients).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert("대화 내용을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const analysisData = await analyzeDialogue(text);
      navigate("/analysis", {
        state: {
          analysisData,
          conversationText: text,
          selectedPatient,
        },
      });
    } catch (error) {
      console.error("분석 실패:", error);
      alert("분석에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">의사-환자 대화 분석</h1>

      {/* 환자 선택 */}
      <div className="w-full max-w-2xl mb-6">
        <h2 className="text-xl font-semibold mb-2">환자 선택</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedPatient?.id || ""}
            onChange={(e) => {
              const patient = patients.find(
                (p) => p.id === Number(e.target.value)
              );
              setSelectedPatient(patient || null);
            }}
          >
            <option value="">새로운 환자</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name.text} ({patient.identifier}) -{" "}
                {new Date(patient.birth_date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 대화 입력 */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            대화 내용
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="의사와 환자의 대화 내용을 입력하세요..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "분석 중..." : "대화 분석"}
        </button>
      </form>
    </div>
  );
}
