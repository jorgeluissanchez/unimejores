import { CARD_ORANGE_SVG } from "@/assets/svgs/cardOrange";
import { CARD_PURPLE_SVG } from "@/assets/svgs/cardPurple";
import { Button } from "@/core/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/core/components/ui/drawer";
import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Course } from "@/features/courses/domain/entities/course";
import { AddCourseForm } from "@/features/courses/presentation/components/forms/add-course-form";
import { UpdateCourseForm } from "@/features/courses/presentation/components/forms/update-course-form";
import { CourseCard } from "@/features/courses/presentation/components/course-card";
import { PendingEvalCard } from "@/features/courses/presentation/components/pending-eval-card";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { CriteriaDrawer } from "@/features/evaluation/presentation/components/criteria-drawer";
import { useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import { RelativePathString } from "expo-router";
import { List, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, View } from "react-native";
import { Circle, Svg } from "react-native-svg";

const CARD_THEMES = [
  { background: "#8E97FD", text: "#F7E8D0", secondaryText: "#FFECCC", buttonBackground: "#EBEAEC", buttonText: "#3F414E", svg: CARD_PURPLE_SVG },
  { background: "#FFCB7E", text: "#3F414E", secondaryText: "#524F53", buttonBackground: "#3F414E", buttonText: "#FEFFFE", svg: CARD_ORANGE_SVG },
];

export function HomeScreen() {
  const { loggedUser } = useAuth();
  if (loggedUser?.role === "professor") return <ProfessorHome />;
  return <StudentHome />;
}

// ─── Student home ──────────────────────────────────────────────────────────────

function StudentHome() {
  const { courses, isLoading, error, refresh, pendingEvaluations, pendingLoading } = useCourses();

  const featuredEval = pendingEvaluations[0] ?? null;
  const featuredTheme = CARD_THEMES[0];

  const pendingCountByCourse = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const pe of pendingEvaluations) {
      map[pe.courseId] = (map[pe.courseId] ?? 0) + 1;
    }
    return map;
  }, [pendingEvaluations]);

  return (
    <View className="flex-1 bg-white">
      <Text className="text-lg p-10 text-center text-gray-400 tracking-wide">UniMejores</Text>
      <View className="w-full max-w-lg mx-auto flex-1 px-4">
        <Text variant="h1" className="text-gray-800 text-center">
          ¿Con que materia quieres empezar?
        </Text>
        <Text className="italic text-gray-400 mt-2 mb-6 text-center">
          Elije la que te guste mas.
        </Text>

        {pendingLoading ? (
          <View className="mb-5 items-center">
            <ActivityIndicator color="#818CF8" />
          </View>
        ) : featuredEval ? (
          <PendingEvalCard
            data={featuredEval}
            svg={featuredTheme.svg}
            background={featuredTheme.background}
            textColor={featuredTheme.text}
            secondaryTextColor={featuredTheme.secondaryText}
            buttonBackground={featuredTheme.buttonBackground}
            buttonTextColor={featuredTheme.buttonText}
          />
        ) : courses.length > 0 ? (
          <View style={{ backgroundColor: "#F3F4F6", borderRadius: 20, padding: 24, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#9CA3AF", marginBottom: 6 }}>
              Todo al día
            </Text>
            <Text style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 20 }}>
              Ya evaluaste a todos tus compañeros.{"\n"}Espera tu próxima evaluación.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View className="mb-3">
            <Text className="text-red-500 text-center">{error}</Text>
            <Text className="text-[#818CF8] text-center mt-1" onPress={refresh}>
              Reintentar
            </Text>
          </View>
        ) : null}

        <FlatList
          data={courses}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 16 }}
          contentContainerStyle={{ gap: 16 }}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={isLoading}
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center pt-8">
                <Text className="text-gray-400">No tienes cursos asignados</Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length];
            return (
              <CourseCard
                course={item}
                pendingCount={pendingCountByCourse[item._id] ?? 0}
                svg={theme.svg}
                background={theme.background}
                textColor={theme.text}
                secondaryTextColor={theme.secondaryText}
                buttonBackground={theme.buttonBackground}
                buttonTextColor={theme.buttonText}
              />
            );
          }}
        />
      </View>
    </View>
  );
}

