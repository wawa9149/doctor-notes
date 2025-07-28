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
  const [activeTab, setActiveTab] = useState<"new" | "records">("new");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  // 환자 검색 필터링
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.identifier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-screen min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">🏥 Doctor Notes</h1>

        {/* 탭 네비게이션 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setActiveTab("new")}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === "new"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              새로운 진료 시작
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === "records"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              환자 기록 조회
            </button>
          </div>
        </div>

        {activeTab === "new" ? (
          // 새로운 진료 시작 섹션
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">환자 선택</h2>
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

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">진료 대화 입력</h2>
              <form onSubmit={handleSubmit}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="의사와 환자의 대화 내용을 입력하세요..."
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "분석 중..." : "대화 분석"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          // 환자 기록 조회 섹션
          <div>
            {/* 검색 바 */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="환자 이름 또는 차트번호로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute right-3 top-4 text-gray-400">🔍</span>
              </div>
            </div>

            {/* 환자 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {patient.name.text}
                      </h3>
                      <p className="text-gray-600">
                        차트번호: {patient.identifier}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/records/${patient.id}`)}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                    >
                      기록 보기
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      생년월일:{" "}
                      {new Date(patient.birth_date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      성별:{" "}
                      {patient.gender === "male"
                        ? "남성"
                        : patient.gender === "female"
                        ? "여성"
                        : "기타"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
