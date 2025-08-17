"use client";

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
  type ReactNode,
} from "react";
import { getPatients, deletePatient } from "@/services/patientService";
import type { PatientListItem } from "@/types/patient";

// 1. 상태를 위한 Context 생성
const PatientsStateContext = createContext<
  | {
      patients: PatientListItem[];
      searchTerm: string;
      deletingPatientId: number | null;
      filteredPatients: PatientListItem[];
    }
  | undefined
>(undefined);

// 2. 상태 변경 함수(액션)를 위한 Context 생성
const PatientsDispatchContext = createContext<
  | {
      setSearchTerm: (term: string) => void;
      handleDeletePatient: (patientId: number, patientName: string) => Promise<void>;
      removePatientFromList: (patientId: number) => void;
    }
  | undefined
>(undefined);

// 3. Provider 컴포넌트 생성
export function PatientsProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingPatientId, setDeletingPatientId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch (error) {
        console.error("환자 목록 조회에 실패했습니다.", error);
      }
    }
    fetchPatients();
  }, []);

  const removePatientFromList = useCallback((patientId: number) => {
    setPatients(prevPatients => prevPatients.filter(p => p.id !== patientId));
  }, []);

  const handleDeletePatient = useCallback(
    async (patientId: number, patientName: string) => {
      if (
        !confirm(
          `환자 "${patientName}"을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
        )
      ) {
        return;
      }
      try {
        setDeletingPatientId(patientId);
        await deletePatient(patientId);
        removePatientFromList(patientId);
        alert("환자가 삭제되었습니다.");
      } catch (error) {
        console.error("환자 삭제 실패:", error);
        alert("환자 삭제에 실패했습니다.");
      } finally {
        setDeletingPatientId(null);
      }
    },
    [removePatientFromList]
  );

  const filteredPatients = useMemo(
    () =>
      patients.filter(
        patient =>
          patient.name.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.identifier.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [patients, searchTerm]
  );

  const state = {
    patients,
    searchTerm,
    deletingPatientId,
    filteredPatients,
  };

  const dispatch = {
    setSearchTerm,
    handleDeletePatient,
    removePatientFromList,
  };

  return (
    <PatientsStateContext.Provider value={state}>
      <PatientsDispatchContext.Provider value={dispatch}>
        {children}
      </PatientsDispatchContext.Provider>
    </PatientsStateContext.Provider>
  );
}

// 4. 사용 편의성을 위한 커스텀 훅 생성
export function usePatientsState() {
  const context = useContext(PatientsStateContext);
  if (context === undefined) {
    throw new Error("usePatientsState must be used within a PatientsProvider");
  }
  return context;
}

export function usePatientsDispatch() {
  const context = useContext(PatientsDispatchContext);
  if (context === undefined) {
    throw new Error(
      "usePatientsDispatch must be used within a PatientsProvider"
    );
  }
  return context;
}
