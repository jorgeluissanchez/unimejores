import { Button } from "@/core/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/core/components/ui/combobox";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { Evaluation } from "@/features/evaluation/domain/entities/evaluation";
import { useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import React, { useMemo, useState } from "react";
import { Alert, Keyboard, View } from "react-native";

type CategoryOption = { _id: string; name: string };

type Props = {
  evaluation: Evaluation;
  categories: CategoryOption[];
  onDone: () => Promise<void>;
};

export function EditEvaluationForm({ evaluation, categories, onDone }: Props) {
  const { updateEvaluation, deleteEvaluation } = useEvaluation();

  const [title, setTitle] = useState(evaluation.title);
  const [description, setDescription] = useState(evaluation.description ?? "");
  const [endDate, setEndDate] = useState((evaluation.end_date ?? "").split("T")[0]);
  const [categoryId, setCategoryId] = useState(evaluation.category_id);
  const [query, setQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filtered = useMemo(
    () =>
      query.trim()
        ? categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
        : categories,
    [categories, query],
  );

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!title.trim()) return;
    try {
      setIsSaving(true);
      await updateEvaluation({
        ...evaluation,
        title: title.trim(),
        description: description.trim(),
        end_date: endDate.trim(),
        category_id: categoryId,
      });
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
      <View className="gap-1.5" style={{ zIndex: 10 }}>
        <Label>Categoría</Label>
        <Combobox
          value={categoryId}
          displayValue={categories.find((c) => c._id === categoryId)?.name ?? ""}
          onValueChange={(v) => { if (v) setCategoryId(v); }}
        >
          <ComboboxInput placeholder="Seleccionar categoría..." filterFn={setQuery} />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty shown={filtered.length === 0} />
              {filtered.map((c) => (
                <ComboboxItem key={c._id} value={c._id} label={c.name} />
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
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
