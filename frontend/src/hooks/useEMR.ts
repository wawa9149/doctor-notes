// src/hooks/useEMR.ts

import { useState, useEffect } from "react";
import { getPatientRecords } from "../services/patientService";
import { analyzeDialogue, saveEMR } from "../services/emrService";
import type { EMRRecord, AnalyzeResponse, EMRSaveRequest } from "../types/api";

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

// 상담 분석 훅
export function useAnalysis() {
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const analyzeText = async (text: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await analyzeDialogue(text);
      setAnalysis(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("분석 실패");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { analysis, loading, error, analyzeText };
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
