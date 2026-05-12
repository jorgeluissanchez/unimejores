import { ProfessorProvider } from "@/features/professor/presentation/context/professor-context";
import { ProfessorCourseDetailScreen } from "@/features/professor/presentation/screens/professor-course-detail-screen";
import React from "react";

export default function ProfessorCourseDetailPage() {
  return (
    <ProfessorProvider>
      <ProfessorCourseDetailScreen />
    </ProfessorProvider>
  );
}
