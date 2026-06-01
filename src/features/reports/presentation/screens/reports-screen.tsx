import { Button } from "@/core/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Course, Group, StudentEnrollment } from "@/features/courses/domain/entities/course";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { Criterium, ResultEvaluation } from "@/features/evaluation/domain/entities/evaluation";
import { useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import { Platform } from "react-native";
import { Download } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { Circle, G, Line, Rect, Svg, Text as SvgText } from "react-native-svg";

const PRIMARY = "#818CF8";
const COLORS = ["#C7D2FE", "#818CF8", "#4F46E5", "#312E81"];

type EvalReportItem = { evaluationId: string; evaluationTitle: string; categoryId: string; categoryName: string; groupCount: number; completed: number; total: number };
type CriteriumAvg = { criterium: Criterium; avg: number };
type CourseScores = { course: Course; criteriaAvgs: CriteriumAvg[] };

export function ReportsScreen() {
  const { loggedUser, expireSession } = useAuth();
  const { courses, getCategoriesByCourse, getGroupsByCategory, getMembersByGroup } = useCourses();
  const { myCriteria, getResultsByGroup, getEvaluationsByCategory, getCriteriaForEvaluation } = useEvaluation();
  const { width } = useWindowDimensions();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [evalItems, setEvalItems] = useState<EvalReportItem[]>([]);
  const [courseScores, setCourseScores] = useState<CourseScores[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingEval, setLoadingEval] = useState<string | null>(null);

  const computeCourseScores = useCallback(async (course: Course): Promise<CriteriumAvg[]> => {
    if (myCriteria.length === 0) return [];
    const cats = await getCategoriesByCourse(course._id);
    const allResults: ResultEvaluation[] = [];
    for (const cat of cats) {
      const groups = await getGroupsByCategory(cat._id);
      for (const g of groups) {
        const res = await getResultsByGroup(g._id);
        allResults.push(...res);
      }
    }
    return myCriteria.map((c) => {
      const vals = allResults.filter((r) => r.criterium_id === c._id).map((r) => Number(r.score));
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { criterium: c, avg };
    });
  }, [myCriteria]);

  const loadCategories = useCallback(async (courseId: string) => {
    try {
      const cats = await getCategoriesByCourse(courseId);
      const items = (await Promise.all(
        cats.map(async (cat) => {
          const [evs, groups] = await Promise.all([
            getEvaluationsByCategory(cat._id),
            getGroupsByCategory(cat._id),
          ]);
          // compute completion at category level
          const groupData = await Promise.all(
            groups.map(async (g) => {
              const [members, results] = await Promise.all([
                getMembersByGroup(g._id),
                getResultsByGroup(g._id),
              ]);
              return { members, results };
            }),
          );
          const total = groupData.reduce((s, { members }) => s + members.length, 0);
          const completed = Math.min(
            new Set(groupData.flatMap(({ results }) => results.map((r) => r.evaluator_id))).size,
            total,
          );
          return evs.map((ev) => ({
            evaluationId: ev._id,
            evaluationTitle: ev.title,
            categoryId: cat._id,
            categoryName: cat.name,
            groupCount: groups.length,
            completed,
            total,
          }));
        }),
      )).flat();
      setEvalItems(items);
    } catch {
      setEvalItems([]);
    }
  }, []);

  const load = useCallback(async () => {
    if (!loggedUser || courses.length === 0) { setIsLoading(false); return; }
    try {
      setIsLoading(true);
      const first = courses[0];
      setSelectedCourse(first);

      const allScores = await Promise.all(
        courses.map(async (course) => ({ course, criteriaAvgs: await computeCourseScores(course) }))
      );
      setCourseScores(allScores);

      await loadCategories(first._id);
    } catch (e: any) {
      if (e?.message?.includes("401")) await expireSession();
    } finally {
      setIsLoading(false);
    }
  }, [loggedUser, courses, myCriteria]);

  useEffect(() => { load(); }, [load]);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    loadCategories(course._id);
  };

  const exportCsv = async (item: EvalReportItem) => {
    setLoadingEval(item.evaluationId);
    try {
      const [criteria, groups] = await Promise.all([
        getCriteriaForEvaluation(item.evaluationId),
        getGroupsByCategory(item.categoryId),
      ]);

      const allMembers: StudentEnrollment[] = [];
      const allResults: ResultEvaluation[] = [];
      await Promise.all(
        groups.map(async (g: Group) => {
          const [members, results] = await Promise.all([
            getMembersByGroup(g._id),
            getResultsByGroup(g._id),
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

      const safeName = item.evaluationTitle.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `${safeName}_reporte.csv`;

      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const FS = require("expo-file-system");
        const Sharing = require("expo-sharing");
        const fileUri = FS.cacheDirectory + fileName;
        await FS.writeAsStringAsync(fileUri, csv, { encoding: FS.EncodingType.UTF8 });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: `Reporte: ${item.evaluationTitle}`, UTI: "public.comma-separated-values-text" });
        } else {
          Alert.alert("Exportado", `Archivo guardado en:\n${fileUri}`);
        }
      }
    } catch (e: any) {
      Alert.alert("Error al exportar", e?.message ?? String(e));
    } finally {
      setLoadingEval(null);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  const containerWidth = Math.min(width, 512);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="w-full max-w-lg mx-auto flex-1">
        <FlatList
          data={evalItems}
          keyExtractor={(item) => item.evaluationId}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
              <Text style={{ fontSize: 26, fontWeight: "700", color: "#111827", lineHeight: 34 }}>
                {"Analiza las actividades\nde tus cursos"}
              </Text>

              {myCriteria.length > 0 && courseScores.length > 0 && (
                <BarChart courses={courses} courseScores={courseScores} criteria={myCriteria} chartWidth={containerWidth - 40} />
              )}

              {courses.length > 0 && (
                <Tabs value={selectedCourse?._id ?? ""} onValueChange={(id) => { const c = courses.find((c) => c._id === id); if (c) handleSelectCourse(c); }} className="mb-1">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8 }}>
                    <TabsList className="bg-transparent h-auto rounded-none p-0 gap-6">
                      {courses.map((course) => {
                        const active = selectedCourse?._id === course._id;
                        return (
                          <TabsTrigger
                            key={course._id}
                            value={course._id}
                            className="bg-transparent rounded-none px-0 pb-2 h-auto"
                            style={{ borderBottomWidth: active ? 2 : 0, borderBottomColor: PRIMARY }}
                          >
                            <Text className="text-[13px] font-bold tracking-[0.5px]" style={{ color: active ? PRIMARY : "#9CA3AF" }}>
                              {course.name.toUpperCase()}
                            </Text>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </ScrollView>
                </Tabs>
              )}

              <View style={{ height: 1, backgroundColor: "#E5E7EB", marginBottom: 4 }} />
            </View>
          }
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: "#9CA3AF" }}>Sin evaluaciones en este curso</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isComplete = item.total > 0 && item.completed >= item.total;
            return (
              <View style={{ paddingHorizontal: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 18, gap: 14 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16, color: "#111827" }}>{item.evaluationTitle}</Text>
                    <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                      {item.categoryName} · {item.groupCount} {item.groupCount === 1 ? "Grupo" : "Grupos"}
                    </Text>
                  </View>
                  {isComplete ? (
                    <Button
                      variant="secondary"
                      onPress={() => exportCsv(item)}
                      disabled={loadingEval === item.evaluationId}
                      className="rounded-full w-[38px] h-[38px] p-0 items-center justify-center"
                      style={{ borderWidth: 1.5, borderColor: PRIMARY }}
                    >
                      {loadingEval === item.evaluationId
                        ? <ActivityIndicator size="small" color={PRIMARY} />
                        : <Download size={18} color={PRIMARY} />}
                    </Button>
                  ) : (
                    <CircleProgress completed={item.completed} total={item.total} />
                  )}
                </View>
                <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

// ── Circle Progress ───────────────────────────────────────────────────────────

function CircleProgress({ completed, total, size = 48 }: { completed: number; total: number; size?: number }) {
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? completed / total : 0;
  const c = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={c} cy={c} r={r} stroke="#F3F4F6" strokeWidth={sw} fill="none" />
        <Circle cx={c} cy={c} r={r} stroke="#818CF8" strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`} />
      </Svg>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 9, fontWeight: "700", color: "#111827", lineHeight: 11 }}>{completed}/{total}</Text>
      </View>
    </View>
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
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
        {courses.map((c, i) => (
          <View key={c._id} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: COLORS[i % COLORS.length] }} />
            <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "600", letterSpacing: 0.3 }}>{c.name.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        {yTicks.map((tick) => {
          const y = marginTop + plotH - (tick / maxVal) * plotH;
          return (
            <G key={tick}>
              <Line x1={marginLeft} y1={y} x2={chartWidth} y2={y} stroke="#F3F4F6" strokeWidth={1} />
              <SvgText x={marginLeft - 4} y={y + 4} fontSize={9} fill="#9CA3AF" textAnchor="end">{tick}</SvgText>
            </G>
          );
        })}

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
              <SvgText x={groupX} y={chartHeight - 6} fontSize={9} fill="#9CA3AF" textAnchor="middle">
                {crit.name.length > 11 ? crit.name.slice(0, 10) + "…" : crit.name}
              </SvgText>
            </G>
          );
        })}

        <Line x1={marginLeft} y1={marginTop + plotH} x2={chartWidth} y2={marginTop + plotH} stroke="#E5E7EB" strokeWidth={1} />
      </Svg>
    </View>
  );
}
