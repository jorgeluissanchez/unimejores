import { ProfessorCategoryGroupsScreen } from "@/features/professor/presentation/screens/professor-category-groups-screen";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function ProfessorCategoryDetailPage() {
  const { courseId, categoryId } = useLocalSearchParams<{ courseId: string; categoryId: string }>();
  const router = useRouter();
  return (
    <ProfessorCategoryGroupsScreen
      courseId={courseId}
      categoryId={categoryId}
      onClose={() => router.back()}
    />
  );
}
