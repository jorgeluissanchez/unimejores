import { Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { CourseProvider } from '@/features/courses/presentation/context/course-context';
import { EvaluationProvider } from '@/features/evaluation/presentation/context/evaluation-context';
import { ProfessorProvider } from '@/features/professor/presentation/context/professor-context';
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
    <ProfessorProvider>
      <CourseProvider>
        <EvaluationProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </EvaluationProvider>
      </CourseProvider>
    </ProfessorProvider>
  );
}
