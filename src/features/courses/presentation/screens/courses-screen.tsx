import { Text } from "@/core/components/ui/text";
import { CourseList } from "@/features/courses/presentation/components/course-list";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

export default function CoursesScreen() {
  const { courses, isLoading, error, refreshCourses } = useCourses();

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
        <Pressable onPress={refreshCourses}>
          <Text className="text-primary">Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (courses.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">No tienes cursos asignados</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4">
      <Text variant="h2" className="mb-4">Mis Cursos</Text>
      <CourseList />
    </View>
  );
}
