"use client";

import PatientSelector from "./PatientSelector";
import ConsultationInput from "./ConsultationInput";
import ChatBot from "./ChatBot";
// import AnalysisResult from "./AnalysisResult";
import {
  useConsultationState,
  useConsultationDispatch,
} from "@/contexts/ConsultationContext";
import { usePatientsState } from "@/contexts/PatientsContext";
import { useState, useRef, useEffect } from "react";
import { API_BASE_URL } from "../constants/api";
import type { PatientListItem } from "@/types/patient";
import type { EncounterResponse } from "@/types/api";

interface NewConsultationViewProps {
  isClient: boolean;
}

export default function NewConsultationView({
  isClient,
}: NewConsultationViewProps) {
  const {
    selectedPatient,
    currentEncounter,
    sttError,
    isRecording,
    isProcessing,
    utterances,
    uniqueSpeakers,
    speakerRoles,
    doctorNote,
    isProcessingMerge,
    soapSummary,
  } = useConsultationState();

  const {
    setSelectedPatient,
    setDoctorNote,
    startRecording,
    stopRecording,
    resetTranscript,
    handleRoleChange,
    handleSubmit,
    clearResult,
    startNewEncounter,
    finishEncounter,
    handleCompleteConsultation,
  } = useConsultationDispatch();
  
  const { patients } = usePatientsState();
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);

  return (
    <div className={`mx-auto space-y-8 transition-all duration-300 ${
      isChatBotOpen ? 'max-w-7xl' : 'max-w-5xl'
    }`}>
      <div className={`grid transition-all duration-300 ${
        isChatBotOpen ? 'grid-cols-2 gap-8' : 'grid-cols-1'
      }`}>
        {/* 왼쪽: 메인 콘텐츠 */}
        <div className="space-y-8">
          {/* 1. 환자 선택 */}
          <PatientSelector
            patients={patients}
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
            isClient={isClient}
          />

          {/* 2. Encounter 상태 표시 */}
          {selectedPatient && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">진료 접수 상태</h2>
                <div className="flex space-x-2">
                  {!currentEncounter ? (
                    <button
                      onClick={startNewEncounter}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      진료 시작
                    </button>
                  ) : (
                    <button
                      onClick={finishEncounter}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      진료 종료
                    </button>
                  )}
                </div>
              </div>
              
              {currentEncounter ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-800 font-medium">진료 진행 중</span>
                  </div>
                  <div className="mt-2 text-sm text-green-700">
                    <p>접수 ID: {currentEncounter.id}</p>
                    <p>시작 시간: {new Date(currentEncounter.created_at).toLocaleString()}</p>
                    <p>상태: {currentEncounter.status}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-600">진료 대기 중</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    환자를 선택하고 &quot;진료 시작&quot; 버튼을 클릭하여 상담을 시작하세요.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. 진료 대화 입력 */}
          <ConsultationInput
            sttError={sttError}
            isRecording={isRecording}
            isProcessing={isProcessing}
            utterances={utterances}
            uniqueSpeakers={uniqueSpeakers}
            speakerRoles={speakerRoles}
            doctorNote={doctorNote}
            isProcessingMerge={isProcessingMerge}
            startRecording={startRecording}
            stopRecording={stopRecording}
            resetTranscript={resetTranscript}
            handleRoleChange={handleRoleChange}
            setDoctorNote={setDoctorNote}
            handleSubmit={handleSubmit}
          />

          {/* 4. SOAP 노트 결과 */}
          {soapSummary && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-teal-500">
                    생성된 SOAP 노트
                  </h2>
                </div>
                <button
                  onClick={clearResult}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <pre className="text-gray-800 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {soapSummary}
                </pre>
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setIsChatBotOpen(!isChatBotOpen)}
                  className={`px-6 py-3 text-white rounded-xl shadow-md hover:shadow-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isChatBotOpen 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                >
                  {isChatBotOpen ? (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>대화 종료</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>대화 시작하기</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(soapSummary);
                    alert("SOAP 노트가 클립보드에 복사되었습니다.");
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl shadow-md hover:shadow-lg font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>결과 복사하기</span>
                </button>
                
                <button
                  onClick={handleCompleteConsultation}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl shadow-md hover:bg-gray-700 hover:shadow-lg font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>진료 완료 및 저장</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 챗봇 (대화 시작하기 클릭 시에만 표시) */}
        {isChatBotOpen && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg h-[800px] flex flex-col">
              {/* 챗봇 헤더 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-xl">
                <h3 className="text-lg font-semibold flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  AI 상담 챗봇
                </h3>
                <button
                  onClick={() => setIsChatBotOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 챗봇 내용 */}
              <div className="flex-1 flex flex-col min-h-0">
                <ChatBotContent 
                  selectedPatient={selectedPatient}
                  currentEncounter={currentEncounter}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 챗봇 내용 컴포넌트 (모달 없이 인라인으로 표시)
function ChatBotContent({ 
  selectedPatient, 
  currentEncounter 
}: { 
  selectedPatient: PatientListItem | null; 
  currentEncounter: EncounterResponse | null; 
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const requestBody: any = { text: inputText };
      
      // 실제 환자 정보와 Encounter 정보 추가
      if (selectedPatient) {
        requestBody.patient_id = selectedPatient.identifier;
      }
      if (currentEncounter) {
        requestBody.encounter_id = currentEncounter.id.toString();
      }

      // 채팅 세션 ID가 있으면 추가
      if (chatSessionId) {
        requestBody.session_id = chatSessionId;
      }

      console.log("Sending chat request:", JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${API_BASE_URL}/chat/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('챗봇 서비스 오류');
      }

      const data = await response.json();

      // If a new session was created, save its ID
      if (data.session_id && !chatSessionId) {
        setChatSessionId(data.session_id);
      }

      const assistantMessage = {
        role: 'assistant',
        text: data.answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('챗봇 오류:', error);
      const errorMessage = {
        role: 'assistant',
        text: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = async () => {
    try {
      await fetch(`${API_BASE_URL}/chat/history`, {
        method: 'DELETE',
      });
      setMessages([]);
    } catch (error) {
      console.error('대화 초기화 오류:', error);
    }
  };

  return (
    <>
      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <svg className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>안녕하세요! 환자 정보에 대해 궁금한 것이 있으시면 언제든 물어보세요.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm text-gray-600">답변을 생성 중...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-2">
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            title="대화 초기화"
          >
            초기화
          </button>
        </div>
        <div className="flex space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
