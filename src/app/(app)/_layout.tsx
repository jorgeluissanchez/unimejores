import { Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { CourseProvider } from '@/features/courses/presentation/context/course-context';
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="course/[courseId]" options={{ headerShown: true, title: "Curso", headerBackVisible: true }} />
      </Stack>
    </CourseProvider>
  );
}