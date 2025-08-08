// src/types/patient.ts

export interface HumanName {
  text: string;
  family?: string;
  given?: string[];
}

export interface PatientListItem {
  id: number;
  identifier: string;
  name: { text: string };
  gender: string;
  birth_date: string;
  created_at: string;
}

export interface PatientRecord {
  id: number;
  resource_type: string;
  name: HumanName;
  gender?: string;
  birth_date?: string;
  identifier?: string;
}
