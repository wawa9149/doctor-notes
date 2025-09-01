"use client";

import { useState } from "react";
import { createPatient } from "@/services/patientService";
import { usePatientsDispatch } from "@/contexts/PatientsContext";
import type { PatientListItem }from "@/types/patient";

interface PatientSelectorProps {
  patients: PatientListItem[];
  selectedPatient: PatientListItem | null;
  onSelectPatient: (patient: PatientListItem | null) => void;
  isClient: boolean;
}

export default function PatientSelector({
  patients,
  selectedPatient,
  onSelectPatient,
  isClient,
}: PatientSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addPatientToList } = usePatientsDispatch();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patientId = Number(e.target.value);
    const patient = patients.find(p => p.id === patientId) || null;
    onSelectPatient(patient);
  };

  const handleNewPatientSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPatientData = {
      identifier: formData.get("identifier") as string,
      name: formData.get("name") as string,
      birth_date: formData.get("birth_date") as string,
      gender: formData.get("gender") as 'male' | 'female' | 'other' | 'unknown',
    };

    try {
      const newPatient = await createPatient(newPatientData);
      addPatientToList(newPatient);
      onSelectPatient(newPatient);
      setIsModalOpen(false);
    } catch (error) {
      console.error("환자 생성 실패:", error);
      alert(error instanceof Error ? error.message : "환자 생성에 실패했습니다.");
    }
  };

  if (!isClient) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <label
            htmlFor="patient-select"
            className="text-lg font-semibold text-gray-800"
          >
            환자 선택
          </label>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            신규 환자 등록
          </button>
        </div>
        <select
          id="patient-select"
          value={selectedPatient?.id || ""}
          onChange={handleSelectChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="" disabled>
            환자를 선택하세요
          </option>
          {patients.map(patient => (
            <option key={patient.id} value={patient.id}>
              {patient.name.text} ({patient.identifier})
            </option>
          ))}
        </select>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">신규 환자 등록</h2>
            <form onSubmit={handleNewPatientSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">차트번호</label>
                  <input type="text" name="identifier" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">이름</label>
                  <input type="text" name="name" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">생년월일</label>
                  <input type="date" name="birth_date" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">성별</label>
                  <select name="gender" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                    <option value="other">기타</option>
                    <option value="unknown">알 수 없음</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">취소</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

