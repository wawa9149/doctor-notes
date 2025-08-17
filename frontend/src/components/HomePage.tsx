"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePatients } from "@/hooks/usePatients";
import { useAnalysis } from "@/hooks/useEMR";
import { useSTT, type STTUtterance } from "@/hooks/useSTT";
import { deletePatient } from "@/services/patientService";
import type { PatientListItem } from "@/types/patient";

type SpeakerRole = "환자" | "의사" | "기타";

interface MergedContent {
  conversation: string;
  doctorNote: string;
  summary: string[];
}

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"new" | "records">("new");
  const [text, setText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] =
    useState<PatientListItem | null>(null);
  const [doctorNote, setDoctorNote] = useState("");
  const [isProcessingMerge, setIsProcessingMerge] = useState(false);
  const [mergedContent, setMergedContent] = useState<MergedContent | null>(null);
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

  // 임시 RAG 처리 함수
  const handleMergeContent = async () => {
    setIsProcessingMerge(true);
    try {
      // 음성 인식 결과를 문자열로 변환
      const conversationText = utterances
        .map(u => `${speakerRoles[u.speaker] || u.speaker}: ${u.text}`)
        .join('\n');

      // 실제로는 여기서 RAG 백엔드 API를 호출해야 함
      // 임시로 3초 대기 후 더미 데이터 반환
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 더미 데이터로 결과 생성
      setMergedContent({
        conversation: conversationText,
        doctorNote: doctorNote,
        summary: [
          "주요 증상: 두통, 어지러움",
          "진찰 소견: 혈압 정상, 신경학적 검사 정상",
          "처방: 진통제 처방, 휴식 권고",
          "다음 진료: 2주 후 재진료"
        ]
      });
      
    } catch (error) {
      console.error('RAG 처리 중 오류:', error);
      alert('내용을 처리하는 중 오류가 발생했습니다.');
    } finally {
      setIsProcessingMerge(false);
    }
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
    <div className="w-screen min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Doctor Notes
              </span>
            </h1>

            {/* 탭 네비게이션을 헤더로 이동 */}
            <div className="flex items-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-1.5 border border-gray-100">
                <button
                  onClick={() => setActiveTab("new")}
                  className={`px-6 py-2 rounded-lg transition-all duration-200 font-medium ${
                    activeTab === "new"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  ✨ 새로운 진료
                </button>
                <button
                  onClick={() => {
                    console.log("환자 기록 조회 버튼 클릭됨");
                    setActiveTab("records");
                  }}
                  className={`px-6 py-2 rounded-lg transition-all duration-200 font-medium ${
                    activeTab === "records"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  📋 기록 조회
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* 에러 처리 */}
        {analysisError && (
          <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600">
                분석 중 오류가 발생했습니다: {analysisError.message}
              </p>
            </div>
          </div>
        )}

        {activeTab === "new" ? (
          // 새로운 진료 시작 섹션
          <div className="max-w-5xl mx-auto space-y-8">
            {/* 1. 환자 선택 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transition-all hover:shadow-xl">
              <div className="flex items-center mb-4">
                <span className="text-blue-500 mr-3">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <h2 className="text-xl font-semibold">환자 선택</h2>
              </div>
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
            
            {/* 2. 진료 대화 입력 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500 transition-all hover:shadow-xl">
              <div className="flex items-center mb-6">
                <span className="text-indigo-500 mr-3">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </span>
                <h2 className="text-xl font-semibold">진료 대화 입력</h2>
              </div>
              
              {/* STT 에러 표시 */}
              {sttError && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center space-x-3">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-600 text-sm">{sttError}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* 입력 컨트롤 영역 (왼쪽) */}
                  <div className="space-y-6">
                    {/* 음성 녹음 컨트롤 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">음성 녹음</h3>
                      <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                        className={`relative px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                          isRecording
                            ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                            : 'bg-blue-50 text-blue-600 border-2 border-blue-200 hover:bg-blue-100'
                        } disabled:opacity-50 disabled:hover:bg-transparent`}
                      >
                        {isRecording ? (
                          <>
                            <span className="relative flex h-3 w-3 mr-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <span>녹음 중지</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span>음성 녹음</span>
                          </>
                        )}
                      </button>
                      
                      {utterances.length > 0 && (
                        <button
                          type="button"
                          onClick={resetTranscript}
                          className="px-4 py-2.5 text-gray-600 bg-gray-50 border-2 border-gray-200 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center space-x-2"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>초기화</span>
                        </button>
                      )}
                      
                      {isProcessing && (
                        <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg border-2 border-blue-100 flex items-center space-x-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>음성 처리 중...</span>
                        </div>
                      )}
                    </div>
                    </div>

                    {/* 사용자 가이드 */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center space-x-2 text-blue-700 mb-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">사용 방법</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        1. 음성 녹음 버튼을 클릭하여 대화를 녹음하세요.<br />
                        2. 녹음이 완료되면 의사 메모를 입력하세요.<br />
                        3. 합치기 버튼을 클릭하여 분석을 시작하세요.
                      </p>
                    </div>

                    {/* 화자 역할 설정 */}
                    {uniqueSpeakers.length > 0 && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3">화자 역할 설정</h3>
                        <div className="grid grid-cols-1 gap-4">
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
                    
                    {/* 의사 메모 입력 */}
                    <div>
                      <div className="flex items-center space-x-3 mb-4">
                        <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900">의사 메모</h3>
                      </div>
                      <div className="relative">
                        <textarea
                          value={doctorNote}
                          onChange={(e) => setDoctorNote(e.target.value)}
                          className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                          placeholder="진료 내용에 대한 메모를 입력하세요..."
                        />
                        <div className="absolute bottom-4 right-4 text-gray-400 text-sm">
                          {doctorNote.length} 자
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 음성 인식 결과 표시 (오른쪽) */}
                  <div className="h-full">
                    {utterances.length > 0 ? (
                      <div className="h-full p-6 border border-blue-100 rounded-xl shadow-sm">
                        <div className="flex items-center space-x-3 mb-4">
                          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          <h3 className="text-lg font-semibold text-blue-900">음성 인식 결과</h3>
                        </div>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                          {utterances.map((utterance, index) => {
                            const role = speakerRoles[utterance.speaker] || utterance.speaker;
                            const isDoctor = role === "의사";
                            return (
                              <div 
                                key={index} 
                                className={`flex items-start space-x-3 p-3 rounded-lg ${
                                  isDoctor 
                                    ? 'bg-blue-100 bg-opacity-50' 
                                    : 'bg-white border border-blue-100'
                                }`}
                              >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                  isDoctor ? 'bg-blue-500' : 'bg-green-500'
                                }`}>
                                  <span className="text-white text-sm">
                                    {isDoctor ? '의' : '환'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center mb-1">
                                    <span className={`font-medium ${
                                      isDoctor ? 'text-blue-700' : 'text-green-700'
                                    }`}>
                                      {role}
                                    </span>
                                    <span className="text-gray-400 text-sm ml-2">
                                      #{index + 1}
                                    </span>
                                  </div>
                                  <p className="text-gray-700">{utterance.text}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
                         <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                        <p className="text-center">
                          음성 녹음을 시작하면<br/>
                          여기에 대화 내용이 표시됩니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 버튼 영역 (하단) */}
                <div className="flex space-x-4 mt-8 pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleMergeContent}
                    disabled={!doctorNote.trim() || isProcessingMerge}
                    className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {isProcessingMerge ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>처리 중...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                        <span>합치기</span>
                      </>
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={analysisLoading}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {analysisLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>분석 중...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <span>대화 분석</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* 3. 분석 결과 */}
            <div className="bg-white rounded-xl shadow-lg p-6 h-fit border-l-4 border-blue-500 transition-all hover:shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <span className="text-blue-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </span>
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    분석 결과
                  </h2>
                </div>
                {isProcessingMerge && (
                  <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>분석 중...</span>
                  </div>
                )}
              </div>
              {mergedContent ? (
                <div className="space-y-8">
                  <div className="rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <h3 className="font-semibold text-blue-900">음성 인식 결과</h3>
                    </div>
                    <div className="bg-white/50 p-4 rounded-lg whitespace-pre-line border border-blue-100">
                      {mergedContent.conversation}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <h3 className="font-semibold text-indigo-900">의사 메모</h3>
                    </div>
                    <div className="bg-white/50 p-4 rounded-lg whitespace-pre-line border border-indigo-100">
                      {mergedContent.doctorNote}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <h3 className="font-semibold text-green-900">요약</h3>
                    </div>
                    <div className="bg-white/50 p-4 rounded-lg border border-green-100">
                      <ul className="space-y-2">
                        {mergedContent.summary.map((item, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
                              {index + 1}
                            </span>
                            <span className="flex-1 text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-gray-500 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
                  <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-center">
                    음성 인식 결과와 의사 메모를 입력한 후<br />
                    합치기 버튼을 클릭하면 분석 결과가 표시됩니다.
                  </p>
                </div>
              )}
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