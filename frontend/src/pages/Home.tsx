// src/pages/Home.tsx
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-screen h-screen items-center justify-center gap-10">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">Welcome to Doctor Notes!</h1>
      </div>
      <button
        onClick={() => navigate("/session")}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
      >
        Start Session
      </button>
    </div>
  );
}
