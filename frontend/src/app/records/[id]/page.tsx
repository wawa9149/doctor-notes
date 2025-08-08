import { Suspense } from "react";
import { getPatient, getPatientRecords } from "@/services/patientService";
import PatientDetail from "@/components/PatientDetail";

// 메타데이터 생성
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(Number(id));
  return {
    title: `${patient.name.text} - 진료 기록`,
    description: `${patient.name.text}님의 진료 기록입니다.`,
  };
}

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patientId = Number(id);

  // 서버에서 데이터 페칭
  const patient = await getPatient(patientId);
  const records = await getPatientRecords(patientId);

  return (
    <Suspense fallback={<div>환자 정보를 불러오는 중...</div>}>
      <PatientDetail patient={patient} records={records} />
    </Suspense>
  );
}
