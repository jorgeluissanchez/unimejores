import { ProfessorProvider } from "@/features/professor/presentation/context/professor-context";
import { ProfessorCreateEvaluationScreen } from "@/features/professor/presentation/screens/professor-create-evaluation-screen";
import React from "react";

export default function CreateEvaluationPage() {
  return (
    <ProfessorProvider>
      <ProfessorCreateEvaluationScreen />
    </ProfessorProvider>
  );
}
