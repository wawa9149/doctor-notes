// src/pages/Session.tsx
import { useState } from 'react';
import { analyzeDialogue } from '../services/apiClient';
import AnalysisCard from '../components/AnalysisCard';

export default function Session() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    const response = await analyzeDialogue(inputText);
    setResult(response);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">진료 대화 입력</h1>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="의사와 환자의 대화를 여기에 입력하세요..."
        className="w-full h-40 p-4 border rounded resize-none"
      />

      <button
        onClick={handleAnalyze}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? '분석 중...' : '분석하기'}
      </button>

      {result && <AnalysisCard data={result} />}
    </div>
  );
}
