import { ProfessorProvider } from "@/features/professor/presentation/context/professor-context";
import { ProfessorCriteriaScreen } from "@/features/professor/presentation/screens/professor-criteria-screen";
import React from "react";

export default function CriteriosPage() {
  return (
    <ProfessorProvider>
      <ProfessorCriteriaScreen />
    </ProfessorProvider>
  );
}
