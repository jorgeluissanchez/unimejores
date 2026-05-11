import { Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { CourseProvider } from '@/features/courses/presentation/context/course-context';
import { EvaluationProvider } from '@/features/evaluation/presentation/context/evaluation-context';
import { Redirect, RelativePathString } from 'expo-router';

export default function AppLayout() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return null;
  }
  
  if (!isLoggedIn) {
    return <Redirect href={"/login" as RelativePathString} />;
  }

  return (
    <CourseProvider>
      <EvaluationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="course/[courseId]/index" options={{ headerShown: false }} />
          <Stack.Screen name="course/[courseId]/group/[groupId]/evaluatee/[evaluateeId]" options={{ headerShown: false }} />
          <Stack.Screen name="professor-course/[courseId]/index" options={{ headerShown: true, title: "Detalle del curso", headerBackVisible: true }} />
          <Stack.Screen name="professor-course/[courseId]/categories" options={{ headerShown: true, title: "Categorías", headerBackVisible: true }} />
          <Stack.Screen name="professor-course/[courseId]/students" options={{ headerShown: true, title: "Estudiantes", headerBackVisible: true }} />
          <Stack.Screen name="professor-course/[courseId]/category/[categoryId]/index" options={{ headerShown: true, title: "Categoría", headerBackVisible: true }} />
        </Stack>
      </EvaluationProvider>
    </CourseProvider>
  );
}