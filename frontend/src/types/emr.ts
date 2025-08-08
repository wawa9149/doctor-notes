// src/types/emr.ts

export interface Period {
  start?: string;
  end?: string;
}

export interface CodeableConcept {
  text: string;
  code?: string;
  system?: string;
  display?: string;
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
  dosage?: { [key: string]: string | number | boolean };
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
