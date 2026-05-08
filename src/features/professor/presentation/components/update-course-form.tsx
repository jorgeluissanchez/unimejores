import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { Course } from "@/features/professor/domain/entities/professor";
import React, { useEffect, useState } from "react";
import { Keyboard, View } from "react-native";
import { useProfessor } from "../context/professor-context";

type Props = { course: Course; onCancel: () => void };
type Errors = { name?: string; nrc?: string };

export function UpdateCourseForm({ course, onCancel }: Props) {
  const { updateCourse } = useProfessor();

  const [name, setName] = useState(course.name);
  const [nrc, setNrc] = useState(course.nrc);
  const [description, setDescription] = useState(course.description);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    setName(course.name);
    setNrc(course.nrc);
    setDescription(course.description);
  }, [course._id]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    if (!nrc.trim()) e.nrc = "El NRC es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    await updateCourse({ ...course, name: name.trim(), nrc: nrc.trim(), description: description.trim() });
    onCancel();
  };

  return (
    <View className="mt-4 gap-4">
      <View className="gap-1.5">
        <Label>Nombre</Label>
        <Input value={name} onChangeText={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }} className={errors.name ? "border-destructive" : undefined} />
        {!!errors.name && <Text className="text-sm text-destructive">{errors.name}</Text>}
      </View>
      <View className="gap-1.5">
        <Label>NRC</Label>
        <Input value={nrc} onChangeText={(v) => { setNrc(v); if (errors.nrc) setErrors((e) => ({ ...e, nrc: undefined })); }} className={errors.nrc ? "border-destructive" : undefined} />
        {!!errors.nrc && <Text className="text-sm text-destructive">{errors.nrc}</Text>}
      </View>
      <View className="gap-1.5">
        <Label>Descripción</Label>
        <Textarea value={description} onChangeText={setDescription} />
      </View>
      <View className="flex-row items-center justify-end gap-2">
        <Button variant="outline" onPress={onCancel}><Text>Cancelar</Text></Button>
        <Button onPress={handleSubmit}><Text>Actualizar</Text></Button>
      </View>
    </View>
  );
}
