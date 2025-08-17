"use client";

import PatientSelector from "./PatientSelector";
import ConsultationInput from "./ConsultationInput";
import AnalysisResult from "./AnalysisResult";
import {
  useConsultationState,
  useConsultationDispatch,
} from "@/contexts/ConsultationContext";
import { usePatientsState } from "@/contexts/PatientsContext";

interface NewConsultationViewProps {
  isClient: boolean;
}

export default function NewConsultationView({
  isClient,
}: NewConsultationViewProps) {
  const {
    selectedPatient,
    sttError,
    isRecording,
    isProcessing,
    utterances,
    uniqueSpeakers,
    speakerRoles,
    doctorNote,
    isProcessingMerge,
    analysisLoading,
    mergedContent,
  } = useConsultationState();

  const {
    setSelectedPatient,
    setDoctorNote,
    startRecording,
    stopRecording,
    resetTranscript,
    handleRoleChange,
    handleMergeContent,
    handleSubmit,
  } = useConsultationDispatch();
  
  const { patients } = usePatientsState();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 1. 환자 선택 */}
      <PatientSelector
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={setSelectedPatient}
        isClient={isClient}
      />

      {/* 2. 진료 대화 입력 */}
      <ConsultationInput
        sttError={sttError}
        isRecording={isRecording}
        isProcessing={isProcessing}
        utterances={utterances}
        uniqueSpeakers={uniqueSpeakers}
        speakerRoles={speakerRoles}
        doctorNote={doctorNote}
        isProcessingMerge={isProcessingMerge}
        analysisLoading={analysisLoading}
        startRecording={startRecording}
        stopRecording={stopRecording}
        resetTranscript={resetTranscript}
        handleRoleChange={handleRoleChange}
        setDoctorNote={setDoctorNote}
        handleMergeContent={handleMergeContent}
        handleSubmit={handleSubmit}
      />

      {/* 3. 분석 결과 */}
      <AnalysisResult
        mergedContent={mergedContent}
        isProcessingMerge={isProcessingMerge}
      />
    </div>
  );
}
