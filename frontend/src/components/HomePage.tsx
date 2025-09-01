"use client";

import { useState, useEffect } from "react";
import NewConsultationView from "./NewConsultationView";
import PatientRecordsView from "./PatientRecordsView";
import Header from "./Header";
// import { useConsultationState } from "@/contexts/ConsultationContext";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"new" | "records">("new");
  // const { analysisError } = useConsultationState();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="w-screen min-h-screen">
      <Header 
        showNavigation={true} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <div className="max-w-7xl mx-auto p-8">
        {activeTab === "new" ? (
          <NewConsultationView isClient={isClient} />
        ) : (
          <PatientRecordsView />
        )}
      </div>
    </div>
  );
}