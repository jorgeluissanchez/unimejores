import { CARD_ORANGE_SVG } from "@/assets/svgs/cardOrange";
import { CARD_PURPLE_SVG } from "@/assets/svgs/cardPurple";
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
import { SvgXml } from "react-native-svg";

type CourseCardTheme = {
  background: string;
  text: string;
  secondaryText: string;
  buttonBackground: string;
  buttonText: string;
  svg: string;
};

const CARD_THEMES: CourseCardTheme[] = [
  {
    background: "#8E97FD",
    text: "#F7E8D0",
    secondaryText: "#FFECCC",
    buttonBackground: "#EBEAEC",
    buttonText: "#3F414E",
    svg: CARD_PURPLE_SVG,
  },
  {
    background: "#FFCB7E",
    text: "#3F414E",
    secondaryText: "#524F53",
    buttonBackground: "#3F414E",
    buttonText: "#FEFFFE",
    svg: CARD_ORANGE_SVG,
  }
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
      className="mb-5 overflow-hidden rounded-[22px] px-5 py-6"
      style={{ backgroundColor: CARD_THEMES[0].background, width: '100%' }}
    >
      <View className="absolute right-[-12px] top-[-18px] opacity-95">
        <SvgXml xml={CARD_THEMES[0].svg} width={100} height={100} />
      </View>
      <View className="absolute bottom-[-26px] right-[-26px] h-[108px] w-[108px] rounded-full opacity-10" style={{ backgroundColor: "#808AFF" }} />
      <View className="absolute bottom-[-4px] left-[-18px] h-[74px] w-[74px] rounded-full opacity-10" style={{ backgroundColor: "#99A1FF" }} />

      <View className="flex-row justify-between items-start">
        <Text className="flex-1 text-[19px] font-bold leading-6" style={{ color: CARD_THEMES[0].text }}>
          {data.courseName}
        </Text>
        <Text className="mt-1 text-[12px]" style={{ color: CARD_THEMES[0].secondaryText }}>
          {formatTimeUntil(data.evaluationEndDate)}
        </Text>
      </View>

      <Text className="mb-5 mt-1 text-[12px] tracking-wide" style={{ color: CARD_THEMES[0].secondaryText }}>
        {data.evaluationTitle.toUpperCase()}
      </Text>
      <Button
        className="h-12 rounded-[18px]"
        style={{ backgroundColor: CARD_THEMES[0].buttonBackground, width: '100%', justifyContent: 'center' }}
        onPress={() => router.push(`/course/${data.courseId}` as RelativePathString)}
      >
        <Text className="text-[15px] tracking-wide text-center" style={{ color: CARD_THEMES[0].buttonText }}>
          EVALUAR
        </Text>
      </Button>
    </View>
  );
}

function CourseCard({ course, theme, pendingCount }: { course: Course; theme: CourseCardTheme; pendingCount: number }) {
  const router = useRouter();
  const statusText = pendingCount === 0
    ? "Todos han Sido Calificados"
    : `${pendingCount} Grupo${pendingCount !== 1 ? "s" : ""} por Calificar`;

  return (
    <View
      className="min-h-[188px] flex-1 justify-between overflow-hidden rounded-[20px] px-4 py-5"
      style={{
        backgroundColor: theme.background,
      }}
    >
      <View className="absolute right-[-10px] top-[-12px] opacity-90">
        <SvgXml
          xml={theme.svg}
          width={100}
          height={100}
        />
      </View>

      <View className="mt-auto">
        <Text
          className="text-[20px] font-semibold leading-6"
          style={{ color: theme.text }}
        >
          {course.name}
        </Text>
        <Text
          className="mb-4 mt-1 text-[12px] leading-[16px]"
          style={{ color: theme.secondaryText }}
        >
          {statusText}
        </Text>


        <Button
          size="sm"
          className="ml-auto mt-2 h-11 rounded-full px-5"
          style={{ backgroundColor: theme.buttonBackground }}
          onPress={() =>
            router.push(`/course/${course._id}` as RelativePathString)
          }
          disabled={pendingCount === 0}
        >
          <Text className="text-[13px] tracking-wide" style={{ color: theme.buttonText }}>
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

  // Use the full set of card themes so the grid alternates correctly
  const courseThemes = CARD_THEMES;
  const getCourseTheme = (index: number) => courseThemes[index % courseThemes.length];

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
          <PendingEvalCard data={featuredEval} />
        ) : null}
        {error ? (
          <Pressable onPress={refreshCourses} className="mb-3">
            <Text className="text-red-500 text-center">{error}</Text>
            <Text className="text-[#818CF8] text-center mt-1">Reintentar</Text>
          </Pressable>
        ) : null}
        <FlatList
          data={courses}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 16 }}
          contentContainerStyle={{ gap: 16 }}
          showsVerticalScrollIndicator={false}
          onRefresh={refreshCourses}
          refreshing={isLoading}
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
              theme={getCourseTheme(index)}
              pendingCount={pendingCountByCourse[item._id] ?? 0}
            />
          )}
        />
      </View>
    </View>
  );
}
