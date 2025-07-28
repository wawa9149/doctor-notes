import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { EMRRecord, PatientListItem } from "../services/apiClient";
import { getPatientRecords, getPatient } from "../services/apiClient";

export default function Records() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState<EMRRecord[]>([]);
  const [patient, setPatient] = useState<PatientListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setError("환자 ID가 필요합니다.");
      setLoading(false);
      return;
    }

    const id = parseInt(patientId);
    Promise.all([getPatient(id), getPatientRecords(id)])
      .then(([patientData, recordsData]) => {
        setPatient(patientData);
        setRecords(recordsData);
      })
      .catch((err) => {
        console.error("데이터 조회 실패:", err);
        setError("데이터를 불러오는데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <div className="text-center p-8">로딩 중...</div>;
  if (error) return <div className="text-center p-8 text-red-600">{error}</div>;
  if (!records.length || !patient)
    return <div className="text-center p-8">진료 기록이 없습니다.</div>;

  const latestRecord = records[0];

  return (
    <div className="w-screen bg-gray-50 min-h-screen p-10">
      <div className="w-full px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            👨‍👩‍👧‍👦 환자 진료 기록
          </h1>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
          >
            <span>🏠</span>
            <span>홈으로</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 w-full">
          {/* Left Column: Patient Info */}
          <div className="lg:w-2/5 w-full">
            <div className="bg-white rounded-xl shadow-lg p-6 h-fit">
              <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-4">
                환자 정보
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">이름</p>
                  <p className="text-lg font-medium">{patient.name.text}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">차트번호</p>
                  <p className="text-lg font-medium">{patient.identifier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">생년월일</p>
                  <p className="text-lg font-medium">
                    {new Date(patient.birth_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">성별</p>
                  <p className="text-lg font-medium">
                    {patient.gender === "male"
                      ? "남성"
                      : patient.gender === "female"
                      ? "여성"
                      : "기타"}
                  </p>
                </div>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-500">최근 진료일</p>
                  <p className="text-lg font-medium">
                    {new Date(
                      latestRecord.encounter.period?.start || ""
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">진료 상태</p>
                  <p className="text-lg font-medium">
                    {latestRecord.encounter.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">진료 유형</p>
                  <p className="text-lg font-medium">
                    {latestRecord.encounter.type}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Medical Records */}
          <div className="lg:w-3/5 w-full">
            <div className="space-y-6">
              {records.map((record, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                  {/* 대화 기록 */}
                  {record.conversation && (
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
                        진료 대화
                      </h3>
                      <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">
                        {record.conversation.raw_text}
                      </div>
                      {record.conversation.summary && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="font-medium text-blue-900">요약</p>
                          <p className="text-blue-800">
                            {record.conversation.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 진단 정보 */}
                  {record.conditions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
                        진단
                      </h3>
                      <div className="space-y-3">
                        {record.conditions.map((condition, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-yellow-50 rounded-lg"
                          >
                            <p className="font-medium text-lg">
                              {condition.code?.text}
                            </p>
                            <p className="text-gray-600">
                              심각도: {condition.severity} | 상태:{" "}
                              {condition.clinical_status}
                            </p>
                            {condition.onset_datetime && (
                              <p className="text-gray-600">
                                증상 시작:{" "}
                                {new Date(
                                  condition.onset_datetime
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 관찰 사항 */}
                  {record.observations.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
                        관찰 사항
                      </h3>
                      <div className="space-y-3">
                        {record.observations.map((observation, idx) => (
                          <div key={idx} className="p-4 bg-green-50 rounded-lg">
                            <p className="font-medium text-lg">
                              {observation.code?.text}
                            </p>
                            <p className="text-gray-700">
                              {observation.value_string}
                            </p>
                            {observation.effective_datetime && (
                              <p className="text-gray-600">
                                관찰 시점:{" "}
                                {new Date(
                                  observation.effective_datetime
                                ).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 약물 정보 */}
                  {record.medications.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
                        처방 약물
                      </h3>
                      <div className="space-y-3">
                        {record.medications.map((medication, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-purple-50 rounded-lg"
                          >
                            <p className="font-medium text-lg">
                              {medication.medication?.text}
                            </p>
                            <p className="text-gray-700">
                              {medication.dosage?.text}
                            </p>
                            {medication.effective_period?.start && (
                              <p className="text-gray-600">
                                복용 시작:{" "}
                                {new Date(
                                  medication.effective_period.start
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
