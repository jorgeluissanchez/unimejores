import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { Category } from "@/features/courses/domain/entities/course";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import React, { useState } from "react";
import { Keyboard, View } from "react-native";

type Props = { courseId: string; onCreated: (cat: Category) => void; onCancel: () => void };
type Errors = { name?: string };

export function AddCategoryForm({ courseId, onCreated, onCancel }: Props) {
  const { addCategory } = useCourses();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): boolean => {
    const e: Errors = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    const created = await addCategory({ name: name.trim(), description: description.trim(), course_id: courseId });
    setName("");
    setDescription("");
    setErrors({});
    onCreated(created);
    onCancel();
  };

  return (
    <View className="mt-4 gap-4">
      <View className="gap-1.5">
        <Label>Nombre</Label>
        <Input
          value={name}
          onChangeText={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
          placeholder="Ej: Unidad 1"
          className={errors.name ? "border-destructive" : undefined}
        />
        {!!errors.name && <Text className="text-sm text-destructive">{errors.name}</Text>}
      </View>
      <View className="gap-1.5">
        <Label>Descripción</Label>
        <Textarea value={description} onChangeText={setDescription} placeholder="Descripción (opcional)" />
      </View>
      <Button onPress={handleSubmit} className="rounded-full w-full" style={{ paddingVertical: 18 }}>
        <Text>GUARDAR</Text>
      </Button>
    </View>
  );
}
