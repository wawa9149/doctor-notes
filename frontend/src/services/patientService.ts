// src/services/patientService.ts
import { API_ENDPOINTS } from "../constants/api";
import type { PatientListItem } from "../types/patient";
import type { EMRRecord } from "../types/emr";
import type { PatientCreateRequest, PatientResponse } from "../types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function getPatients(): Promise<PatientListItem[]> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PATIENTS}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("환자 목록 조회 실패");
  return response.json();
}

export async function getPatient(patientId: number): Promise<PatientListItem> {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.PATIENTS}/${patientId}`,
    {
      credentials: "include",
    }
  );
  if (!response.ok) throw new Error("환자 정보 조회 실패");
  return response.json();
}

export async function getPatientRecords(
  patientId: number
): Promise<EMRRecord[]> {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.PATIENT_RECORDS}/${patientId}`,
    {
      credentials: "include",
    }
  );
  if (!response.ok) throw new Error("기록 조회 실패");
  return response.json();
}

export async function deleteEncounterRecord(encounterId: number) {
  const response = await fetch(`${API_BASE_URL}/emr/records/${encounterId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error("진료 기록 삭제 실패");
  return response.json();
}

export async function deletePatient(patientId: number) {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.PATIENTS}/${patientId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  if (!response.ok) throw new Error("환자 삭제 실패");
  return response.json();
}

export async function createPatient(data: PatientCreateRequest): Promise<PatientResponse> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PATIENTS}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "환자 생성 실패");
  }
  return response.json();
}

// Encounter 관리 함수들
export async function createEncounter(data: {
  patient_id: number;
  encounter_type?: string;
  reason_code?: any;
  reason_text?: string;
  created_by?: string;
  notes?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/emr/encounters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("진료 접수 생성 실패");
  return response.json();
}

export async function updateEncounterStatus(
  encounterId: number,
  status: string
) {
  const response = await fetch(`${API_BASE_URL}/emr/encounters/${encounterId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("진료 접수 상태 업데이트 실패");
  return response.json();
}
