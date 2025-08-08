"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("루트 레벨 에러 발생:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              심각한 오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-4">
              애플리케이션에서 예상치 못한 오류가 발생했습니다.
            </p>
            <div className="space-y-2">
              <button
                onClick={reset}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                다시 시도
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
