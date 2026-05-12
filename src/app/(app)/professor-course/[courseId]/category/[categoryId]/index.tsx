import { ProfessorProvider } from "@/features/professor/presentation/context/professor-context";
import { ProfessorCategoryGroupsScreen } from "@/features/professor/presentation/screens/professor-category-groups-screen";
import React from "react";

export default function ProfessorCategoryDetailPage() {
  return (
    <ProfessorProvider>
      <ProfessorCategoryGroupsScreen />
    </ProfessorProvider>
  );
}
