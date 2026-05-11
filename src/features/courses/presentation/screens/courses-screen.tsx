import { CARD_ORANGE_SVG } from "@/assets/svgs/cardOrange";
import { CARD_PURPLE_SVG } from "@/assets/svgs/cardPurple";
import { Text } from "@/core/components/ui/text";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { CourseCard } from "@/features/courses/presentation/components/course-card";
import { PendingEvalCard } from "@/features/courses/presentation/components/pending-eval-card";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  View
} from "react-native";

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
  },
];

export default function CoursesScreen() {
  const { courses, isLoading, error, refreshCourses, pendingEvaluations, pendingLoading } = useCourses();

  const featuredEval = pendingEvaluations[0] ?? null;
  const featuredTheme = CARD_THEMES[0];

  const pendingCountByCourse = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const pe of pendingEvaluations) {
      map[pe.courseId] = (map[pe.courseId] ?? 0) + 1;
    }
    return map;
  }, [pendingEvaluations]);

  const getCourseTheme = (index: number) => CARD_THEMES[index % CARD_THEMES.length];

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
        ) : null}

        {error ? (
          <View className="mb-3">
            <Text className="text-red-500 text-center">{error}</Text>
            <Text
              className="text-[#818CF8] text-center mt-1"
              onPress={refreshCourses}
            >
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
          onRefresh={refreshCourses}
          refreshing={isLoading}
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center pt-8">
                <Text className="text-gray-400">No tienes cursos asignados</Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const theme = getCourseTheme(index);
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
