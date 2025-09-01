// src/constants/api.ts

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  PATIENTS: "/emr/patients",
  SAVE_EMR: "/emr/save",
  PATIENT_RECORDS: "/emr/records",
  STT: "/stt",
  MERGE: "/merge",
} as const;
