import { Suspense } from "react";
import HomePage from "@/components/HomePage";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>로딩 중...</div>}>
        <HomePage />
      </Suspense>
    </ErrorBoundary>
  );
}
