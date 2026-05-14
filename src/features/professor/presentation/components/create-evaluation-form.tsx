import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { Category } from "@/features/professor/domain/entities/professor";
import React, { useEffect, useState } from "react";
import { Alert, Keyboard, View } from "react-native";
import { useProfessor } from "../context/professor-context";

type Props = { courseId: string; onCancel: () => void };
type Errors = { title?: string; category?: string };

export function CreateEvaluationForm({ courseId, onCancel }: Props) {
  const { getCategoriesByCourse, createEvaluation } = useProfessor();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<{ value: string; label: string } | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getCategoriesByCourse(courseId).then(setCategories).catch(() => {});
  }, [courseId]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!title.trim()) e.title = "El título es obligatorio";
    if (!selectedCategory?.value) e.category = "Selecciona una categoría";
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
        category_id: selectedCategory!.value,
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

      <View className="gap-1.5">
        <Label>Categoría</Label>
        <Select
          value={selectedCategory}
          onValueChange={(v) => {
            setSelectedCategory(v as any);
            if (errors.category) setErrors((e) => ({ ...e, category: undefined }));
          }}
        >
          <SelectTrigger className={errors.category ? "border border-destructive" : undefined}>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id} label={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
