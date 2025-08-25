"use client";

import { type ReactNode } from "react";
import { PatientsProvider } from "@/contexts/PatientsContext";
import { ConsultationProvider } from "@/contexts/ConsultationContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PatientsProvider>
      <ConsultationProvider>{children}</ConsultationProvider>
    </PatientsProvider>
  );
}
