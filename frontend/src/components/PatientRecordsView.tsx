"use client";

import { useRouter } from "next/navigation";
import {
  usePatientsState,
  usePatientsDispatch,
} from "@/contexts/PatientsContext";

export default function PatientRecordsView() {
  const router = useRouter();
  const { filteredPatients, searchTerm, deletingPatientId } =
    usePatientsState();
  const { setSearchTerm, handleDeletePatient } = usePatientsDispatch();

  return (
    <div>
      {/* 검색 바 */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="환자 이름 또는 차트번호로 검색"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
          <span className="absolute right-3 top-4 text-gray-400">🔍</span>
        </div>
      </div>

      {/* 환자 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map(patient => (
          <div
            key={patient.id}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{patient.name.text}</h3>
                <p className="text-gray-600">
                  차트번호: {patient.identifier}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/records/${patient.id}`)}
                  className="px-3 py-1 bg-teal-100 text-teal-600 rounded-md hover:bg-teal-200"
                >
                  기록 보기
                </button>
                <button
                  onClick={() =>
                    handleDeletePatient(patient.id, patient.name.text)
                  }
                  disabled={deletingPatientId === patient.id}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 disabled:opacity-50"
                >
                  {deletingPatientId === patient.id ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600">
                생년월일: {new Date(patient.birth_date).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                성별:{" "}
                {patient.gender === "male"
                  ? "남성"
                  : patient.gender === "female"
                  ? "여성"
                  : "기타"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
