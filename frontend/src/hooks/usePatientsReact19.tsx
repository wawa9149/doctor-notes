// React 19의 올바른 use Hook 사용법
import { use, Suspense, type ReactNode } from "react";
import { getPatients, getPatient } from "../services/patientService";
import type { PatientListItem } from "../types/patient";

// 캐시된 Promise를 생성 (중요!)
let patientsPromise: Promise<PatientListItem[]> | null = null;

function getPatientsPromise() {
  if (!patientsPromise) {
    patientsPromise = getPatients();
  }
  return patientsPromise;
}

// React 19 방식의 use Hook
export function usePatientsReact19(): PatientListItem[] {
  return use(getPatientsPromise());
}

// 개별 환자 데이터 (캐시 포함)
const patientCache = new Map<number, Promise<PatientListItem>>();

function getPatientPromise(patientId: number) {
  if (!patientCache.has(patientId)) {
    patientCache.set(patientId, getPatient(patientId));
  }
  return patientCache.get(patientId)!;
}

export function usePatientReact19(patientId: number): PatientListItem | null {
  if (!patientId) return null;
  return use(getPatientPromise(patientId));
}

// Suspense 래퍼
export function PatientsProviderReact19({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>환자 목록을 불러오는 중...</div>}>
      {children}
    </Suspense>
  );
}
