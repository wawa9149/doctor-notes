"use client";

import { useState, useEffect } from "react";
import type { STTUtterance } from "@/hooks/useSTT";
import ChatBot from "./ChatBot";

type SpeakerRole = "환자" | "의사" | "기타";

interface ConsultationInputProps {
  sttError: string | null;
  isRecording: boolean;
  isProcessing: boolean;
  utterances: STTUtterance[];
  uniqueSpeakers: string[];
  speakerRoles: Record<string, SpeakerRole>;
  doctorNote: string;
  isProcessingMerge: boolean;

  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
  handleRoleChange: (speaker: string, role: SpeakerRole) => void;
  setDoctorNote: (note: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export default function ConsultationInput({
  sttError,
  isRecording,
  isProcessing,
  utterances,
  uniqueSpeakers,
  speakerRoles,
  doctorNote,
  isProcessingMerge,
  startRecording,
  stopRecording,
  resetTranscript,
  handleRoleChange,
  setDoctorNote,
  handleSubmit,
}: ConsultationInputProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeRoleDropdown, setActiveRoleDropdown] = useState<number | null>(null);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveRoleDropdown(null);
    };

    if (activeRoleDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeRoleDropdown]);
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-8">
        <h2 className="text-xl font-bold bg-clip-text text-black">
          진료 대화 입력
        </h2>
      </div>

        {sttError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
            <svg
              className="h-5 w-5 text-red-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-600 text-sm">{sttError}</p>
          </div>
        )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 입력 컨트롤 영역 (왼쪽) */}
          <div className="space-y-6">
            {/* 사용자 가이드 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <button
                type="button"
                onClick={() => setIsGuideOpen(!isGuideOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <svg className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="font-medium text-gray-800">사용 가이드</h4>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isGuideOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isGuideOpen && (
                <div className="px-4 pb-4">
                  <div className="bg-gray-50 rounded-lg p-3 border-t border-gray-100">
                    <ol className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">1</span>
                        <span>음성 녹음 버튼을 클릭하여 대화를 녹음합니다.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">2</span>
                        <span>메모를 입력합니다.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">3</span>
                        <span>노트 합치기 버튼으로 SOAP 노트를 생성합니다.</span>
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* 의사 메모 입력 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 text-cyan-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                의사 메모
              </h3>
              <div className="relative">
                <textarea
                  value={doctorNote}
                  onChange={(e) => setDoctorNote(e.target.value)}
                  className="w-full h-45 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  placeholder="진료 내용에 대한 메모를 입력하세요..."
                />
                <div className="absolute bottom-4 right-4 text-gray-400 text-sm">
                  {doctorNote.length} 자
                </div>
              </div>
            </div>
          </div>

          {/* 음성 인식 결과 표시 (오른쪽) */}
          <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm h-full ${activeRoleDropdown !== null ? 'overflow-visible' : ''}`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="h-5 w-5 text-cyan-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              음성 메모
            </h3>

            {/* 음성 녹음 컨트롤 */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`relative px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  isRecording
                    ? 'bg-red-500 text-white shadow-md hover:bg-red-600'
                    : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md hover:shadow-lg'
                } disabled:opacity-50 disabled:shadow-none`}
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
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                )}
              </button>
              
              {utterances.length > 0 && (
                <button
                  type="button"
                  onClick={resetTranscript}
                  className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>초기화</span>
                </button>
              )}
              
              {isProcessing && (
                <div className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-lg shadow-sm flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>음성 처리 중...</span>
                </div>
              )}
            </div>

            <div className="mt-4">
            {utterances.length > 0 ? (
              <div className={`space-y-2 max-h-[600px] pr-2 ${activeRoleDropdown !== null ? 'overflow-visible' : 'overflow-y-auto'}`}>
                {utterances.map((utterance, index) => {
                  const role = speakerRoles[utterance.speaker] || utterance.speaker;
                  const isDoctor = role === "의사";
                  return (
                    <div 
                      key={index} 
                      className={`flex items-start space-x-3 p-3 rounded-lg ${
                        isDoctor 
                          ? 'bg-gray-50 border border-gray-100' 
                          : 'bg-gradient-to-r from-cyan-50 to-teal-50 border border-teal-100'
                      }`}
                    >

                        <div className="flex-1 flex items-center space-x-3">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveRoleDropdown(activeRoleDropdown === index ? null : index);
                              }}
                              className={`flex items-center px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                                isDoctor 
                                  ? 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200' 
                                  : 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100'
                              }`}
                            >
                              {role}
                              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            {activeRoleDropdown === index && (
                              <div 
                                className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-[9999] min-w-[80px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleRoleChange(utterance.speaker, "의사");
                                    setActiveRoleDropdown(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-b border-gray-100 first:rounded-t-md"
                                >
                                  의사
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleRoleChange(utterance.speaker, "환자");
                                    setActiveRoleDropdown(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 last:rounded-b-md"
                                >
                                  환자
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="text-gray-400 text-xs">
                            #{index + 1}
                          </span>
                          <p className="text-gray-700 text-sm flex-1">{utterance.text}</p>
                        </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="min-h-[200px] flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-center text-gray-600">
                  음성 녹음이 종료되면<br/>
                  여기에 대화 내용이 표시됩니다.
                </p>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* 버튼 영역 (하단) */}
        <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isProcessingMerge}
            className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center space-x-2"
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
                <span>노트 합치기</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
