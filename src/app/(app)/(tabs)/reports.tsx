import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { ReportsScreen } from "@/features/reports/presentation/screens/reports-screen";
import React from "react";
import { SafeAreaView } from "react-native";

export default function ReportsTab() {
  const { loggedUser } = useAuth();

  if (loggedUser?.role !== "professor") {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#9CA3AF" }}>No disponible</Text>
      </SafeAreaView>
    );
  }

  return <ReportsScreen />;
}
