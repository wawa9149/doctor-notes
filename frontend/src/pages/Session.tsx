// src/pages/Session.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeDialogue } from "../services/apiClient";

export default function Session() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const response = await analyzeDialogue(inputText);
      navigate("/analysis", {
        state: {
          analysisData: response,
          conversationText: inputText,
        },
      });
    } catch (error) {
      console.error("분석 중 오류 발생:", error);
      alert("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">진료 대화 입력</h2>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="의사와 환자의 대화를 여기에 입력하세요..."
        className="w-1/2 h-[400px] p-4 border border-gray-300 rounded-md resize-none bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-4"
      />

      <button
        onClick={handleAnalyze}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mt-4"
        disabled={loading}
      >
        {loading ? "분석 중..." : "분석하기"}
      </button>
    </div>
  );
}
