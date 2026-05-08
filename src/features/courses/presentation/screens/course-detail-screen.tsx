import { CourseCategoriesPanel } from "@/features/courses/presentation/components/course-categories-panel";
import { useLocalSearchParams } from "expo-router";
import React from "react";

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  return <CourseCategoriesPanel courseId={courseId!} />;
}
