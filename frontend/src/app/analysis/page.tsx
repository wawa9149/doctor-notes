"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalyzeResponse } from "@/types/api";
import type { PatientListItem } from "@/types/patient";

interface AnalysisData {
  analysisData: AnalyzeResponse;
  conversationText: string;
  selectedPatient: PatientListItem | null;
}

export default function AnalysisPage() {
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // sessionStorage에서 분석 데이터 가져오기
    const storedData = sessionStorage.getItem("analysisData");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setAnalysisData(parsedData);
      } catch (error) {
        console.error("분석 데이터 파싱 실패:", error);
        alert("분석 데이터를 불러오는데 실패했습니다.");
        router.push("/");
      }
    } else {
      alert("분석 데이터가 없습니다.");
      router.push("/");
    }
    setLoading(false);
  }, [router]);

  const handleSaveEMR = async () => {
    if (!analysisData) return;

    try {
      // EMR 저장 API 호출
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/emr/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            conversation_text: analysisData.conversationText,
            llm_analysis_result: analysisData.analysisData,
            patient_identifier:
              analysisData.selectedPatient?.identifier || "NEW",
            patient_name: analysisData.selectedPatient?.name.text || "새 환자",
            patient_birth_date:
              analysisData.selectedPatient?.birth_date || "1990-01-01",
            patient_gender: analysisData.selectedPatient?.gender || "unknown",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("EMR 저장 실패");
      }

      await response.json();
      alert("EMR이 성공적으로 저장되었습니다!");

      // 저장 후 sessionStorage 정리
      sessionStorage.removeItem("analysisData");
      router.push("/");
    } catch (error) {
      console.error("EMR 저장 실패:", error);
      alert("EMR 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">분석 결과를 불러오는 중...</div>
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  const {
    analysisData: data,
    conversationText,
    selectedPatient,
  } = analysisData;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">분석 결과</h1>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            홈으로 돌아가기
          </button>
        </div>

        {/* 환자 정보 */}
        {selectedPatient && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">환자 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600">이름</p>
                <p className="font-medium">{selectedPatient.name.text}</p>
              </div>
              <div>
                <p className="text-gray-600">차트번호</p>
                <p className="font-medium">{selectedPatient.identifier}</p>
              </div>
              <div>
                <p className="text-gray-600">생년월일</p>
                <p className="font-medium">
                  {new Date(selectedPatient.birth_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 대화 내용 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">상담 내용</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">
              {conversationText}
            </p>
          </div>
        </div>

        {/* 분석 결과 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">AI 분석 결과</h2>

          {/* 진료 정보 */}
          {data.Encounter && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                진료 정보
              </h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">상태</p>
                    <p className="font-medium">{data.Encounter.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">진료 유형</p>
                    <p className="font-medium">{data.Encounter.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">진료 클래스</p>
                    <p className="font-medium">{data.Encounter.class}</p>
                  </div>
                  {data.Encounter.reason_text && (
                    <div>
                      <p className="text-gray-600">진료 사유</p>
                      <p className="font-medium">
                        {data.Encounter.reason_text}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 진단 정보 */}
          {data.Condition && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                진단 정보
              </h3>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">진단명</p>
                    <p className="font-medium">
                      {data.Condition.code?.text || "진단명 없음"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">상태</p>
                    <p className="font-medium">
                      {data.Condition.clinical_status}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">확인 상태</p>
                    <p className="font-medium">
                      {data.Condition.verification_status}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">심각도</p>
                    <p className="font-medium">{data.Condition.severity}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 관찰 결과 */}
          {data.Observation && data.Observation.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                관찰 결과
              </h3>
              <div className="space-y-3">
                {data.Observation.map((obs, index) => (
                  <div key={index} className="bg-green-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">관찰 항목</p>
                        <p className="font-medium">
                          {obs.code?.text || "항목 없음"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">결과</p>
                        <p className="font-medium">
                          {obs.value_string || "결과 없음"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">상태</p>
                        <p className="font-medium">{obs.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 처방 정보 */}
          {data.MedicationStatement && data.MedicationStatement.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                처방 정보
              </h3>
              <div className="space-y-3">
                {data.MedicationStatement.map((med, index) => (
                  <div key={index} className="bg-yellow-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">약물명</p>
                        <p className="font-medium">
                          {med.medication?.text || "약물명 없음"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">상태</p>
                        <p className="font-medium">{med.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleSaveEMR}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            EMR 저장
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            새 진료 시작
          </button>
        </div>
      </div>
    </div>
  );
}
