import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { ProfessorProvider } from "@/features/professor/presentation/context/professor-context";
import { ProfessorHomeScreen } from "@/features/professor/presentation/screens/professor-home-screen";
import CoursesScreen from "@/features/courses/presentation/screens/courses-screen";
import React from "react";

export default function HomeTab() {
  const { loggedUser } = useAuth();

  if (loggedUser?.role === "professor") {
    return (
      <ProfessorProvider>
        <ProfessorHomeScreen />
      </ProfessorProvider>
    );
  }

  return <CoursesScreen />;
}
