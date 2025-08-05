// src/services/apiClient.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// --- API Type Definitions ---

interface HumanName {
  text: string;
  family?: string;
  given?: string[];
}

interface Period {
  start?: string;
  end?: string;
}

interface CodeableConcept {
  text: string;
  code?: string;
  system?: string;
  display?: string;
}

export interface AnalyzeResponse {
  Patient?: {
    name: HumanName;
    birth_date?: string;
    gender?: string;
  };
  Encounter?: any;
  Condition?: any;
  Observation?: any[];
  MedicationStatement?: any[];
}

export interface EMRSaveRequest {
  patient_identifier: string;
  patient_name: string;
  patient_birth_date: string;
  patient_gender: string;
  conversation_text: string;
  llm_analysis_result: AnalyzeResponse;
}

export interface EMRSaveResponse {
  patient_id: number;
  encounter_id: number;
  message: string;
}

export interface PatientRecord {
  id: number;
  resource_type: string;
  name: HumanName;
  gender?: string;
  birth_date?: string;
  identifier?: string;
}

export interface EncounterRecord {
  id: number;
  resource_type: string;
  status: string;
  class: string;
  type: string;
  period?: Period;
  reason_text?: string;
}

export interface ConditionRecord {
  id: number;
  resource_type: string;
  code?: CodeableConcept;
  clinical_status?: string;
  verification_status?: string;
  onset_datetime?: string;
  severity?: string;
}

export interface ObservationRecord {
  id: number;
  resource_type: string;
  status?: string;
  code?: CodeableConcept;
  value_string?: string;
  effective_datetime?: string;
}

export interface MedicationStatementRecord {
  id: number;
  resource_type: string;
  status?: string;
  medication?: CodeableConcept;
  dosage?: { [key: string]: any };
  effective_period?: Period;
}

export interface ConversationResponse {
  id: number;
  raw_text: string;
  summary?: string;
  participants?: { [key: string]: string };
  language: string;
  created_at: string;
}

export interface EMRRecord {
  encounter: EncounterRecord;
  conditions: ConditionRecord[];
  observations: ObservationRecord[];
  medications: MedicationStatementRecord[];
  conversation?: ConversationResponse;
}

export interface PatientListItem {
  id: number;
  identifier: string;
  name: { text: string };
  gender: string;
  birth_date: string;
  created_at: string;
}

// --- API Functions ---

export async function getPatients(): Promise<PatientListItem[]> {
  const response = await fetch(`${API_BASE_URL}/emr/patients`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("환자 목록 조회 실패");
  return response.json();
}

export async function analyzeDialogue(text: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("분석 요청 실패");
  return response.json();
}

export async function saveEMR(data: EMRSaveRequest): Promise<EMRSaveResponse> {
  const response = await fetch(`${API_BASE_URL}/emr/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("EMR 저장 실패");
  return response.json();
}

export async function getPatient(patientId: number): Promise<PatientListItem> {
  const response = await fetch(`${API_BASE_URL}/emr/patients/${patientId}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("환자 정보 조회 실패");
  return response.json();
}

export async function getPatientRecords(
  patientId: number
): Promise<EMRRecord[]> {
  const response = await fetch(`${API_BASE_URL}/emr/records/${patientId}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("기록 조회 실패");
  return response.json();
}
