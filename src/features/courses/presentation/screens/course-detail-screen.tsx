import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Text } from "@/core/components/ui/text";
import { CategoryGroupPanel } from "@/features/courses/presentation/components/category-group-panel";
import { CourseDetailProvider, useCourseDetail } from "@/features/courses/presentation/context/course-detail-context";
import { EvaluationProvider } from "@/features/evaluation/presentation/context/evaluation-context";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

function CourseDetailContent() {
  const { courseId, categoryStates, activeCategoryId, setActiveCategoryId, isLoading, error, reload } = useCourseDetail();

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
        <Pressable onPress={reload}>
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

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  return (
    <CourseDetailProvider courseId={courseId!}>
      <EvaluationProvider>
        <CourseDetailContent />
      </EvaluationProvider>
    </CourseDetailProvider>
  );
}
