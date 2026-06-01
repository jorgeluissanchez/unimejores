import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Course } from "@/features/courses/domain/entities/course";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import React, { useState } from "react";
import { Alert, Keyboard, View } from "react-native";

type Props = { onCreated?: (course: Course) => void; onCancel: () => void };
type Errors = { name?: string; nrc?: string };

export function AddCourseForm({ onCreated, onCancel }: Props) {
  const { addCourse } = useCourses();
  const { loggedUser } = useAuth();

  const [name, setName] = useState("");
  const [nrc, setNrc] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): boolean => {
    const e: Errors = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    if (!nrc.trim()) e.nrc = "El NRC es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate() || !loggedUser) return;
    try {
      const created = await addCourse({ name: name.trim(), nrc: nrc.trim(), description: description.trim(), created_by: loggedUser.userId });
      onCreated?.(created);
      onCancel();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo crear el curso.");
    }
  };

  return (
    <View className="mt-4 gap-4">
      <View className="gap-1.5">
        <Label>Nombre</Label>
        <Input value={name} onChangeText={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }} placeholder="Ej: Cálculo I" className={errors.name ? "border-destructive" : undefined} />
        {!!errors.name && <Text className="text-sm text-destructive">{errors.name}</Text>}
      </View>
      <View className="gap-1.5">
        <Label>NRC</Label>
        <Input value={nrc} onChangeText={(v) => { setNrc(v); if (errors.nrc) setErrors((e) => ({ ...e, nrc: undefined })); }} placeholder="Ej: 12345" className={errors.nrc ? "border-destructive" : undefined} />
        {!!errors.nrc && <Text className="text-sm text-destructive">{errors.nrc}</Text>}
      </View>
      <View className="gap-1.5">
        <Label>Descripción</Label>
        <Textarea value={description} onChangeText={setDescription} placeholder="Descripción del curso" />
      </View>
      <Button onPress={handleSubmit} className="rounded-full w-full" style={{ paddingVertical: 18 }}>
        <Text>GUARDAR</Text>
      </Button>
    </View>
  );
}
