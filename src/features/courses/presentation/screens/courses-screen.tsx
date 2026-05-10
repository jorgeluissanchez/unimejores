import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { Course, PendingEvalData } from "@/features/courses/domain/entities/course";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { RelativePathString, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View
} from "react-native";

const CARD_COLORS = ["#818CF8", "#F59E0B", "#34D399", "#F472B6", "#60A5FA", "#A78BFA"];
const CARD_THEMES = [
  {
    background: "#A5B4FC", // indigo-300
    blob: "#818CF8",       // indigo-400
    button: "#E5E7EB",     // gray-200
    buttonText: "#3F3F46", // zinc-700
    text: "#FFFFFF",
    secondaryText: "rgba(255,255,255,0.85)",
  },
  {
    background: "#FDBA74", // orange-300
    blob: "#FB923C",       // orange-400
    button: "#3F3F46",     // zinc-700
    buttonText: "#FFFFFF",
    text: "#1E1E2E",
    secondaryText: "rgba(30,30,46,0.8)",
  },
];

function formatTimeUntil(endDate: string): string {
  const ms = new Date(endDate).getTime() - Date.now();
  if (ms <= 0) return "Cerrada";
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `Cierra en ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Cierra en ${days}d`;
}

function PendingEvalCard({ data }: { data: PendingEvalData }) {
  const router = useRouter();
  return (
    <View
      className="rounded-[20px] p-5 mb-5 overflow-hidden bg-indigo-100"
    >
      {/* Decorative circles — negative positioning requires inline style */}
      <View className="absolute bottom-[-30px] right-[-30px] w-[120px] h-[120px] rounded-full bg-white opacity-15" />
      <View className="absolute bottom-[-10px] right-[-10px] w-[60px] h-[60px] rounded-full bg-white opacity-10" />

      <View className="flex-row justify-between items-start">
        <Text className="text-white text-[18px] font-bold flex-1">
          {data.courseName}
        </Text>
        <View className="rounded-[20px] px-2.5 py-1" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
          <Text className="text-white text-[11px] font-semibold">
            {formatTimeUntil(data.evaluationEndDate)}
          </Text>
        </View>
      </View>

      <Text className="text-[12px] mt-1 mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>
        {data.evaluationTitle.toUpperCase()}
      </Text>
      <Button
        className="bg-white"
        onPress={() => router.push(`/course/${data.courseId}` as RelativePathString)}
      >
        <Text className="text-[#818CF8] text-[13px] font-bold tracking-[1px]">
          EVALUAR
        </Text>
      </Button>
    </View>
  );
}

function CourseCard({ course, theme, pendingCount }: { course: Course; theme: typeof CARD_THEMES[number]; pendingCount: number }) {
  const router = useRouter();
  const statusText = pendingCount === 0
    ? "Todos han Sido Calificados"
    : `${pendingCount} Grupo${pendingCount !== 1 ? "s" : ""} por Calificar`;

  return (
    <View
      className="flex-1 rounded-[20px] p-4 overflow-hidden justify-between min-h-[210px]"
      style={{
        backgroundColor: theme.background,
      }}
    >
      {/* Decorative blob */}
      <View
        className="absolute top-2 right-[-10px] w-[90px] h-[90px] rounded-full opacity-40"
        style={{
          backgroundColor: theme.blob,
        }}
      />

      <View>
        <Text
          className="text-[20px] font-semibold leading-6"
          style={{ color: theme.text }}
        >
          {course.name}
        </Text>
      </View>

      <View>
        <Text
          className="text-[12px] mb-3 leading-[16px]"
          style={{
            color: theme.secondaryText,
          }}
        >
          {statusText}
        </Text>

        <Button
          className="rounded-full"
          style={{
            backgroundColor: theme.button,
          }}
          onPress={() =>
            router.push(`/course/${course._id}` as RelativePathString)
          }
          disabled={pendingCount === 0}
        >
          <Text
            className="text-[13px] font-bold tracking-[1px]"
            style={{
              color: theme.buttonText,
            }}
          >
            COMIENZA
          </Text>
        </Button>
      </View>
    </View>
  );
}

export default function CoursesScreen() {
  const { courses, isLoading, error, refreshCourses, pendingEvaluations, pendingLoading } = useCourses();

  const featuredEval = pendingEvaluations[0] ?? null;

  const pendingCountByCourse = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const pe of pendingEvaluations) {
      map[pe.courseId] = (map[pe.courseId] ?? 0) + 1;
    }
    return map;
  }, [pendingEvaluations]);

  return (
    <View className="flex-1 bg-white">

      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 12 }}
        showsVerticalScrollIndicator={false}
        onRefresh={refreshCourses}
        refreshing={isLoading}
        ListHeaderComponent={
          <View>
            <View className="items-center py-5">
              <Text className="text-[13px] text-gray-400 tracking-[1px]">UniMejores</Text>
            </View>

            <Text className="text-[26px] font-bold text-[#1E1E2E] mb-1.5">
              Con que materia{"\n"}quieres empezar?
            </Text>
            <Text className="text-[14px] text-gray-400 italic mb-5">
              Elije la que te guste mas.
            </Text>

            {pendingLoading ? (
              <View className="items-center mb-5">
                <ActivityIndicator color="#818CF8" />
              </View>
            ) : featuredEval ? (
              <PendingEvalCard data={featuredEval} />
            ) : null}

            {error ? (
              <Pressable onPress={refreshCourses} className="mb-3">
                <Text className="text-red-500 text-center">{error}</Text>
                <Text className="text-[#818CF8] text-center mt-1">Reintentar</Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center pt-8">
              <Text className="text-gray-400">No tienes cursos asignados</Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <CourseCard
            course={item}
            theme={CARD_THEMES[index % 2]}
            pendingCount={pendingCountByCourse[item._id] ?? 0}
          />
        )}
      />
    </View>
  );
}