// ─── Professor home ────────────────────────────────────────────────────────────

type CriteriumAvgItem = { criteriumId: string; name: string; avg: number };
type EvalProgressItem = {
  evaluationId: string;
  categoryId: string;
  title: string;
  courseName: string;
  endDate: string;
  completed: number;
  total: number;
  criteriaAvgs: CriteriumAvgItem[];
  overallAvg: number;
};

function ProfessorHome() {
  const {
    courses,
    isLoading,
    getCategoriesByCourse,
    getGroupsByCategory,
    getMembersByGroup,
  } = useCourses();

  const { getEvaluationsByCategory, getResultsByGroup, myCriteria } = useEvaluation();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [progressItems, setProgressItems] = useState<EvalProgressItem[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);

  const loadProgress = useCallback(async () => {
    if (courses.length === 0) { setProgressItems([]); return; }
    setProgressLoading(true);
    try {
      // fetch all categories for all courses in parallel
      const courseCats = await Promise.all(
        courses.map(async (course) => ({ course, cats: await getCategoriesByCourse(course._id) }))
      );

      // fetch all evals + groups for every category in parallel (flattened)
      const catResults = await Promise.all(
        courseCats.flatMap(({ course, cats }) =>
          cats.map(async (cat) => {
            const [evs, groups] = await Promise.all([
              getEvaluationsByCategory(cat._id),
              getGroupsByCategory(cat._id),
            ]);
            return { course, evs, groups };
          }),
        ),
      );

      const groupDataByCategory = await Promise.all(
        catResults.map(async ({ groups }) => {
          if (groups.length === 0) return { total: 0, completedSet: new Set<string>(), allResults: [] as import("@/features/evaluation/domain/entities/evaluation").ResultEvaluation[] };
          const groupData = await Promise.all(
            groups.map(async (g) => {
              const [members, results] = await Promise.all([getMembersByGroup(g._id), getResultsByGroup(g._id)]);
              return { members, results };
            }),
          );
          const total = groupData.reduce((s, { members }) => s + members.length, 0);
          const allResults = groupData.flatMap(({ results }) => results);
          const completedSet = new Set(allResults.map((r) => r.evaluator_id));
          return { total, completedSet, allResults };
        }),
      );

      const items: EvalProgressItem[] = [];
      catResults.forEach(({ course, evs }, i) => {
        const { total, completedSet, allResults } = groupDataByCategory[i];
        if (evs.length === 0) return;
        for (const ev of evs) {
          const criteriaAvgs = myCriteria
            .map((c) => {
              const vals = allResults.filter((r) => r.criterium_id === c._id).map((r) => Number(r.score));
              return { criteriumId: c._id, name: c.name, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
            })
            .filter((c) => c.avg > 0);
          const overallAvg = criteriaAvgs.length ? criteriaAvgs.reduce((s, c) => s + c.avg, 0) / criteriaAvgs.length : 0;
          items.push({
            evaluationId: ev._id,
            categoryId: ev.category_id,
            title: ev.title,
            courseName: course.name,
            endDate: ev.end_date,
            completed: Math.min(completedSet.size, total),
            total,
            criteriaAvgs,
            overallAvg,
          });
        }
      });

      setProgressItems(items);
    } catch {
      setProgressItems([]);
    } finally {
      setProgressLoading(false);
    }
  }, [courses, myCriteria]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  if (isLoading && courses.length === 0) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>;
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center p-10">
        <Text className="text-lg text-center text-gray-400 tracking-wide flex-1">UniMejores</Text>
        <Button
          variant="secondary"
          onPress={() => setIsCriteriaOpen(true)}
          className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
        >
          <List size={20} color="#1F265E" />
        </Button>
      </View>

      <View className="w-full max-w-lg mx-auto flex-1">
        <FlatList
          data={courses}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 16 }}
          contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onRefresh={loadProgress}
          refreshing={isLoading}
          ListHeaderComponent={
            <View>
              <Text variant="h1" className="text-gray-800 text-center mt-6">
                Con qué materia quieres calificar?
              </Text>
              <Text className="italic text-gray-400 mt-2 mb-6 text-center">
                Elije la que te guste mas.
              </Text>
            </View>
          }
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center pt-4">
                <Text className="text-gray-400">No tienes cursos creados</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            <View>
              <View className="items-center my-6">
                <Button
                  size="lg"
                  className="rounded-full w-full"
                  style={{ backgroundColor: "#8E97FD", paddingVertical: 18 }}
                  onPress={() => setIsAddOpen(true)}
                >
                  <Text className="text-white font-bold tracking-widest text-base">CREAR UN NUEVO CURSO</Text>
                </Button>
              </View>

              <Text variant="h2" className="text-gray-800 mb-3">
                Analiza el estado de tus evaluaciones
              </Text>

              {progressLoading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator color="#818CF8" />
                </View>
              ) : progressItems.length === 0 ? (
                <Text className="text-muted-foreground text-center py-4">Sin evaluaciones activas</Text>
              ) : (
                progressItems.map((item) => (
                  <View key={item.evaluationId}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 16, paddingVertical: 16 }}>
                      <CircleProgress completed={item.completed} total={item.total} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "700", fontSize: 15, color: "#111827" }}>{item.title}</Text>
                        <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                          {item.courseName}{item.endDate ? ` · ${formatDate(item.endDate)}` : ""}
                        </Text>
                        {item.criteriaAvgs.length > 0 && (
                          <View style={{ marginTop: 8, gap: 4 }}>
                            {item.criteriaAvgs.map((c) => (
                              <View key={c.criteriumId} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Text style={{ fontSize: 11, color: "#6B7280", width: 90 }} numberOfLines={1}>{c.name}</Text>
                                <View style={{ flex: 1, height: 5, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                                  <View style={{ width: `${Math.min((c.avg / 5) * 100, 100)}%`, height: "100%", backgroundColor: "#818CF8", borderRadius: 3 }} />
                                </View>
                                <Text style={{ fontSize: 11, fontWeight: "700", color: "#374151", width: 28, textAlign: "right" }}>{c.avg.toFixed(1)}</Text>
                              </View>
                            ))}
                            <Text style={{ fontSize: 11, color: "#818CF8", fontWeight: "700", marginTop: 2 }}>
                              Promedio general: {item.overallAvg.toFixed(2)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
                  </View>
                ))
              )}
            </View>
          }
          renderItem={({ item, index }) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length];
            return (
              <CourseCard
                course={item}
                pendingCount={0}
                statusText={item.nrc ? `NRC ${item.nrc}` : "Gestionar curso"}
                disabled={false}
                svg={theme.svg}
                href={`/professor-course/${item._id}` as RelativePathString}
                background={theme.background}
                textColor={theme.text}
                secondaryTextColor={theme.secondaryText}
                buttonBackground={theme.buttonBackground}
                buttonTextColor={theme.buttonText}
              />
            );
          }}
        />
      </View>

      <Drawer open={isAddOpen} onOpenChange={(o) => { if (!o) setIsAddOpen(false); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Agregar curso</DrawerTitle>
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-muted">
              <Button variant="secondary" onPress={() => setIsAddOpen(false)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">AGREGAR CURSO</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
              <AddCourseForm onCancel={() => setIsAddOpen(false)} />
            </ScrollView>
          </View>
        </DrawerContent>
      </Drawer>

      <Drawer open={!!editCourse} onOpenChange={(o) => { if (!o) setEditCourse(null); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Editar curso</DrawerTitle>
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-muted">
              <Button variant="secondary" onPress={() => setEditCourse(null)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">EDITAR CURSO</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
              {editCourse && <UpdateCourseForm course={editCourse} onCancel={() => setEditCourse(null)} />}
            </ScrollView>
          </View>
        </DrawerContent>
      </Drawer>

      <CriteriaDrawer open={isCriteriaOpen} onClose={() => setIsCriteriaOpen(false)} />
    </View>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function CircleProgress({ completed, total, size = 48 }: { completed: number; total: number; size?: number }) {
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? completed / total : 0;
  const offset = circ * (1 - pct);
  const c = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={c} cy={c} r={r} stroke="#F3F4F6" strokeWidth={sw} fill="none" />
        <Circle
          cx={c} cy={c} r={r}
          stroke="#818CF8"
          strokeWidth={sw}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 9, fontWeight: "700", color: "#111827", lineHeight: 11 }}>
          {completed}/{total}
        </Text>
      </View>
    </View>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}
