import { Course } from "@/features/courses/domain/entities/course";
import { useCourses } from "@/features/courses/presentation/context/course-context";

import { useRouter } from "expo-router";

import React from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  View,
} from "react-native";

const CARD_COLORS = [
  "bg-[#8D8DFF]",
  "bg-[#F4BC67]",
  "bg-[#FF8FAB]",
  "bg-[#7DD3FC]",
];

export default function CoursesScreen() {
  const { courses, isLoading, error, refreshCourses } =
    useCourses();

  const router = useRouter();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-3 p-6 bg-white">
        <Text className="text-center text-red-500">
          {error}
        </Text>

        <Pressable onPress={refreshCourses}>
          <Text className="text-brand">
            Reintentar
          </Text>
        </Pressable>
      </View>
    );
  }

  if (courses.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-zinc-500">
          No tienes cursos asignados
        </Text>
      </View>
    );
  }

  const featuredCourse = courses[0];

  const secondaryCourses = courses.slice(1);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={secondaryCourses}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{
          gap: 14,
          justifyContent: "space-between",
        }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 120,
          gap: 14,
        }}
        ListHeaderComponent={
          <>
            {/* Logo */}
            <Text className="text-center text-[14px] tracking-[4px] text-zinc-700 mt-2">
              UniMejores
            </Text>

            {/* Title */}
            <View className="mt-10">
              <Text className="text-[34px] leading-[40px] font-semibold text-zinc-700">
                Con que materia quieres empezar?
              </Text>

              <Text className="text-zinc-400 mt-3 text-[16px]">
                Elije la que te guste mas.
              </Text>
            </View>

            {/* Featured Course */}
            <Pressable
              onPress={() =>
                router.push(
                  `/course/${featuredCourse.course_id}` as any
                )
              }
              className="mt-8 rounded-[28px] bg-[#8D8DFF] p-5"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-4">
                  <Text className="text-white text-[20px] font-semibold">
                    {featuredCourse.name}
                  </Text>

                  <Text className="text-white/80 mt-2 text-[12px] uppercase">
                    Sprint 2 Review
                  </Text>
                </View>

                <Text className="text-white/70 text-[11px]">
                  Cierra en 24h
                </Text>
              </View>

              <Pressable className="mt-6 bg-white rounded-full h-11 items-center justify-center">
                <Text className="text-zinc-700 font-medium tracking-[1px]">
                  EVALUAR
                </Text>
              </Pressable>
            </Pressable>
          </>
        }
        renderItem={({ item, index }: { item: Course; index: number }) => {
          const color =
            CARD_COLORS[(index + 1) % CARD_COLORS.length];

          return (
            <Pressable
              onPress={() =>
                router.push(
                  `/course/${item.course_id}` as any
                )
              }
              style={{
                width: "48%",
              }}
              className={`rounded-[24px] p-4 h-[190px] ${color}`}
            >
              <View className="flex-1 justify-between">
                <View>
                  <Text className="text-white text-[18px] font-semibold leading-[22px]">
                    {item.name}
                  </Text>

                  <Text className="text-white/80 text-[11px] mt-2">
                    {item.description ||
                      "Todo un reto por descubrir"}
                  </Text>
                </View>

                <View>
                  <Text className="text-white/70 text-[10px] mb-3">
                    NRC {item.nrc}
                  </Text>

                  <View className="bg-white rounded-full h-9 items-center justify-center">
                    <Text className="text-zinc-700 text-[11px] font-medium tracking-[1px]">
                      COMIENZA
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}