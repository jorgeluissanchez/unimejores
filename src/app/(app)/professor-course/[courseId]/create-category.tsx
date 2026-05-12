import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { ProfessorRepository } from "@/features/professor/domain/repositories/professor-repository";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, SafeAreaView, TextInput, TouchableOpacity, View } from "react-native";

const PRIMARY = "#818CF8";

export default function CreateCategoryPage() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const di = useDI();
  const { expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<ProfessorRepository>(TOKENS.ProfessorRepo), [di]);

  const [nombre, setNombre] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!nombre.trim()) { Alert.alert("Campo requerido", "El nombre es obligatorio."); return; }
    try {
      setIsSaving(true);
      await repo.addCategory({ name: nombre.trim(), description: "", course_id: courseId! });
      router.back();
    } catch (e: any) {
      if (e?.message?.includes("401")) { await expireSession(); return; }
      Alert.alert("Error", e.message ?? "No se pudo crear la categoría.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 32 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", marginRight: 16 }}
          >
            <Ionicons name="arrow-back" size={18} color="#374151" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", letterSpacing: 1, color: "#111827" }}>CREAR CATEGORIA</Text>
        </View>

        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre"
          placeholderTextColor="#9CA3AF"
          autoFocus
          style={{ backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#111827", marginBottom: 20 }}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{ backgroundColor: PRIMARY, borderRadius: 30, paddingVertical: 16, alignItems: "center" }}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : (
            <Text style={{ color: "#fff", fontWeight: "700", letterSpacing: 1 }}>GUARDAR</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
