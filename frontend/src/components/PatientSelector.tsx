"use client";

import type { PatientListItem } from "@/types/patient";

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
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transition-all hover:shadow-xl">
      <div className="flex items-center mb-4">
        <span className="text-blue-500 mr-3">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </span>
        <h2 className="text-xl font-semibold">환자 선택</h2>
      </div>
      <select
        className="w-full p-2 border border-gray-300 rounded-md"
        value={isClient ? selectedPatient?.id || "" : ""}
        onChange={(e) => {
          const patient = patients.find(
            (p) => p.id === Number(e.target.value)
          );
          onSelectPatient(patient || null);
        }}
        aria-label="환자 선택"
      >
        <option value="">새로운 환자</option>
        {isClient &&
          patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name.text} ({patient.identifier}) -{" "}
              {new Date(patient.birth_date).toLocaleDateString()}
            </option>
          ))}
      </select>
    </div>
  );
}

