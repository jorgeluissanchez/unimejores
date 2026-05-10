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
    background: "#8E97FD",
    blob: "#808AFF",
    button: "#EBEAEC",
    buttonText: "#3F414E",
    text: "#F7E8D0",
    secondaryText: "#FFECCC",
  },
  {
    background: "#8E97FD",
    blob: "#808AFF",
    button: "#EBEAEC",
    buttonText: "#3F414E",
    text: "#F7E8D0",
    secondaryText: "#FFECCC",
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
      className="rounded-[20px] p-5 mb-5 overflow-hidden"
      style={{ backgroundColor: "#8E97FD" }}
    >
      {/* Decorative circles — negative positioning requires inline style */}
      <View className="absolute bottom-[-30px] right-[-30px] w-[120px] h-[120px] rounded-full opacity-15" style={{ backgroundColor: "#808AFF" }} />
      <View className="absolute bottom-[-10px] right-[-10px] w-[60px] h-[60px] rounded-full opacity-10" style={{ backgroundColor: "#808AFF" }} />

      <View className="flex-row justify-between items-start">
        <Text className="text-[18px] font-bold flex-1" style={{ color: "#F7E8D0" }}>
          {data.courseName}
        </Text>
          <Text className="text-[12px] mt-1" style={{ color: "#FFECCC" }}>
            {formatTimeUntil(data.evaluationEndDate)}
          </Text>
      </View>

      <Text className="text-[12px] mt-1 mb-4" style={{ color: "#FFECCC" }}>
        {data.evaluationTitle.toUpperCase()}
      </Text>
      <Button
        className="bg-[#EBEAEC] rounded-md hover:bg-[#EBEAEC]/90"
        onPress={() => router.push(`/course/${data.courseId}` as RelativePathString)}
      >
        <Text style={{ color: "#3F414E" }}>
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
        backgroundColor: "#8E97FD",
      }}
    >
      {/* Decorative blob */}
      <View
        className="absolute top-2 right-[-10px] w-[90px] h-[90px] rounded-full opacity-40"
        style={{
          backgroundColor: "#545ecb",
        }}
      />

      <View className="mt-auto">
        <Text
          className="text-[20px] font-semibold leading-6"
          style={{ color: "#F7E8D0" }}
        >
          {course.name}
        </Text>
        <Text
          className="text-[12px] mb-3 leading-[16px]"
          style={{
            color: "#FFECCC",
          }}
        >
          {statusText}
        </Text>


        <Button
          size="sm"
          className="rounded-full w-fit px-5 ml-auto mt-3 bg-[#EBEAEC] hover:bg-[#EBEAEC]/90"
          onPress={() =>
            router.push(`/course/${course._id}` as RelativePathString)
          }
          disabled={pendingCount === 0}
        >
          <Text
            className="text-xs"
            style={{
              color: "#3F414E",
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
      <View className="flex-1 w-full max-w-[980px] mx-auto">
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
                  <Text className="text-lg p-10 text-center text-gray-400 tracking-wide">UniMejores</Text>

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
    </View>
  );
}
