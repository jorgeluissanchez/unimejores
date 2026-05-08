import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { PendingEvalData } from "@/features/courses/domain/entities/course";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { Course } from "@/features/courses/domain/entities/course";
import { RelativePathString, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";

const CARD_COLORS = ["#818CF8", "#F59E0B", "#34D399", "#F472B6", "#60A5FA", "#A78BFA"];

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
    <Pressable
      onPress={() => router.push(`/course/${data.courseId}` as RelativePathString)}
      className="rounded-[20px] p-5 mb-5 overflow-hidden bg-[#818CF8]"
    >
      {/* Decorative circles — negative positioning requires inline style */}
      <View
        style={{
          position: "absolute",
          bottom: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "rgba(255,255,255,0.15)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 20,
          right: 40,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "rgba(255,255,255,0.1)",
        }}
      />

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

      <Pressable
        onPress={() => router.push(`/course/${data.courseId}` as RelativePathString)}
        className="rounded-full py-3 items-center"
        style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
      >
        <Text className="text-[#818CF8] text-[13px] font-bold tracking-[1px]">
          EVALUAR
        </Text>
      </Pressable>
    </Pressable>
  );
}

function CourseCard({ course, color, pendingCount }: { course: Course; color: string; pendingCount: number }) {
  const router = useRouter();
  const statusText = pendingCount === 0
    ? "Todos han Sido Calificados"
    : `${pendingCount} Grupo${pendingCount !== 1 ? "s" : ""} por Calificar`;

  return (
    <Pressable
      onPress={() => router.push(`/course/${course._id}` as RelativePathString)}
      className="flex-1 rounded-[20px] p-4 overflow-hidden justify-between"
      style={{ backgroundColor: color, minHeight: 160 }}
    >
      {/* Decorative circle — negative positioning requires inline style */}
      <View
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: "rgba(255,255,255,0.2)",
        }}
      />

      <Text className="text-white text-[15px] font-bold leading-5">
        {course.name}
      </Text>

      <View>
        <Text className="text-[11px] mb-2.5 leading-[15px]" style={{ color: "rgba(255,255,255,0.85)" }}>
          {statusText}
        </Text>
        <Pressable
          onPress={() => router.push(`/course/${course._id}` as RelativePathString)}
          className="rounded-full py-2 items-center"
          style={{ backgroundColor: pendingCount === 0 ? "rgba(255,255,255,0.3)" : "#1E1E2E" }}
        >
          <Text className="text-white text-[11px] font-bold tracking-[1px]">
            COMIENZA
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function CoursesScreen() {
  const { courses, isLoading, error, refreshCourses, pendingEvaluations, pendingLoading } = useCourses();
  const { loggedUser } = useAuth();

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
            color={CARD_COLORS[index % CARD_COLORS.length]}
            pendingCount={pendingCountByCourse[item._id] ?? 0}
          />
        )}
      />
    </View>
  );
}
