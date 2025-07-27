import type { AnalyzeResponse } from "../services/apiClient";

type Props = {
  data: AnalyzeResponse;
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
      {title}
    </h3>
    <div className="space-y-2 text-gray-700">{children}</div>
  </div>
);

const DataPoint: React.FC<{ label: string; value?: React.ReactNode }> = ({
  label,
  value,
}) =>
  value ? (
    <p>
      <strong>{label}:</strong> {value}
    </p>
  ) : null;

export default function AnalysisCard({ data }: Props) {
  const { Patient, Encounter, Condition, Observation, MedicationStatement } =
    data;

  return (
    <div className="p-6 border rounded-lg shadow-lg bg-white">
      <h2 className="text-xl font-bold mb-6 text-center text-gray-900">
        분석 결과 요약
      </h2>

      {Patient && (
        <Section title="환자 정보">
          <DataPoint label="이름" value={Patient.name?.text} />
          <DataPoint label="생년월일" value={Patient.birth_date} />
          <DataPoint label="성별" value={Patient.gender} />
        </Section>
      )}

      {Encounter && (
        <Section title="진료 정보">
          <DataPoint label="방문 이유" value={Encounter.reason_text} />
          <DataPoint label="진료 상태" value={Encounter.status} />
          <DataPoint
            label="진료 유형"
            value={`${Encounter.type} (${Encounter.class})`}
          />
          <DataPoint
            label="진료 시작"
            value={
              Encounter.period?.start
                ? new Date(Encounter.period.start).toLocaleString()
                : undefined
            }
          />
        </Section>
      )}

      {Condition && (
        <Section title="진단">
          <DataPoint label="진단명" value={Condition.code?.text} />
          <DataPoint label="임상 상태" value={Condition.clinical_status} />
          <DataPoint label="확인 상태" value={Condition.verification_status} />
          <DataPoint
            label="증상 시작일"
            value={
              Condition.onset_datetime
                ? new Date(Condition.onset_datetime).toLocaleString()
                : undefined
            }
          />
          <DataPoint label="심각도" value={Condition.severity} />
        </Section>
      )}

      {Observation && Observation.length > 0 && (
        <Section title="주요 관찰">
          <ul className="list-disc list-inside space-y-2">
            {Observation.map((obs, idx) => (
              <li key={idx}>
                <strong>{obs.code?.text}:</strong> {obs.value_string}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {MedicationStatement && MedicationStatement.length > 0 && (
        <Section title="처방/복용 중인 약물">
          <ul className="list-disc list-inside space-y-2">
            {MedicationStatement.map((med, idx) => (
              <li key={idx}>
                <strong>{med.medication?.text}:</strong> {med.dosage?.text} (
                {med.status})
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
