"use client";

interface MergedContent {
  conversation: string;
  doctorNote: string;
  summary: string[];
}

interface AnalysisResultProps {
  mergedContent: MergedContent | null;
  isProcessingMerge: boolean;
}

export default function AnalysisResult({
  mergedContent,
  isProcessingMerge,
}: AnalysisResultProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-fit border-l-4 border-teal-500 transition-all hover:shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-teal-500">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </span>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
            분석 결과
          </h2>
        </div>
        {isProcessingMerge && (
          <div className="flex items-center space-x-2 text-teal-600 bg-teal-50 px-4 py-2 rounded-full">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>분석 중...</span>
          </div>
        )}
      </div>
      {mergedContent ? (
        <div className="space-y-8">
          <div className="rounded-xl p-6 border border-cyan-100">
            <div className="flex items-center space-x-3 mb-4">
              <svg className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3 className="font-semibold text-cyan-900">음성 인식 결과</h3>
            </div>
            <div className="bg-white/50 p-4 rounded-lg whitespace-pre-line border border-cyan-100">
              {mergedContent.conversation}
            </div>
          </div>
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
            <div className="flex items-center space-x-3 mb-4">
              <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h3 className="font-semibold text-teal-900">의사 메모</h3>
            </div>
            <div className="bg-white/50 p-4 rounded-lg whitespace-pre-line border border-teal-100">
              {mergedContent.doctorNote}
            </div>
          </div>
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-6 border border-cyan-100">
            <div className="flex items-center space-x-3 mb-4">
              <svg className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="font-semibold text-cyan-900">요약</h3>
            </div>
            <div className="bg-white/50 p-4 rounded-lg border border-cyan-100">
              <ul className="space-y-2">
                {mergedContent.summary.map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[400px] flex flex-col items-center justify-center text-gray-500 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
          <svg
            className="h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-center">
            음성 인식 결과와 의사 메모를 입력한 후
            <br />
            합치기 버튼을 클릭하면 분석 결과가 표시됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
