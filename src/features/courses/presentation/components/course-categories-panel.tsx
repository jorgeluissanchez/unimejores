import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-Provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Category, CourseUser, Group } from "@/features/courses/domain/entities/course";
import { CourseRepository } from "@/features/courses/domain/repositories/course-repository";
import { CategoryGroupPanel } from "@/features/courses/presentation/components/category-group-panel";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

type CategoryState = {
  category: Category;
  group: Group | null;
  members: CourseUser[];
};

type Props = { courseId: string };

export function CourseCategoriesPanel({ courseId }: Props) {
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<CourseRepository>(TOKENS.CourseRepo), [di]);

  const [categoryStates, setCategoryStates] = useState<CategoryState[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!courseId || !loggedUser?.userId) return;
    try {
      setIsLoading(true);
      setError(null);
      const categories = await repo.getCategoriesByCourse(courseId);
      const states = await Promise.all(
        categories.map(async (cat) => {
          const group = await repo.getGroupByCategory(cat._id, loggedUser.userId);
          let members: CourseUser[] = [];
          if (group) {
            const userGroups = await repo.getMembersByGroup(group._id);
            const memberDetails = await Promise.all(
              userGroups.map((ug) => repo.getUserById(ug.user_id))
            );
            members = memberDetails.filter(Boolean) as CourseUser[];
          }
          return { category: cat, group, members };
        })
      );
      setCategoryStates(states);
      setActiveCategoryId((cur) => cur ?? states[0]?.category._id ?? null);
    } catch (e) {
      if (isSessionExpiredError(e)) { await expireSession(); return; }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [courseId, loggedUser?.userId]);

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
    <View className="flex-1">
      <Tabs value={activeValue} onValueChange={setActiveCategoryId} className="flex-1 flex flex-col p-4 w-full">
        <TabsList className="mx-auto">
          {categoryStates.map((cs) => (
            <TabsTrigger key={cs.category._id} value={cs.category._id}>
              <Text>{cs.category.name}</Text>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeValue} className="flex-1">
          <CategoryGroupPanel
            key={activeValue}
            categoryState={categoryStates.find((cs) => cs.category._id === activeValue) ?? categoryStates[0]}
            courseId={courseId}
          />
        </TabsContent>
      </Tabs>
    </View>
  );
}
