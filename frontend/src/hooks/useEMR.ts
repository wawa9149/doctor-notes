// src/hooks/useEMR.ts

import { useState, useEffect } from "react";
import { getPatientRecords } from "../services/patientService";
import { saveEMR } from "../services/emrService";
import type { EMRRecord, EMRSaveRequest } from "../types/api";

// 환자 기록 조회 훅
export function usePatientRecords(patientId: number) {
  const [records, setRecords] = useState<EMRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const data = await getPatientRecords(patientId);
        setRecords(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchRecords();
    }
  }, [patientId]);

  return { records, loading, error };
}

// EMR 저장 훅
export function useEMRSave() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveRecord = async (data: EMRSaveRequest) => {
    try {
      setLoading(true);
      setError(null);
      const result = await saveEMR(data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("저장 실패");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, saveRecord };
}
