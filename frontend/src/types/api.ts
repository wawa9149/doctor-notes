// src/types/api.ts
import type { HumanName } from "./patient";

export interface AnalyzeResponse {
  Patient?: {
    name: HumanName;
    birth_date?: string;
    gender?: string;
  };
  Encounter?: {
    status?: string;
    class?: string;
    type?: string;
    reason_text?: string;
    period?: {
      start?: string;
      end?: string;
    };
  };
  Condition?: {
    clinical_status?: string;
    verification_status?: string;
    code?: {
      text?: string;
    };
    severity?: string;
    onset_datetime?: string;
  };
  Observation?: Array<{
    status?: string;
    code?: {
      text?: string;
    };
    value_string?: string;
    effective_datetime?: string;
  }>;
  MedicationStatement?: Array<{
    status?: string;
    medication?: {
      text?: string;
    };
  }>;
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

// Re-export commonly used types for convenience
export type { HumanName, PatientListItem, PatientRecord } from "./patient";
export type { EMRRecord } from "./emr";
