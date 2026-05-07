import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-Provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Category, CourseUser, Group } from "@/features/courses/domain/entities/course";
import { CourseRepository } from "@/features/courses/domain/repositories/course-repository";
import { CategoryGroupPanel } from "@/features/courses/presentation/components/category-group-panel";
import { EvaluationProvider } from "@/features/evaluation/presentation/context/evaluation-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

type CategoryState = {
  category: Category;
  group: Group | null;
  members: CourseUser[];
};

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<CourseRepository>(TOKENS.CourseRepo), [di]);

  const [categoryStates, setCategoryStates] = useState<CategoryState[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !loggedUser?.userId) return;
    load();
  }, [courseId, loggedUser?.userId]);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const categories = await repo.getCategoriesByCourse(courseId!);

      const states = await Promise.all(
        categories.map(async (cat) => {
          const group = await repo.getGroupByCategory(cat.category_id, loggedUser!.userId);
          let members: CourseUser[] = [];
          if (group) {
            const userGroups = await repo.getMembersByGroup(group.group_id);
            const memberDetails = await Promise.all(
              userGroups.map((ug) => repo.getUserById(ug.user_id))
            );
            members = memberDetails.filter(Boolean) as CourseUser[];
          }
          return { category: cat, group, members };
        })
      );

      setCategoryStates(states);
      setActiveCategoryId((current) => current ?? states[0]?.category._id ?? null);
    } catch (e) {
      if (isSessionExpiredError(e)) {
        await expireSession();
        setError(null);
        return;
      }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-3 p-6">
        <Text className="text-center text-destructive">{error}</Text>
        <Pressable onPress={load}>
          <Text className="text-primary">Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (categoryStates.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">Este curso no tiene categorías</Text>
      </View>
    );
  }

  const activeValue = activeCategoryId ?? categoryStates[0].category._id;

  return (
    <EvaluationProvider>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="h-[240px] bg-[#4B4B68] relative overflow-hidden">

          {/* Decorative circles */}
          <View className="absolute bottom-0 left-0 right-0 h-16 bg-[#5A5A7A] opacity-40 rounded-t-[40px]" />
          <View className="absolute bottom-4 left-0 right-0 h-16 bg-[#72728F] opacity-30 rounded-t-[40px]" />

          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-16 left-5 z-10 w-11 h-11 rounded-full bg-white items-center justify-center"
          >
            <Text className="text-xl">
              ←
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <View className="flex-1 px-6 -mt-2 rounded-t-[32px] bg-white pt-8">

          {/* Course title */}
          <Text className="text-[34px] leading-[40px] font-semibold text-zinc-700">
            Programacion Movil
          </Text>

          {/* Average */}
          <Text className="text-zinc-400 mt-2">
            Tu promedio es de 4.3
          </Text>

          {/* Description */}
          <Text className="text-zinc-400 italic mt-6 leading-6">
            En las calificaciones importan tus compañeros y profesores
            por que el feedback despues de perder una nota es importante
            y el agradecimiento despues de ganarla tambien.
          </Text>

          {/* Section title */}
          <Text className="text-zinc-700 mt-8 text-[18px] font-medium">
            Calificalos a todos
          </Text>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 0,
              gap: 18,
            }}
          >
            {categoryStates.map((cs) => {
              const isActive =
                activeCategoryId === cs.category._id;

              return (
                <Pressable
                  key={cs.category._id}
                  onPress={() =>
                    setActiveCategoryId(cs.category._id)
                  }
                >
                  <View>
                    <Text
                      className={`uppercase tracking-[1px] text-[13px] ${isActive
                          ? "text-brand font-semibold"
                          : "text-zinc-400"
                        }`}
                    >
                      {cs.category.name}
                    </Text>

                    {isActive && (
                      <View className="mt-2 h-[2px] bg-brand rounded-full" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Members */}
            <CategoryGroupPanel
              key={activeValue}
              categoryState={
                categoryStates.find(
                  (cs) =>
                    cs.category._id === activeValue
                ) ?? categoryStates[0]
              }
              courseId={courseId!}
            />
        </View>
      </View>
    </EvaluationProvider>
  );
}
