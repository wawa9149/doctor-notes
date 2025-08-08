// src/services/patientService.ts
import { API_ENDPOINTS } from "../constants/api";
import type { PatientListItem } from "../types/patient";
import type { EMRRecord } from "../types/emr";

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
