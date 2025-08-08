// src/constants/api.ts

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export const API_ENDPOINTS = {
  PATIENTS: "/emr/patients",
  ANALYZE: "/analyze",
  SAVE_EMR: "/emr/save",
  PATIENT_RECORDS: "/emr/records",
} as const;
