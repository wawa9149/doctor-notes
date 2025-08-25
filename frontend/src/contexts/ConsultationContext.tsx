"use client";

import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useContext,
  type ReactNode,
} from "react";
import { mergeContent } from "@/services/emrService";
import { useSTT, type STTUtterance } from "@/hooks/useSTT";
import type { PatientListItem } from "@/types/patient";
import type { MergeRequest } from "@/types/api";


// Types
type SpeakerRole = "환자" | "의사" | "기타";

// 1. 상태를 위한 Context 생성
const ConsultationStateContext = createContext<
  | {
      selectedPatient: PatientListItem | null;
      doctorNote: string;
      isProcessingMerge: boolean;
      speakerRoles: Record<string, SpeakerRole>;
      uniqueSpeakers: string[];
      isRecording: boolean;
      isProcessing: boolean;
      utterances: STTUtterance[];
      sttError: string | null;
      soapSummary: string | null;
    }
  | undefined
>(undefined);

// 2. 액션을 위한 Context 생성
const ConsultationDispatchContext = createContext<
  | {
      setSelectedPatient: (patient: PatientListItem | null) => void;
      setDoctorNote: (note: string) => void;
      startRecording: () => void;
      stopRecording: () => void;
      resetTranscript: () => void;
      handleRoleChange: (speaker: string, role: SpeakerRole) => void;
      handleSubmit: (e: React.FormEvent) => Promise<void>;
      clearResult: () => void;
    }
  | undefined
>(undefined);

// 3. Provider 컴포넌트 생성
export function ConsultationProvider({ children }: { children: ReactNode }) {
  const [selectedPatient, setSelectedPatient] =
    useState<PatientListItem | null>(null);
  const [doctorNote, setDoctorNote] = useState("");
  const [isProcessingMerge, setIsProcessingMerge] = useState(false);
  const [speakerRoles, setSpeakerRoles] = useState<
    Record<string, SpeakerRole>
  >({});
  const [uniqueSpeakers, setUniqueSpeakers] = useState<string[]>([]);
  const [soapSummary, setSoapSummary] = useState<string | null>(null);

  const {
    isRecording,
    isProcessing,
    utterances,
    startRecording,
    stopRecording,
    resetTranscript,
    error: sttError,
  } = useSTT();

  useEffect(() => {
    if (utterances.length > 0) {
      const speakers = new Set(utterances.map(u => u.speaker));
      const newSpeakers = Array.from(speakers).filter(s => s !== "SYSTEM");
      setUniqueSpeakers(newSpeakers);

      setSpeakerRoles(prevRoles => {
        const newRoles = { ...prevRoles };
        newSpeakers.forEach(speaker => {
          if (!newRoles[speaker]) {
            newRoles[speaker] = uniqueSpeakers.length > 1 && speaker === uniqueSpeakers[1] ? "의사" : "환자";
          }
        });
        return newRoles;
      });
    } else {
      setUniqueSpeakers([]);
    }
  }, [utterances, uniqueSpeakers.length]);

  const handleRoleChange = useCallback(
    (speaker: string, role: SpeakerRole) => {
      setSpeakerRoles(prev => ({ ...prev, [speaker]: role }));
    },
    []
  );

  const clearResult = useCallback(() => {
    setSoapSummary(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProcessingMerge(true);

      if (utterances.length === 0 || !doctorNote.trim()) {
        alert("녹음된 대화 내용과 의사 메모를 모두 입력해주세요.");
        setIsProcessingMerge(false);
        return;
      }
      
      const paragraph: MergeRequest["paragraph"] = utterances
        .map(u => {
            const role = speakerRoles[u.speaker];
            if (role !== "의사" && role !== "환자") {
                return null;
            }
            return {
                paragraph_speaker: role === "의사" ? "doctor" : "patient",
                paragraph_text: u.text,
            };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      try {
        const mergeData: MergeRequest = {
          tenant_id: "hospA", // 임시값
          patient_id: selectedPatient?.identifier || "p123", // 임시값
          encounter_id: "e789", // 임시값
          paragraph,
          doctor_note: doctorNote,
        };

        const response = await mergeContent(mergeData);
        setSoapSummary(response.soap_summary);
      } catch (error) {
        console.error("EMR 합치기 실패:", error);
        alert("EMR 합치기에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setIsProcessingMerge(false);
      }
    },
    [utterances, doctorNote, speakerRoles, selectedPatient]
  );

  const state = {
    selectedPatient,
    doctorNote,
    isProcessingMerge,
    speakerRoles,
    uniqueSpeakers,
    isRecording,
    isProcessing,
    utterances,
    sttError,
    soapSummary,
  };

  const dispatch = {
    setSelectedPatient,
    setDoctorNote,
    startRecording,
    stopRecording,
    resetTranscript,
    handleRoleChange,
    handleSubmit,
    clearResult,
  };

  return (
    <ConsultationStateContext.Provider value={state}>
      <ConsultationDispatchContext.Provider value={dispatch}>
        {children}
      </ConsultationDispatchContext.Provider>
    </ConsultationStateContext.Provider>
  );
}

// 4. 커스텀 훅 생성
export function useConsultationState() {
  const context = useContext(ConsultationStateContext);
  if (context === undefined) {
    throw new Error(
      "useConsultationState must be used within a ConsultationProvider"
    );
  }
  return context;
}

export function useConsultationDispatch() {
  const context = useContext(ConsultationDispatchContext);
  if (context === undefined) {
    throw new Error(
      "useConsultationDispatch must be used within a ConsultationProvider"
    );
  }
  return context;
}
