import { Button } from "@/core/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/core/components/ui/combobox";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { StudentEnrollment } from "@/features/courses/domain/entities/course";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { Minus } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";

type Props = { courseId: string };

export function EnrollStudentsForm({ courseId }: Props) {
  const { getStudentsInCourse, getAvailableStudents, addStudentToCourse, removeStudentFromCourse } =
    useCourses();

  const [enrolled, setEnrolled] = useState<StudentEnrollment[]>([]);
  const [available, setAvailable] = useState<StudentEnrollment[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const [e, a] = await Promise.all([
        getStudentsInCourse(courseId),
        getAvailableStudents(courseId),
      ]);
      setEnrolled(e);
      setAvailable(a);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () =>
      query.trim()
        ? available.filter(
            (s) =>
              s.name.toLowerCase().includes(query.toLowerCase()) ||
              s.email.toLowerCase().includes(query.toLowerCase())
          )
        : available,
    [available, query]
  );

  const handleSelect = async (userId: string | undefined) => {
    if (!userId) return;
    try {
      await addStudentToCourse(courseId, userId);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo agregar al estudiante.");
    }
  };

  const handleRemove = async (s: StudentEnrollment) => {
    try {
      setRemovingId(s.userCourseId);
      await removeStudentFromCourse(s.userCourseId);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo remover al estudiante.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* ── Combobox fijo ── */}
      <View className="gap-1.5" style={{ zIndex: 10, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <Label>Agregar estudiante</Label>
        <Combobox value={undefined} onValueChange={handleSelect}>
          <ComboboxInput placeholder="Buscar por nombre o correo..." filterFn={setQuery} />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty shown={filtered.length === 0} />
              {filtered.map((s) => (
                <ComboboxItem key={s.userId} value={s.userId} label={s.name} />
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </View>

      {/* ── Inscritos scrolleable ── */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 6 }}>
        <Text className="text-sm text-primary mb-3">INSCRITOS</Text>
        <View className="h-[1px] bg-primary" />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator color="#818CF8" />
          </View>
        ) : enrolled.length === 0 ? (
          <View className="py-8 items-center">
            <Text variant="muted">No hay estudiantes inscritos</Text>
          </View>
        ) : (
          enrolled.map((s, idx) => (
            <View key={s.userCourseId}>
              <View className="flex-row items-center gap-3 py-2">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{s.name}</Text>
                  <Text variant="muted">{s.email}</Text>
                </View>
                <Button
                  variant="secondary"
                  onPress={() => handleRemove(s)}
                  disabled={removingId === s.userCourseId}
                  className="w-[50px] h-[50px] rounded-full p-6 items-center justify-center"
                >
                  {removingId === s.userCourseId
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Minus size={15} />
                  }
                </Button>
              </View>
              {idx < enrolled.length - 1 && (
                <View className="h-px bg-muted" />
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
