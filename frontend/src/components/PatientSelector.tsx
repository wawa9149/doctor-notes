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
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500 transition-all hover:shadow-xl">
      <div className="flex items-center mb-4">
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

