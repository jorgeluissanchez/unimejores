import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import {
  Category,
  Course,
  Criterium,
  Group,
  ProfessorEvaluation,
  ResultEvaluation,
  StudentEnrollment,
} from "@/features/professor/domain/entities/professor";
import { ProfessorRepository } from "@/features/professor/domain/repositories/professor-repository";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import XLSX from "xlsx";

const PRIMARY = "#818CF8";

type CategoryWithEval = {
  category: Category;
  evaluation: ProfessorEvaluation | null;
};

export function ProfessorReportsScreen() {
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<ProfessorRepository>(TOKENS.ProfessorRepo), [di]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<CategoryWithEval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!loggedUser) return;
    try {
      setIsLoading(true);
      const data = await repo.getMyCourses(loggedUser.userId);
      setCourses(data);
      if (data.length > 0) setSelectedCourse(data[0]);
    } catch (e: any) {
      if (e?.message?.includes("401")) { await expireSession(); return; }
    } finally {
      setIsLoading(false);
    }
  }, [loggedUser]);

  const loadCategories = useCallback(async (courseId: string) => {
    try {
      setIsLoading(true);
      const cats = await repo.getCategoriesByCourse(courseId);
      const withEvals = await Promise.all(
        cats.map(async (cat) => {
          const ev = await repo.getEvaluationByCategory(cat._id);
          return { category: cat, evaluation: ev };
        }),
      );
      setCategories(withEvals);
    } catch {
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [repo]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (selectedCourse) loadCategories(selectedCourse._id);
  }, [selectedCourse]);

  const exportExcel = async (item: CategoryWithEval) => {
    if (!item.evaluation) {
      Alert.alert("Sin evaluación", "Esta categoría no tiene evaluación configurada.");
      return;
    }
    setLoadingCategory(item.category._id);
    try {
      const [criteria, groups] = await Promise.all([
        repo.getCriteriaForEvaluation(item.evaluation._id),
        repo.getGroupsByCategory(item.category._id),
      ]);

      // Collect all members and results per group
      const allMembers: StudentEnrollment[] = [];
      const allResults: ResultEvaluation[] = [];

      await Promise.all(
        groups.map(async (group: Group) => {
          const [members, results] = await Promise.all([
            repo.getMembersByGroup(group._id),
            repo.getResultsByGroup(group._id),
          ]);
          allMembers.push(...members);
          allResults.push(...results);
        }),
      );

      // Deduplicate members by userId
      const uniqueMembers = Array.from(new Map(allMembers.map((m) => [m.userId, m])).values());

      // Avg score per student per criterium
      const scoreMap: Record<string, Record<string, number[]>> = {};
      for (const r of allResults) {
        if (!scoreMap[r.evaluated_id]) scoreMap[r.evaluated_id] = {};
        if (!scoreMap[r.evaluated_id][r.criterium_id]) scoreMap[r.evaluated_id][r.criterium_id] = [];
        scoreMap[r.evaluated_id][r.criterium_id].push(Number(r.score));
      }

      const avg = (nums: number[]) => nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

      const headers = ["Nombre", "Correo", ...criteria.map((c: Criterium) => c.name), "Promedio General"];
      const rows = uniqueMembers.map((m) => {
        const scores = criteria.map((c: Criterium) => {
          const vals = scoreMap[m.userId]?.[c._id] ?? [];
          return avg(vals);
        });
        const overall = scores.length ? avg(scores) : 0;
        return [m.name, m.email, ...scores.map((s) => s.toFixed(2)), overall.toFixed(2)];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, item.category.name.slice(0, 31));

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const fileName = `${item.category.name.replace(/\s+/g, "_")}_reporte.xlsx`;
      const uri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", dialogTitle: `Reporte: ${item.category.name}` });
      } else {
        Alert.alert("Exportado", `Archivo guardado en ${uri}`);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo exportar el reporte.");
    } finally {
      setLoadingCategory(null);
    }
  };

  if (isLoading && courses.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 4 }}>
          Analiza las actividades
        </Text>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 24 }}>
          de tus cursos
        </Text>

        {/* Course tabs */}
        {courses.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", gap: 24 }}>
              {courses.map((course) => {
                const active = selectedCourse?._id === course._id;
                return (
                  <TouchableOpacity key={course._id} onPress={() => setSelectedCourse(course)}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        letterSpacing: 0.5,
                        color: active ? PRIMARY : "#9CA3AF",
                        paddingBottom: 8,
                        borderBottomWidth: active ? 2 : 0,
                        borderBottomColor: PRIMARY,
                      }}
                    >
                      {course.name.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        <View style={{ height: 1, backgroundColor: "#E5E7EB", marginBottom: 16 }} />

        {/* Categories list */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : categories.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#9CA3AF" }}>Sin categorías en este curso</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.category._id}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 18 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16, color: "#111827" }}>{item.category.name}</Text>
                    {item.evaluation ? (
                      <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{item.evaluation.title}</Text>
                    ) : (
                      <Text style={{ fontSize: 13, color: "#D1D5DB", marginTop: 2 }}>Sin evaluación</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => exportExcel(item)}
                    disabled={loadingCategory === item.category._id}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: item.evaluation ? PRIMARY : "#E5E7EB",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {loadingCategory === item.category._id ? (
                      <ActivityIndicator size="small" color={PRIMARY} />
                    ) : (
                      <Text style={{ color: item.evaluation ? PRIMARY : "#D1D5DB", fontSize: 16, fontWeight: "700" }}>↓</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
