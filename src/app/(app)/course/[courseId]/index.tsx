import { CourseDetailProvider } from "@/features/courses/presentation/context/course-detail-context";
import CourseDetailScreen from "@/features/courses/presentation/screens/course-detail-screen";
import { useLocalSearchParams } from "expo-router";
import React from "react";

export default function CourseDetailRoute() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  return (
    <CourseDetailProvider courseId={courseId}>
      <CourseDetailScreen />
    </CourseDetailProvider>
  );
}
