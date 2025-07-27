import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type { EMRRecord } from "../services/apiClient";
import { getPatientRecords } from "../services/apiClient";

export default function Records() {
  const { patientId } = useParams();
  const [records, setRecords] = useState<EMRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setError("환자 ID가 필요합니다.");
      setLoading(false);
      return;
    }

    getPatientRecords(parseInt(patientId))
      .then((data) => setRecords(data))
      .catch((err) => {
        console.error("기록 조회 실패:", err);
        setError("기록을 불러오는데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <div className="text-center p-8">로딩 중...</div>;
  if (error) return <div className="text-center p-8 text-red-600">{error}</div>;
  if (!records.length)
    return <div className="text-center p-8">진료 기록이 없습니다.</div>;

  return (
    <div className="flex flex-col w-screen p-8 items-center justify-center">
      <h1 className="text-2xl font-bold mb-6">진료 기록</h1>

      <div className="space-y-6">
        {records.map((record, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            {/* 진료 정보 */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">진료 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">
                    진료 유형: {record.encounter.type}
                  </p>
                  <p className="text-gray-600">
                    방문 이유: {record.encounter.reason_text}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">
                    진료 시작:{" "}
                    {new Date(
                      record.encounter.period?.start || ""
                    ).toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    상태: {record.encounter.status}
                  </p>
                </div>
              </div>
            </div>

            {/* 대화 기록 */}
            {record.conversation && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <h3 className="text-lg font-semibold mb-2">진료 대화</h3>
                <div className="whitespace-pre-wrap text-gray-700">
                  {record.conversation.raw_text}
                </div>
                {record.conversation.summary && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
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
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">진단</h3>
                <div className="space-y-2">
                  {record.conditions.map((condition, idx) => (
                    <div key={idx} className="p-2 bg-yellow-50 rounded">
                      <p className="font-medium">{condition.code?.text}</p>
                      <p className="text-sm text-gray-600">
                        심각도: {condition.severity} | 상태:{" "}
                        {condition.clinical_status}
                      </p>
                      {condition.onset_datetime && (
                        <p className="text-sm text-gray-600">
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
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">관찰 사항</h3>
                <div className="space-y-2">
                  {record.observations.map((observation, idx) => (
                    <div key={idx} className="p-2 bg-green-50 rounded">
                      <p className="font-medium">{observation.code?.text}</p>
                      <p className="text-gray-700">
                        {observation.value_string}
                      </p>
                      {observation.effective_datetime && (
                        <p className="text-sm text-gray-600">
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
                <h3 className="text-lg font-semibold mb-2">처방 약물</h3>
                <div className="space-y-2">
                  {record.medications.map((medication, idx) => (
                    <div key={idx} className="p-2 bg-purple-50 rounded">
                      <p className="font-medium">
                        {medication.medication?.text}
                      </p>
                      <p className="text-gray-700">{medication.dosage?.text}</p>
                      {medication.effective_period?.start && (
                        <p className="text-sm text-gray-600">
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
  );
}
