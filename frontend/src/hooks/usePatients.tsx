// src/hooks/usePatients.tsx - React 19 방식

import React, { use, Suspense, type ReactNode } from "react";
import { getPatients, getPatient } from "../services/patientService";
import type { PatientListItem } from "../types/patient";

// 클라이언트에서만 실행되도록 체크
function isClient() {
  return typeof window !== "undefined";
}

// 캐시된 Promise를 생성 (중요!)
let patientsPromise: Promise<PatientListItem[]> | null = null;

function getPatientsPromise() {
  // 서버 사이드에서는 빈 배열 반환
  if (!isClient()) {
    return Promise.resolve([]);
  }

  if (!patientsPromise) {
    patientsPromise = getPatients().catch((error) => {
      console.error("[getPatients] API 호출 실패:", error);
      throw error; // 반드시 다시 던지기
    });
  }
  return patientsPromise;
}

// React 19의 use Hook 사용
export function usePatients(): PatientListItem[] {
  // 서버 사이드에서는 빈 배열 반환
  if (!isClient()) {
    return [];
  }
  return use(getPatientsPromise());
}

// 개별 환자 데이터 (캐시 포함)
const patientCache = new Map<number, Promise<PatientListItem>>();

function getPatientPromise(patientId: number) {
  // 서버 사이드에서는 null Promise 반환
  if (!isClient()) {
    return Promise.resolve(null);
  }

  if (!patientCache.has(patientId)) {
    patientCache.set(
      patientId,
      getPatient(patientId).catch((error) => {
        console.error(`[getPatient] API 호출 실패 (ID: ${patientId}):`, error);
        throw error; // 반드시 다시 던지기
      })
    );
  }
  return patientCache.get(patientId)!;
}

export function usePatient(patientId: number): PatientListItem | null {
  if (!patientId) return null;
  // 서버 사이드에서는 null 반환
  if (!isClient()) {
    return null;
  }
  return use(getPatientPromise(patientId));
}

// Suspense 래퍼
export function PatientsProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>환자 목록을 불러오는 중...</div>}>
      {children}
    </Suspense>
  );
}
