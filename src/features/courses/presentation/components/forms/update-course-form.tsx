import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { Course } from "@/features/courses/domain/entities/course";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, View } from "react-native";

type Props = { course: Course; onCancel: () => void; onDeleted?: () => void };
type Errors = { name?: string; nrc?: string };

export function UpdateCourseForm({ course, onCancel, onDeleted }: Props) {
  const { updateCourse, deleteCourse } = useCourses();

  const [name, setName] = useState(course.name);
  const [nrc, setNrc] = useState(course.nrc);
  const [description, setDescription] = useState(course.description);
  const [errors, setErrors] = useState<Errors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    try {
      setIsSaving(true);
      await updateCourse({ ...course, name: name.trim(), nrc: nrc.trim(), description: description.trim() });
      onCancel();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCourse(course._id);
      onDeleted?.();
    } catch (e: any) {
      setConfirmDelete(false);
      Alert.alert("Error", e.message ?? "No se pudo eliminar el curso.");
    } finally {
      setIsDeleting(false);
    }
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

      <Button onPress={handleSubmit} disabled={isSaving || isDeleting} className="rounded-full w-full" style={{ paddingVertical: 18 }}>
        {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text>GUARDAR</Text>}
      </Button>

      {onDeleted && (
        confirmDelete ? (
          <View style={{ gap: 8 }}>
            <Text style={{ textAlign: "center", fontSize: 13, color: "#EF4444", fontWeight: "600" }}>
              ¿Eliminar "{course.name}"? Esta acción no se puede deshacer.
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button variant="secondary" onPress={() => setConfirmDelete(false)} disabled={isDeleting} className="flex-1 rounded-full" style={{ paddingVertical: 14 }}>
                <Text>Cancelar</Text>
              </Button>
              <Button variant="destructive" onPress={handleDelete} disabled={isDeleting} className="flex-1 rounded-full" style={{ paddingVertical: 14 }}>
                {isDeleting ? <ActivityIndicator size="small" color="#fff" /> : <Text>Eliminar</Text>}
              </Button>
            </View>
          </View>
        ) : (
          <Button variant="destructive" onPress={() => setConfirmDelete(true)} disabled={isSaving} className="rounded-full w-full" style={{ paddingVertical: 18 }}>
            <Text>ELIMINAR CURSO</Text>
          </Button>
        )
      )}
    </View>
  );
}
