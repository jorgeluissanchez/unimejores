import { Text } from "@/core/components/ui/text";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { Course } from "@/features/courses/domain/entities/course";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";

export default function CoursesScreen() {
  const { courses, isLoading, error, refreshCourses } = useCourses();
  const router = useRouter();

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
      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }: { item: Course }) => (
          <Pressable
            onPress={() => router.push(`/course/${item.course_id}` as any)}
            className="rounded-xl border border-border bg-card p-4 active:opacity-70"
          >
            <Text className="text-lg font-semibold">{item.name}</Text>
            <Text className="text-sm text-muted-foreground">NRC: {item.nrc}</Text>
            {!!item.description && (
              <Text className="mt-1 text-sm text-muted-foreground">{item.description}</Text>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}
