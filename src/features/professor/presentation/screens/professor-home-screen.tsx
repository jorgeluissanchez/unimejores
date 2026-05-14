import { CARD_ORANGE_SVG } from "@/assets/svgs/cardOrange";
import { CARD_PURPLE_SVG } from "@/assets/svgs/cardPurple";
import { Button } from "@/core/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/core/components/ui/drawer";
import { Text } from "@/core/components/ui/text";
import { CourseCard } from "@/features/courses/presentation/components/course-card";
import { Course } from "@/features/professor/domain/entities/professor";
import { AddCourseForm } from "@/features/professor/presentation/components/add-course-form";
import { CriteriaDrawer } from "@/features/professor/presentation/components/criteria-drawer";
import { UpdateCourseForm } from "@/features/professor/presentation/components/update-course-form";
import { RelativePathString } from "expo-router";
import { List, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { Circle, Svg } from "react-native-svg";
import { useProfessor } from "../context/professor-context";

const CARD_THEMES = [
  { background: "#8E97FD", text: "#FFFFFF", secondaryText: "#EDEEFF", buttonBackground: "#FFFFFF", buttonText: "#1F2937", svg: CARD_PURPLE_SVG },
  { background: "#F9D7A6", text: "#1F2937", secondaryText: "#4B5563", buttonBackground: "#111827", buttonText: "#FFFFFF", svg: CARD_ORANGE_SVG },
];

type EvalProgressItem = {
  evaluationId: string;
  title: string;
  courseName: string;
  endDate: string;
  completed: number;
  total: number;
};

export function ProfessorHomeScreen() {
  const {
    myCourses,
    isLoading,
    getCategoriesByCourse,
    getEvaluationByCategory,
    getGroupsByCategory,
    getMembersByGroup,
    getResultsByGroup,
  } = useProfessor();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [progressItems, setProgressItems] = useState<EvalProgressItem[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);

  const loadProgress = useCallback(async () => {
    if (myCourses.length === 0) { setProgressItems([]); return; }
    setProgressLoading(true);
    try {
      const all: EvalProgressItem[] = [];
      for (const course of myCourses) {
        const cats = await getCategoriesByCourse(course._id);
        for (const cat of cats) {
          const [ev, groups] = await Promise.all([
            getEvaluationByCategory(cat._id),
            getGroupsByCategory(cat._id),
          ]);
          if (!ev || groups.length === 0) continue;
          let total = 0;
          const completedSet = new Set<string>();
          await Promise.all(
            groups.map(async (g) => {
              const [members, results] = await Promise.all([
                getMembersByGroup(g._id),
                getResultsByGroup(g._id),
              ]);
              total += members.length;
              results.forEach((r) => completedSet.add(r.evaluator_id));
            }),
          );
          all.push({
            evaluationId: ev._id,
            title: ev.title,
            courseName: course.name,
            endDate: ev.end_date,
            completed: Math.min(completedSet.size, total),
            total,
          });
        }
      }
      setProgressItems(all);
    } catch {
      setProgressItems([]);
    } finally {
      setProgressLoading(false);
    }
  }, [myCourses]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  if (isLoading && myCourses.length === 0) {
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
          data={myCourses}
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
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 16 }}>
                      <CircleProgress completed={item.completed} total={item.total} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "700", fontSize: 15, color: "#111827" }}>{item.title}</Text>
                        <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                          {item.courseName}{item.endDate ? ` · ${formatDate(item.endDate)}` : ""}
                        </Text>
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
                    course={item as any}
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
          <View className="px-5 pt-4 pb-16" style={{ flex: 1 }}>
            <View className="flex-row items-center mb-6">
              <Button variant="secondary" onPress={() => setIsAddOpen(false)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">AGREGAR CURSO</Text>
              <View style={{ width: 50 }} />
            </View>
            <AddCourseForm onCancel={() => setIsAddOpen(false)} />
          </View>
        </DrawerContent>
      </Drawer>

      <Drawer open={!!editCourse} onOpenChange={(o) => { if (!o) setEditCourse(null); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Editar curso</DrawerTitle>
          <View className="px-5 pt-4 pb-16" style={{ flex: 1 }}>
            <View className="flex-row items-center mb-6">
              <Button variant="secondary" onPress={() => setEditCourse(null)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">EDITAR CURSO</Text>
              <View style={{ width: 50 }} />
            </View>
            {editCourse && <UpdateCourseForm course={editCourse} onCancel={() => setEditCourse(null)} />}
          </View>
        </DrawerContent>
      </Drawer>

      <CriteriaDrawer open={isCriteriaOpen} onClose={() => setIsCriteriaOpen(false)} />
    </View>
  );
}

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
