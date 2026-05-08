import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Text } from "@/core/components/ui/text";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function ProfessorCourseDetailPage() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();

  return (
    <View className="flex-1 p-4 gap-4">
      <Button variant="outline" onPress={() => router.push(`/course/${courseId}` as RelativePathString)}>
        <Text>Ver curso (vista estudiante)</Text>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
          <CardDescription>Gestiona las categorías de este curso</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onPress={() => router.push(`/professor-course/${courseId}/categories` as RelativePathString)}>
            <Text>Gestionar categorías</Text>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estudiantes</CardTitle>
          <CardDescription>Añade o retira estudiantes del curso</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onPress={() => router.push(`/professor-course/${courseId}/students` as RelativePathString)}>
            <Text>Gestionar estudiantes</Text>
          </Button>
        </CardContent>
      </Card>
    </View>
  );
}
