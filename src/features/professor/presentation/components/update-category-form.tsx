import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { Category } from "@/features/professor/domain/entities/professor";
import React, { useEffect, useState } from "react";
import { Keyboard, View } from "react-native";
import { useProfessor } from "../context/professor-context";

type Props = { category: Category; onCancel: () => void };
type Errors = { name?: string };

export function UpdateCategoryForm({ category, onCancel }: Props) {
  const { updateCategory } = useProfessor();

  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    setName(category.name);
    setDescription(category.description);
  }, [category._id]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    await updateCategory({ ...category, name: name.trim(), description: description.trim() });
    onCancel();
  };

  return (
    <View className="mt-4 gap-4">
      <View className="gap-1.5">
        <Label>Nombre</Label>
        <Input
          value={name}
          onChangeText={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
          className={errors.name ? "border-destructive" : undefined}
        />
        {!!errors.name && <Text className="text-sm text-destructive">{errors.name}</Text>}
      </View>
      <View className="gap-1.5">
        <Label>Descripción</Label>
        <Textarea value={description} onChangeText={setDescription} />
      </View>
      <View className="flex-row justify-end gap-2">
        <Button variant="outline" onPress={onCancel}><Text>Cancelar</Text></Button>
        <Button onPress={handleSubmit}><Text>Actualizar</Text></Button>
      </View>
    </View>
  );
}
