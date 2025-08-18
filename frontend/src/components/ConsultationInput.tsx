"use client";

import type { STTUtterance } from "@/hooks/useSTT";

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
  analysisLoading: boolean;
  
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
  handleRoleChange: (speaker: string, role: SpeakerRole) => void;
  setDoctorNote: (note: string) => void;
  handleMergeContent: () => void;
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
  analysisLoading,
  startRecording,
  stopRecording,
  resetTranscript,
  handleRoleChange,
  setDoctorNote,
  handleMergeContent,
  handleSubmit,
}: ConsultationInputProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500 transition-all hover:shadow-xl">
      <div className="flex items-center mb-6">
        <span className="text-cyan-500 mr-3">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </span>
        <h2 className="text-xl font-semibold">진료 대화 입력</h2>
      </div>

      {sttError && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center space-x-3">
          <svg
            className="h-5 w-5 text-red-500"
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
                    : 'bg-teal-50 text-teal-600 border-2 border-teal-200 hover:bg-teal-100'
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
                <div className="px-4 py-2 bg-teal-50 text-teal-600 rounded-lg border-2 border-teal-100 flex items-center space-x-2">
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
            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 text-teal-700 mb-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">사용 방법</span>
              </div>
              <p className="text-sm text-teal-600">
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
                      <span className="font-mono text-sm px-2 py-1 bg-teal-100 text-teal-700 rounded">
                        {speaker}
                      </span>
                      <select
                        value={speakerRoles[speaker] || ""}
                        onChange={(e) => handleRoleChange(speaker, e.target.value as SpeakerRole)}
                        className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        aria-label={`${speaker} 역할 선택`}
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
                <svg className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">의사 메모</h3>
              </div>
              <div className="relative">
                <textarea
                  value={doctorNote}
                  onChange={(e) => setDoctorNote(e.target.value)}
                  className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
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
              <div className="h-full p-6 border border-teal-100 rounded-xl shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-teal-900">음성 인식 결과</h3>
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
                            ? 'bg-teal-100 bg-opacity-50' 
                            : 'bg-white border border-teal-100'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isDoctor ? 'bg-teal-500' : 'bg-green-500'
                        }`}>
                          <span className="text-white text-sm">
                            {isDoctor ? '의' : '환'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className={`font-medium ${
                              isDoctor ? 'text-teal-700' : 'text-green-700'
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
        <div className="flex space-x-4 mt-8 pt-6">
        <button
            type="button"
            onClick={handleMergeContent}
            disabled={!doctorNote.trim() || isProcessingMerge}
            className="flex-1 py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center space-x-2"
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
            className="flex-1 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center space-x-2"
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
  );
}
