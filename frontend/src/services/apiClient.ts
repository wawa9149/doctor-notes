// src/services/apiClient.ts
// 이 파일은 이제 다른 서비스들과 타입들을 re-export하는 역할을 합니다

// 서비스 함수들 명시적 re-export (중복 방지)
export {
  getPatients,
  getPatient,
  getPatientRecords,
  deleteEncounterRecord,
  deletePatient,
} from "./patientService";

export { analyzeDialogue, saveEMR } from "./emrService";

// 타입들 re-export (기존 코드와의 호환성을 위해)
export * from "../types/api";
export * from "../types/patient";
export * from "../types/emr";
