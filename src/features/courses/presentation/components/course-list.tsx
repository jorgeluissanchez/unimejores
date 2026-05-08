import { Text } from "@/core/components/ui/text";
import { Course } from "@/features/courses/domain/entities/course";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Pressable } from "react-native";

export function CourseList() {
  const { courses } = useCourses();
  const router = useRouter();

  return (
    <FlatList
      data={courses}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ gap: 12 }}
      renderItem={({ item }: { item: Course }) => (
        <Pressable
          onPress={() => router.push(`/course/${item._id}` as any)}
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
  );
}
