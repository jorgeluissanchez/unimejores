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
  useWindowDimensions,
  View,
} from "react-native";
import { G, Line, Rect, Svg, Text as SvgText } from "react-native-svg";
import { useProfessor } from "../context/professor-context";

const PRIMARY = "#818CF8";
const COLORS = ["#C7D2FE", "#818CF8", "#4F46E5", "#312E81"];

type CategoryWithEval = { category: Category; evaluation: ProfessorEvaluation | null; groupCount: number };
type CriteriumAvg = { criterium: Criterium; avg: number };
type CourseScores = { course: Course; criteriaAvgs: CriteriumAvg[] };

export function ProfessorReportsScreen() {
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const { myCourses, myCriteria } = useProfessor();
  const repo = useMemo(() => di.resolve<ProfessorRepository>(TOKENS.ProfessorRepo), [di]);
  const { width } = useWindowDimensions();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<CategoryWithEval[]>([]);
  const [courseScores, setCourseScores] = useState<CourseScores[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  // Compute avg scores per criterium for one course
  const computeCourseScores = useCallback(async (course: Course): Promise<CriteriumAvg[]> => {
    if (myCriteria.length === 0) return [];
    const cats = await repo.getCategoriesByCourse(course._id);
    const allResults: ResultEvaluation[] = [];
    for (const cat of cats) {
      const groups = await repo.getGroupsByCategory(cat._id);
      for (const g of groups) {
        const res = await repo.getResultsByGroup(g._id);
        allResults.push(...res);
      }
    }
    return myCriteria.map((c) => {
      const vals = allResults.filter((r) => r.criterium_id === c._id).map((r) => Number(r.score));
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { criterium: c, avg };
    });
  }, [myCriteria, repo]);

  const load = useCallback(async () => {
    if (!loggedUser || myCourses.length === 0) { setIsLoading(false); return; }
    try {
      setIsLoading(true);
      const first = myCourses[0];
      setSelectedCourse(first);

      // Compute scores for all courses in parallel
      const allScores = await Promise.all(
        myCourses.map(async (course) => ({ course, criteriaAvgs: await computeCourseScores(course) }))
      );
      setCourseScores(allScores);

      // Load categories for first course
      await loadCategories(first._id);
    } catch (e: any) {
      if (e?.message?.includes("401")) await expireSession();
    } finally {
      setIsLoading(false);
    }
  }, [loggedUser, myCourses, myCriteria]);

  const loadCategories = useCallback(async (courseId: string) => {
    try {
      const cats = await repo.getCategoriesByCourse(courseId);
      const withData = await Promise.all(
        cats.map(async (cat) => {
          const [ev, groups] = await Promise.all([
            repo.getEvaluationByCategory(cat._id),
            repo.getGroupsByCategory(cat._id),
          ]);
          return { category: cat, evaluation: ev, groupCount: groups.length };
        }),
      );
      setCategories(withData);
    } catch {
      setCategories([]);
    }
  }, [repo]);

  useEffect(() => { load(); }, [load]);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    loadCategories(course._id);
  };

  // ── CSV export ─────────────────────────────────────────────────────────────
  const exportCsv = async (item: CategoryWithEval) => {
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

      const allMembers: StudentEnrollment[] = [];
      const allResults: ResultEvaluation[] = [];
      await Promise.all(
        groups.map(async (g: Group) => {
          const [members, results] = await Promise.all([
            repo.getMembersByGroup(g._id),
            repo.getResultsByGroup(g._id),
          ]);
          allMembers.push(...members);
          allResults.push(...results);
        }),
      );

      const uniqueMembers = Array.from(new Map(allMembers.map((m) => [m.userId, m])).values());
      const scoreMap: Record<string, Record<string, number[]>> = {};
      for (const r of allResults) {
        if (!scoreMap[r.evaluated_id]) scoreMap[r.evaluated_id] = {};
        if (!scoreMap[r.evaluated_id][r.criterium_id]) scoreMap[r.evaluated_id][r.criterium_id] = [];
        scoreMap[r.evaluated_id][r.criterium_id].push(Number(r.score));
      }
      const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);

      const headers = ["Nombre", "Correo", ...criteria.map((c: Criterium) => c.name), "Promedio General"];
      const rows = uniqueMembers.map((m) => {
        const scores = criteria.map((c: Criterium) => avg(scoreMap[m.userId]?.[c._id] ?? []));
        const overall = scores.length ? avg(scores) : 0;
        return [m.name, m.email, ...scores.map((s) => s.toFixed(2)), overall.toFixed(2)];
      });

      if (rows.length === 0) rows.push(["Sin datos registrados", "", ...criteria.map(() => "0"), "0"]);

      const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
      const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");

      const safeName = item.category.name.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `${safeName}_reporte.csv`;
      const fileUri = FileSystem.Paths.cache + "/" + fileName;
      const file = new FileSystem.File(fileUri);
      await file.write(csv);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: `Reporte: ${item.category.name}`, UTI: "public.comma-separated-values-text" });
      } else {
        Alert.alert("Exportado", `Archivo guardado en:\n${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert("Error al exportar", e?.message ?? String(e));
    } finally {
      setLoadingCategory(null);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.category._id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#111827", lineHeight: 34 }}>
              {"Analiza las actividades\nde tus cursos"}
            </Text>

            {/* Bar chart */}
            {myCriteria.length > 0 && courseScores.length > 0 && (
              <BarChart courses={myCourses} courseScores={courseScores} criteria={myCriteria} chartWidth={width - 40} />
            )}

            {/* Course tabs */}
            {myCourses.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                <View style={{ flexDirection: "row", gap: 24 }}>
                  {myCourses.map((course) => {
                    const active = selectedCourse?._id === course._id;
                    return (
                      <TouchableOpacity key={course._id} onPress={() => handleSelectCourse(course)}>
                        <Text style={{ fontSize: 13, fontWeight: "700", letterSpacing: 0.5, color: active ? PRIMARY : "#9CA3AF", paddingBottom: 10, borderBottomWidth: active ? 2 : 0, borderBottomColor: PRIMARY }}>
                          {course.name.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <View style={{ height: 1, backgroundColor: "#E5E7EB", marginBottom: 4 }} />
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#9CA3AF" }}>Sin categorías en este curso</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 18 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", fontSize: 16, color: "#111827" }}>{item.category.name}</Text>
                <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                  {item.groupCount} {item.groupCount === 1 ? "Grupo" : "Grupos"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => exportCsv(item)}
                disabled={loadingCategory === item.category._id}
                style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: item.evaluation ? PRIMARY : "#E5E7EB", alignItems: "center", justifyContent: "center" }}
              >
                {loadingCategory === item.category._id ? (
                  <ActivityIndicator size="small" color={PRIMARY} />
                ) : (
                  <Text style={{ color: item.evaluation ? PRIMARY : "#D1D5DB", fontSize: 18, fontWeight: "700", lineHeight: 22 }}>↓</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────

function BarChart({ courses, courseScores, criteria, chartWidth }: {
  courses: Course[];
  courseScores: CourseScores[];
  criteria: Criterium[];
  chartWidth: number;
}) {
  const visibleCriteria = criteria.slice(0, 6);
  const maxVal = 5;
  const chartHeight = 160;
  const marginLeft = 20;
  const marginBottom = 28;
  const marginTop = 8;
  const plotW = chartWidth - marginLeft;
  const plotH = chartHeight - marginBottom - marginTop;
  const groupW = plotW / visibleCriteria.length;
  const barW = Math.min(14, (groupW - 8) / courses.length);
  const barGap = 2;

  const yTicks = [0, 1, 2, 3, 4, 5];

  return (
    <View style={{ marginTop: 24, marginBottom: 8 }}>
      {/* Legend */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
        {courses.map((c, i) => (
          <View key={c._id} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: COLORS[i % COLORS.length] }} />
            <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "600", letterSpacing: 0.3 }}>{c.name.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        {/* Y grid lines and labels */}
        {yTicks.map((tick) => {
          const y = marginTop + plotH - (tick / maxVal) * plotH;
          return (
            <G key={tick}>
              <Line x1={marginLeft} y1={y} x2={chartWidth} y2={y} stroke="#F3F4F6" strokeWidth={1} />
              <SvgText x={marginLeft - 4} y={y + 4} fontSize={9} fill="#9CA3AF" textAnchor="end">{tick}</SvgText>
            </G>
          );
        })}

        {/* Bars */}
        {visibleCriteria.map((crit, ci) => {
          const groupX = marginLeft + ci * groupW + groupW / 2;
          const totalBarsW = courses.length * barW + (courses.length - 1) * barGap;
          const startX = groupX - totalBarsW / 2;
          return (
            <G key={crit._id}>
              {courseScores.map((cs, csi) => {
                const score = cs.criteriaAvgs.find((a) => a.criterium._id === crit._id)?.avg ?? 0;
                const barH = Math.max(2, (score / maxVal) * plotH);
                const bx = startX + csi * (barW + barGap);
                const by = marginTop + plotH - barH;
                return (
                  <Rect
                    key={cs.course._id}
                    x={bx}
                    y={by}
                    width={barW}
                    height={barH}
                    rx={3}
                    fill={COLORS[csi % COLORS.length]}
                  />
                );
              })}
              {/* X label */}
              <SvgText
                x={groupX}
                y={chartHeight - 6}
                fontSize={9}
                fill="#9CA3AF"
                textAnchor="middle"
              >
                {crit.name.length > 11 ? crit.name.slice(0, 10) + "…" : crit.name}
              </SvgText>
            </G>
          );
        })}

        {/* Base line */}
        <Line x1={marginLeft} y1={marginTop + plotH} x2={chartWidth} y2={marginTop + plotH} stroke="#E5E7EB" strokeWidth={1} />
      </Svg>
    </View>
  );
}
