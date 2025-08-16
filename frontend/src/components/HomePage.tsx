"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePatients } from "@/hooks/usePatients";
import { useAnalysis } from "@/hooks/useEMR";
import { useSTT, type STTUtterance } from "@/hooks/useSTT";
import { deletePatient } from "@/services/patientService";
import type { PatientListItem } from "@/types/patient";

type SpeakerRole = "의사" | "환자";

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"new" | "records">("new");
  const [text, setText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] =
    useState<PatientListItem | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<number | null>(
    null
  );
  const [isClient, setIsClient] = useState(false);
  const [speakerRoles, setSpeakerRoles] = useState<Record<string, SpeakerRole>>({});
  const [uniqueSpeakers, setUniqueSpeakers] = useState<string[]>([]);
  
  // React 19의 use Hook 사용
  const patients = usePatients();

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setIsClient(true);
  }, []);
  const {
    analyzeText,
    loading: analysisLoading,
    error: analysisError,
  } = useAnalysis();
  
  // 음성 녹음 훅
  const {
    isRecording,
    isProcessing,
    utterances, // transcript 대신 utterances 사용
    startRecording,
    stopRecording,
    resetTranscript,
    error: sttError,
  } = useSTT();

  // STT 결과가 변경될 때마다 고유 화자 목록 업데이트
  useEffect(() => {
    if (utterances.length > 0) {
      const speakers = new Set(utterances.map(u => u.speaker));
      const newSpeakers = Array.from(speakers).filter(s => s !== "SYSTEM");
      setUniqueSpeakers(newSpeakers);

      // 기본 역할 할당 (기존 설정 유지)
      setSpeakerRoles(prevRoles => {
        const newRoles = { ...prevRoles };
        newSpeakers.forEach((speaker, index) => {
          if (!newRoles[speaker]) {
            // 간단한 규칙: SPEAKER-00은 환자, 나머지는 의사로 기본 설정
            newRoles[speaker] = speaker === "SPEAKER-00" ? "환자" : "의사";
          }
        });
        return newRoles;
      });
    } else {
      setUniqueSpeakers([]);
    }
  }, [utterances]);

  const handleRoleChange = (speaker: string, role: SpeakerRole) => {
    setSpeakerRoles(prev => ({ ...prev, [speaker]: role }));
  };

  // 역할을 반영하여 대화 내용 생성
  const formattedConversation = useMemo(() => {
    return utterances
      .map(u => {
        const role = speakerRoles[u.speaker] || u.speaker;
        return `${role} - ${u.text}`;
      })
      .join('\n');
  }, [utterances, speakerRoles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert("대화 내용을 입력해주세요.");
      return;
    }

    try {
      const analysisData = await analyzeText(text);
      // Next.js에서는 URL 파라미터나 세션스토리지를 사용
      sessionStorage.setItem(
        "analysisData",
        JSON.stringify({
          analysisData,
          conversationText: text,
          selectedPatient,
        })
      );
      router.push("/analysis");
    } catch (error) {
      console.error("분석 실패:", error);
      alert("분석에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 환자 삭제 함수
  const handleDeletePatient = async (
    patientId: number,
    patientName: string
  ) => {
    if (
      !confirm(
        `환자 "${patientName}"을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    try {
      setDeletingPatientId(patientId);
      await deletePatient(patientId);
      alert("환자가 삭제되었습니다.");
      // 페이지 새로고침으로 데이터 다시 로드
      window.location.reload();
    } catch (error) {
      console.error("환자 삭제 실패:", error);
      alert("환자 삭제에 실패했습니다.");
    } finally {
      setDeletingPatientId(null);
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

        {/* 에러 처리 */}
        {analysisError && (
          <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">
              분석 중 오류가 발생했습니다: {analysisError.message}
            </p>
          </div>
        )}

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
              onClick={() => {
                console.log("환자 기록 조회 버튼 클릭됨");
                setActiveTab("records");
              }}
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
                value={isClient ? (selectedPatient?.id || "") : ""}
                onChange={(e) => {
                  const patient = patients.find(
                    (p) => p.id === Number(e.target.value)
                  );
                  setSelectedPatient(patient || null);
                }}
              >
                <option value="">새로운 환자</option>
                {isClient && patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name.text} ({patient.identifier}) -{" "}
                    {new Date(patient.birth_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">진료 대화 입력</h2>
              
              {/* STT 에러 표시 */}
              {sttError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{sttError}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                                {/* 음성 녹음 컨트롤 */}
                <div className="mb-4 flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isRecording
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    } disabled:opacity-50`}
                  >
                    {isRecording ? '🔴 녹음 중지' : '🎤 음성 녹음'}
                  </button>
                  
                  {utterances.length > 0 && (
                    <button
                      type="button"
                      onClick={resetTranscript}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800"
                    >
                      🗑️ 초기화
                    </button>
                  )}
                  
                  {isProcessing && (
                    <span className="text-blue-600 text-sm">음성 처리 중...</span>
                  )}
                </div>
                
                {/* 화자 역할 설정 */}
                {uniqueSpeakers.length > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">화자 역할 설정</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {uniqueSpeakers.map((speaker) => (
                        <div key={speaker} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                          <span className="font-mono text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {speaker}
                          </span>
                          <select
                            value={speakerRoles[speaker] || ""}
                            onChange={(e) => handleRoleChange(speaker, e.target.value as SpeakerRole)}
                            className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="의사">의사</option>
                            <option value="환자">환자</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 음성 인식 결과 표시 */}
                {utterances.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-blue-800">음성 인식 결과</h3>
                    <div className="space-y-2">
                      {utterances.map((utterance, index) => {
                        const role = speakerRoles[utterance.speaker] || utterance.speaker;
                        return (
                          <div key={index} className="p-2 bg-white rounded border border-blue-100">
                            <span className="font-semibold text-blue-700">{role}</span>
                            <span className="mx-2 text-gray-400">-</span>
                            <span>{utterance.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="의사와 환자의 대화 내용을 입력하세요..."
                />
                
                <div className="mt-4 flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setText(prev => prev + (prev ? '\n' : '') + formattedConversation)}
                    disabled={utterances.length === 0 || analysisLoading}
                    className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                  >
                    음성 결과 추가
                  </button>
                  <button
                    type="submit"
                    disabled={analysisLoading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {analysisLoading ? "분석 중..." : "대화 분석"}
                  </button>
                </div>
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/records/${patient.id}`)}
                        className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                      >
                        기록 보기
                      </button>
                      <button
                        onClick={() =>
                          handleDeletePatient(patient.id, patient.name.text)
                        }
                        disabled={deletingPatientId === patient.id}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 disabled:opacity-50"
                      >
                        {deletingPatientId === patient.id
                          ? "삭제 중..."
                          : "삭제"}
                      </button>
                    </div>
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
