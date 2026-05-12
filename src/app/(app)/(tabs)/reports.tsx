import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { ProfessorProvider } from "@/features/professor/presentation/context/professor-context";
import { ProfessorReportsScreen } from "@/features/professor/presentation/screens/professor-reports-screen";
import React from "react";
import { SafeAreaView, View } from "react-native";
import { Text } from "@/core/components/ui/text";

export default function ReportsTab() {
  const { loggedUser } = useAuth();

  if (loggedUser?.role !== "professor") {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#9CA3AF" }}>No disponible</Text>
      </SafeAreaView>
    );
  }

  return (
    <ProfessorProvider>
      <ProfessorReportsScreen />
    </ProfessorProvider>
  );
}
