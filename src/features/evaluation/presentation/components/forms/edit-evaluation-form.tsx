import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { Evaluation } from "@/features/evaluation/domain/entities/evaluation";
import { useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import React, { useState } from "react";
import { Alert, Keyboard, View } from "react-native";

type Props = {
  evaluation: Evaluation;
  categoryName: string;
  onDone: () => Promise<void>;
};

export function EditEvaluationForm({ evaluation, categoryName, onDone }: Props) {
  const { updateEvaluation, deleteEvaluation } = useEvaluation();

  const [title, setTitle] = useState(evaluation.title);
  const [description, setDescription] = useState(evaluation.description ?? "");
  const [endDate, setEndDate] = useState((evaluation.end_date ?? "").split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!title.trim()) return;
    try {
      setIsSaving(true);
      await updateEvaluation({ ...evaluation, title: title.trim(), description: description.trim(), end_date: endDate.trim() });
      await onDone();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteEvaluation(evaluation._id);
      await onDone();
    } catch (e: any) {
      setConfirmDelete(false);
      Alert.alert("Error", e.message ?? "No se pudo eliminar la evaluación.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View className="gap-4">
      <View style={{ backgroundColor: "#F3F4F6", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
        <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" }}>Categoría</Text>
        <Text style={{ fontSize: 14, color: "#374151", fontWeight: "600", marginTop: 2 }}>{categoryName}</Text>
      </View>
      <View className="gap-1.5">
        <Label>Título</Label>
        <Input value={title} onChangeText={setTitle} placeholder="Título de la evaluación" />
      </View>
      <View className="gap-1.5">
        <Label>Descripción</Label>
        <Textarea value={description} onChangeText={setDescription} placeholder="Descripción (opcional)" />
      </View>
      <View className="gap-1.5">
        <Label>Fecha de finalización (YYYY-MM-DD)</Label>
        <Input value={endDate} onChangeText={setEndDate} placeholder="2025-12-31" />
      </View>
      <Button onPress={handleSave} disabled={isSaving || confirmDelete} className="rounded-full w-full" style={{ paddingVertical: 18 }}>
        <Text>{isSaving ? "GUARDANDO..." : "GUARDAR"}</Text>
      </Button>
      {confirmDelete ? (
        <View className="gap-2">
          <Text className="text-center text-sm text-destructive font-semibold">¿Eliminar "{evaluation.title}"?</Text>
          <View className="flex-row gap-2">
            <Button variant="secondary" onPress={() => setConfirmDelete(false)} className="flex-1 rounded-full" style={{ paddingVertical: 14 }} disabled={isDeleting}>
              <Text>Cancelar</Text>
            </Button>
            <Button variant="destructive" onPress={handleDelete} className="flex-1 rounded-full" style={{ paddingVertical: 14 }} disabled={isDeleting}>
              <Text>{isDeleting ? "..." : "Eliminar"}</Text>
            </Button>
          </View>
        </View>
      ) : (
        <Button variant="destructive" onPress={() => setConfirmDelete(true)} className="rounded-full w-full" style={{ paddingVertical: 18 }}>
          <Text>ELIMINAR EVALUACIÓN</Text>
        </Button>
      )}
    </View>
  );
}
