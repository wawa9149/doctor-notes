"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteEncounterRecord,
  deletePatient,
} from "@/services/patientService";
import Header from "./Header";
import type { PatientListItem } from "@/types/patient";
import type { EMRRecord } from "@/types/emr";

interface PatientDetailProps {
  patient: PatientListItem;
  records: EMRRecord[];
}

export default function PatientDetail({
  patient,
  records,
}: PatientDetailProps) {
  const router = useRouter();
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);
  const [deletingPatient, setDeletingPatient] = useState(false);

  const handleDeleteRecord = async (encounterId: number) => {
    if (!confirm("이 진료 기록을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setDeletingRecordId(encounterId);
      await deleteEncounterRecord(encounterId);
      alert("진료 기록이 삭제되었습니다.");
      // 페이지 새로고침으로 데이터 다시 로드
      window.location.reload();
    } catch (error) {
      console.error("진료 기록 삭제 실패:", error);
      alert("진료 기록 삭제에 실패했습니다.");
    } finally {
      setDeletingRecordId(null);
    }
  };

  const handleDeletePatient = async () => {
    if (
      !confirm(
        "이 환자와 관련된 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
      )
    ) {
      return;
    }

    try {
      setDeletingPatient(true);
      await deletePatient(patient.id);
      alert("환자가 삭제되었습니다.");
      router.push("/");
    } catch (error) {
      console.error("환자 삭제 실패:", error);
      alert("환자 삭제에 실패했습니다.");
    } finally {
      setDeletingPatient(false);
    }
  };

  const extraButtons = (
    <>
      <button
        onClick={() => router.push("/")}
        className="px-6 py-2 rounded-lg transition-all duration-200 font-medium text-gray-600 hover:bg-gray-50 flex items-center space-x-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>홈으로</span>
      </button>
      <button
        onClick={handleDeletePatient}
        disabled={deletingPatient}
        className="px-6 py-2 rounded-lg transition-all duration-200 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center space-x-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>{deletingPatient ? "삭제 중..." : "환자 삭제"}</span>
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header extraButtons={extraButtons} />
      
      <div className="max-w-7xl mx-auto p-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {patient.name.text}님의 진료 기록
          </h1>
          <div className="flex items-center space-x-4 text-gray-600">
            <span className="flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              차트번호: {patient.identifier}
            </span>
            <span className="flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1M7 7h10l-1 10H8L7 7z" />
              </svg>
              생년월일: {new Date(patient.birth_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* 진료 기록 목록 */}
        {records.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-500 text-lg">
              아직 진료 기록이 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {records.map((record, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      진료 기록 #{index + 1}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(
                        record.encounter.period?.start || ""
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteRecord(record.encounter.id)}
                    disabled={deletingRecordId === record.encounter.id}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 disabled:opacity-50 text-sm"
                  >
                    {deletingRecordId === record.encounter.id
                      ? "삭제 중..."
                      : "삭제"}
                  </button>
                </div>

                {/* 진료 정보 */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    진료 정보
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p>
                      <strong>상태:</strong> {record.encounter.status}
                    </p>
                    <p>
                      <strong>상담 시작:</strong>{" "}
                      {record.encounter.period?.start
                        ? new Date(record.encounter.period.start).toLocaleString()
                        : "기록 없음"}
                    </p>
                    <p>
                      <strong>상담 종료:</strong>{" "}
                      {record.encounter.period?.end
                        ? new Date(record.encounter.period.end).toLocaleString()
                        : "진행 중 또는 기록 없음"}
                    </p>
                    <p>
                      <strong>진료 유형:</strong> {record.encounter.type}
                    </p>
                    {record.encounter.reason_text && (
                      <p>
                        <strong>진료 사유:</strong>{" "}
                        {record.encounter.reason_text}
                      </p>
                    )}
                  </div>
                </div>

                {/* SOAP 노트 */}
                {record.soap_notes.length > 0 && (
                  <div className="mb-4 flex-1">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      SOAP 노트
                    </h4>
                    {record.soap_notes.map((note) => (
                      <div key={note.id} className="bg-blue-50 rounded-lg p-3 border border-blue-200 max-h-48 overflow-y-auto">
                        <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                          {note.soap_summary}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                {/* 채팅 히스토리 */}
                {record.chat_sessions.length > 0 && (
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      AI 챗봇 상담 ({record.chat_sessions.length}개 세션)
                    </h4>
                    {record.chat_sessions.map((session, sessionIndex) => (
                      <div key={session.id} className="mb-3 last:mb-0">
                        {record.chat_sessions.length > 1 && (
                          <p className="text-xs text-gray-500 mb-2">세션 {sessionIndex + 1}</p>
                        )}
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-32 overflow-y-auto">
                          <div className="space-y-2">
                            {session.messages.slice(-4).map((message: any) => (
                              <div
                                key={message.id}
                                className={`flex ${
                                  message.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[85%] rounded py-1 px-2 ${
                                    message.role === "user"
                                      ? "bg-blue-500 text-white"
                                      : "bg-white text-gray-800 shadow-sm"
                                  }`}
                                >
                                  <p className="text-xs whitespace-pre-wrap">
                                    {message.content.length > 100 
                                      ? message.content.substring(0, 100) + "..."
                                      : message.content
                                    }
                                  </p>
                                </div>
                              </div>
                            ))}
                            {session.messages.length > 4 && (
                              <p className="text-xs text-gray-400 text-center">
                                ... 총 {session.messages.length}개 메시지
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}