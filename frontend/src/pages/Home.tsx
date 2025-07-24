// src/pages/Home.tsx
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={() => navigate('/session')}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
      >
        진료 시작하기
      </button>
    </div>
  );
}
