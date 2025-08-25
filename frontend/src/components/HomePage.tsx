"use client";

import { useState, useEffect } from "react";
import NewConsultationView from "./NewConsultationView";
import PatientRecordsView from "./PatientRecordsView";
// import { useConsultationState } from "@/contexts/ConsultationContext";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"new" | "records">("new");
  // const { analysisError } = useConsultationState();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="w-screen min-h-screen">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-teal-500">
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
                      ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  ✨ 새로운 진료
                </button>
                <button
                  onClick={() => setActiveTab("records")}
                  className={`px-6 py-2 rounded-lg transition-all duration-200 font-medium ${
                    activeTab === "records"
                      ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md"
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
        {activeTab === "new" ? (
          <NewConsultationView isClient={isClient} />
        ) : (
          <PatientRecordsView />
        )}
      </div>
    </div>
  );
}