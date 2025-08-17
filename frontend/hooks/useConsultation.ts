"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/hooks/useEMR";
import { useSTT, type STTUtterance } from "@/hooks/useSTT";
import type { PatientListItem } from "@/types/patient";

type SpeakerRole = "환자" | "의사" | "기타";

interface MergedContent {
  conversation: string;
  doctorNote: string;
  summary: string[];
}

export function useConsultation() {
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] =
    useState<PatientListItem | null>(null);
  const [doctorNote, setDoctorNote] = useState("");
  const [isProcessingMerge, setIsProcessingMerge] = useState(false);
  const [mergedContent, setMergedContent] = useState<MergedContent | null>(
    null
  );
  const [speakerRoles, setSpeakerRoles] = useState<
    Record<string, SpeakerRole>
  >({});
  const [uniqueSpeakers, setUniqueSpeakers] = useState<string[]>([]);

  const {
    analyzeText,
    loading: analysisLoading,
    error: analysisError,
  } = useAnalysis();

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
            newRoles[speaker] = speaker === "SPEAKER-00" ? "환자" : "의사";
          }
        });
        return newRoles;
      });
    } else {
      setUniqueSpeakers([]);
    }
  }, [utterances]);

  const handleRoleChange = useCallback(
    (speaker: string, role: SpeakerRole) => {
      setSpeakerRoles(prev => ({ ...prev, [speaker]: role }));
    },
    []
  );

  const handleMergeContent = useCallback(async () => {
    setIsProcessingMerge(true);
    try {
      const conversationText = utterances
        .map(u => `${speakerRoles[u.speaker] || u.speaker}: ${u.text}`)
        .join("\n");

      await new Promise(resolve => setTimeout(resolve, 3000));

      setMergedContent({
        conversation: conversationText,
        doctorNote: doctorNote,
        summary: [
          "주요 증상: 두통, 어지러움",
          "진찰 소견: 혈압 정상, 신경학적 검사 정상",
          "처방: 진통제 처방, 휴식 권고",
          "다음 진료: 2주 후 재진료",
        ],
      });
    } catch (error) {
      console.error("RAG 처리 중 오류:", error);
      alert("내용을 처리하는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingMerge(false);
    }
  }, [utterances, speakerRoles, doctorNote]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const conversationText = utterances
        .map(u => `${speakerRoles[u.speaker] || u.speaker}: ${u.text}`)
        .join("\n");

      const finalText = `${conversationText}\n\n[의사 메모]\n${doctorNote}`;

      if (!finalText.trim() || utterances.length === 0) {
        alert("분석할 대화 내용이 없습니다.");
        return;
      }

      try {
        const analysisData = await analyzeText(finalText);
        sessionStorage.setItem(
          "analysisData",
          JSON.stringify({
            analysisData,
            conversationText: finalText,
            selectedPatient,
          })
        );
        router.push("/analysis");
      } catch (error) {
        console.error("분석 실패:", error);
        alert("분석에 실패했습니다. 다시 시도해주세요.");
      }
    },
    [
      utterances,
      doctorNote,
      speakerRoles,
      analyzeText,
      selectedPatient,
      router,
    ]
  );

  return {
    selectedPatient,
    setSelectedPatient,
    doctorNote,
    setDoctorNote,
    isProcessingMerge,
    mergedContent,
    speakerRoles,
    uniqueSpeakers,
    analysisLoading,
    analysisError,
    isRecording,
    isProcessing,
    utterances,
    startRecording,
    stopRecording,
    resetTranscript,
    sttError,
    handleRoleChange,
    handleMergeContent,
    handleSubmit,
  };
}
