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
import { Category } from "@/features/professor/domain/entities/professor";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Keyboard, View } from "react-native";
import { useProfessor } from "../context/professor-context";

type Props = { courseId: string; onCancel: () => void };
type Errors = { title?: string; category?: string };

export function CreateEvaluationForm({ courseId, onCancel }: Props) {
  const { getCategoriesByCourse, createEvaluation } = useProfessor();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getCategoriesByCourse(courseId).then(setCategories).catch(() => {});
  }, [courseId]);

  const filtered = useMemo(
    () =>
      query.trim()
        ? categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
        : categories,
    [categories, query]
  );

  const validate = (): boolean => {
    const e: Errors = {};
    if (!title.trim()) e.title = "El título es obligatorio";
    if (!categoryId) e.category = "Selecciona una categoría";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    try {
      setIsSaving(true);
      await createEvaluation({
        title: title.trim(),
        description: description.trim(),
        start_date: new Date().toISOString().split("T")[0],
        end_date: endDate.trim(),
        category_id: categoryId!,
      });
      onCancel();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo crear la evaluación.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="gap-4">
      <View className="gap-1.5">
        <Label>Título</Label>
        <Input
          value={title}
          onChangeText={(v) => { setTitle(v); if (errors.title) setErrors((e) => ({ ...e, title: undefined })); }}
          placeholder="Ej: Sprint Review"
          className={errors.title ? "border-destructive" : undefined}
        />
        {!!errors.title && <Text className="text-sm text-destructive">{errors.title}</Text>}
      </View>

      <View className="gap-1.5" style={{ zIndex: 10 }}>
        <Label>Categoría</Label>
        <Combobox
          value={categoryId}
          onValueChange={(v) => {
            setCategoryId(v);
            if (v && errors.category) setErrors((e) => ({ ...e, category: undefined }));
          }}
          hasError={!!errors.category}
        >
          <ComboboxInput
            placeholder="Buscar categoría..."
            filterFn={setQuery}
          />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty shown={filtered.length === 0} />
              {filtered.map((cat) => (
                <ComboboxItem key={cat._id} value={cat._id} label={cat.name} />
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {!!errors.category && <Text className="text-sm text-destructive">{errors.category}</Text>}
      </View>

      <View className="gap-1.5">
        <Label>Descripción</Label>
        <Textarea value={description} onChangeText={setDescription} placeholder="Descripción (opcional)" />
      </View>

      <View className="gap-1.5">
        <Label>Fecha de finalización</Label>
        <Input value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
      </View>

      <Button onPress={handleSubmit} disabled={isSaving} className="rounded-full w-full" style={{ paddingVertical: 18 }}>
        <Text>{isSaving ? "GUARDANDO..." : "GUARDAR"}</Text>
      </Button>
    </View>
  );
}
