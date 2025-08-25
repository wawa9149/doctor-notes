"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PatientListItem } from "@/types/patient";

interface AnalysisData {
  soap_summary: string;
  selectedPatient: PatientListItem | null;
}

export default function AnalysisPage() {
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const { soap_summary, selectedPatient } = analysisData;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            EMR 초안 (SOAP 노트)
          </h1>
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

        {/* 분석 결과 (SOAP 노트) */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            AI 기반 SOAP 노트 초안
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
              {soap_summary}
            </p>
          </div>
        </div>
        
        {/* 액션 버튼 */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={() => {
              navigator.clipboard.writeText(soap_summary);
              alert("SOAP 노트가 클립보드에 복사되었습니다.");
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            결과 복사하기
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
