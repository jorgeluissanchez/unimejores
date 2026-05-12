import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Category } from "@/features/professor/domain/entities/professor";
import { ProfessorRepository } from "@/features/professor/domain/repositories/professor-repository";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#818CF8";

export function ProfessorCreateEvaluationScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const di = useDI();
  const { expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<ProfessorRepository>(TOKENS.ProfessorRepo), [di]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [nombre, setNombre] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [visibilidad, setVisibilidad] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    repo.getCategoriesByCourse(courseId).then(setCategories).catch(() => {});
  }, [courseId]);

  const selectedCat = categories.find((c) => c._id === selectedCategoryId);

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!nombre.trim()) { Alert.alert("Campo requerido", "El nombre es obligatorio."); return; }
    if (!selectedCategoryId) { Alert.alert("Campo requerido", "Selecciona una categoría."); return; }
    try {
      setIsSaving(true);
      await repo.createEvaluation({
        title: nombre.trim(),
        description: descripcion.trim(),
        start_date: new Date().toISOString().split("T")[0],
        end_date: fechaFin.trim() || "",
        category_id: selectedCategoryId,
      });
      router.back();
    } catch (e: any) {
      if (e?.message?.includes("401")) { await expireSession(); return; }
      Alert.alert("Error", e.message ?? "No se pudo crear la evaluación.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 32 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", marginRight: 16 }}
          >
            <Ionicons name="arrow-back" size={18} color="#374151" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", letterSpacing: 1, color: "#111827" }}>CREAR EVALUACION</Text>
        </View>

        {/* Fields */}
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre"
          placeholderTextColor="#9CA3AF"
          style={fieldStyle}
        />

        <TouchableOpacity onPress={() => setShowCatPicker(!showCatPicker)} style={[fieldStyle, { justifyContent: "center" }]}>
          <Text style={{ color: selectedCat ? "#111827" : "#9CA3AF", fontSize: 15 }}>
            {selectedCat ? selectedCat.name : "Categoria"}
          </Text>
        </TouchableOpacity>

        {showCatPicker && (
          <View style={{ backgroundColor: "#F9FAFB", borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" }}>
            {categories.length === 0 ? (
              <Text style={{ padding: 16, color: "#9CA3AF", textAlign: "center" }}>Sin categorías. Crea una primero.</Text>
            ) : (
              categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  onPress={() => { setSelectedCategoryId(cat._id); setShowCatPicker(false); }}
                  style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}
                >
                  <Text style={{ color: "#111827", fontSize: 15 }}>{cat.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <TextInput
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Descripcion"
          placeholderTextColor="#9CA3AF"
          multiline
          style={[fieldStyle, { minHeight: 80, textAlignVertical: "top" }]}
        />

        <TextInput
          value={fechaFin}
          onChangeText={setFechaFin}
          placeholder="Fecha de Finalizacion (YYYY-MM-DD)"
          placeholderTextColor="#9CA3AF"
          style={fieldStyle}
        />

        <TextInput
          value={visibilidad}
          onChangeText={setVisibilidad}
          placeholder="Visibilidad"
          placeholderTextColor="#9CA3AF"
          style={fieldStyle}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{ backgroundColor: PRIMARY, borderRadius: 30, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : (
            <Text style={{ color: "#fff", fontWeight: "700", letterSpacing: 1 }}>GUARDAR</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const fieldStyle = {
  backgroundColor: "#F3F4F6",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 15,
  color: "#111827",
  marginBottom: 12,
} as const;
