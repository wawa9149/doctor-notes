// src/components/AnalysisCard.tsx
type Props = {
    data: any;
  };
  
  export default function AnalysisCard({ data }: Props) {
    return (
      <div className="p-4 border rounded shadow bg-white space-y-4">
        <h2 className="text-lg font-semibold">분석 결과</h2>
  
        {data.condition && (
          <div>
            <h3 className="font-bold">진단</h3>
            <p>{data.condition.code?.text}</p>
          </div>
        )}
  
        {data.observations?.length > 0 && (
          <div>
            <h3 className="font-bold">증상</h3>
            <ul className="list-disc list-inside">
              {data.observations.map((obs: any, idx: number) => (
                <li key={idx}>
                  {obs.code?.text}: {obs.valueString}
                </li>
              ))}
            </ul>
          </div>
        )}
  
        {data.medicationStatements?.length > 0 && (
          <div>
            <h3 className="font-bold">약물</h3>
            <ul className="list-disc list-inside">
              {data.medicationStatements.map((med: any, idx: number) => (
                <li key={idx}>{med.medicationCodeableConcept?.text}</li>
              ))}
            </ul>
          </div>
        )}
  
        {data.clinicalImpression?.description && (
          <div>
            <h3 className="font-bold">의사 소견</h3>
            <p>{data.clinicalImpression.description}</p>
          </div>
        )}
      </div>
    );
  }
  