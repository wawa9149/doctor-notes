"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteEncounterRecord,
  deletePatient,
} from "@/services/patientService";
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.name.text}님의 진료 기록
            </h1>
            <p className="text-gray-600 mt-2">
              차트번호: {patient.identifier} | 생년월일:{" "}
              {new Date(patient.birth_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              홈으로 돌아가기
            </button>
            <button
              onClick={handleDeletePatient}
              disabled={deletingPatient}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {deletingPatient ? "삭제 중..." : "환자 삭제"}
            </button>
          </div>
        </div>

        {/* 진료 기록 목록 */}
        <div className="space-y-6">
          {records.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-500 text-lg">
                아직 진료 기록이 없습니다.
              </p>
            </div>
          ) : (
            records.map((record, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
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
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p>
                      <strong>상태:</strong> {record.encounter.status}
                    </p>
                    <p>
                      <strong>진료 유형:</strong> {record.encounter.type}
                    </p>
                    <p>
                      <strong>진료 클래스:</strong> {record.encounter.class}
                    </p>
                    {record.encounter.reason_text && (
                      <p>
                        <strong>진료 사유:</strong>{" "}
                        {record.encounter.reason_text}
                      </p>
                    )}
                  </div>
                </div>

                {/* 진단 정보 */}
                {record.conditions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      진단 정보
                    </h4>
                    <div className="space-y-2">
                      {record.conditions.map((condition, idx) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-3">
                          <p className="font-medium">
                            {condition.code?.text || "진단명 없음"}
                          </p>
                          {condition.clinical_status && (
                            <p className="text-sm text-gray-600">
                              상태: {condition.clinical_status}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 관찰 결과 */}
                {record.observations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      관찰 결과
                    </h4>
                    <div className="space-y-2">
                      {record.observations.map((observation, idx) => (
                        <div key={idx} className="bg-green-50 rounded-lg p-3">
                          <p className="font-medium">
                            {observation.code?.text || "관찰 항목 없음"}
                          </p>
                          {observation.value_string && (
                            <p className="text-sm text-gray-600">
                              결과: {observation.value_string}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 처방 정보 */}
                {record.medications.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      처방 정보
                    </h4>
                    <div className="space-y-2">
                      {record.medications.map((medication, idx) => (
                        <div key={idx} className="bg-yellow-50 rounded-lg p-3">
                          <p className="font-medium">
                            {medication.medication?.text || "약물명 없음"}
                          </p>
                          {medication.status && (
                            <p className="text-sm text-gray-600">
                              상태: {medication.status}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 대화 내용 */}
                {record.conversation && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">
                      상담 내용
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {record.conversation.raw_text}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
