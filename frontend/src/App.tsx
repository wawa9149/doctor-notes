// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Session from "./pages/Session";
import Analysis from "./pages/Analysis";
import Records from "./pages/Records";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session" element={<Session />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/records/:patientId" element={<Records />} />
      </Routes>
    </Router>
  );
}
