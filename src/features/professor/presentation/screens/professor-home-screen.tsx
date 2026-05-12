import { Button } from "@/core/components/ui/button";
import { Card, CardContent } from "@/core/components/ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/core/components/ui/drawer";
import { Text } from "@/core/components/ui/text";
import { LogoutButton } from "@/features/auth/presentation/components/logout-button";
import { CourseCard } from "@/features/courses/presentation/components/course-card";
import { Course } from "@/features/professor/domain/entities/professor";
import { Ionicons } from "@expo/vector-icons";
import { RelativePathString, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, TouchableOpacity, View } from "react-native";
import { CARD_ORANGE_SVG } from "../../../../../assets/svgs/cardOrange";
import { CARD_PURPLE_SVG } from "../../../../../assets/svgs/cardPurple";
import { AddCourseForm } from "../components/add-course-form";
import { UpdateCourseForm } from "../components/update-course-form";
import { useProfessor } from "../context/professor-context";

function hashCode(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export function ProfessorHomeScreen() {
  const { myCourses, isLoading, deleteCourse } = useProfessor();
  const router = useRouter();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);

  if (isLoading && myCourses.length === 0) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>;
  }

  return (
    <View className="flex-1 p-4">
      <View className="mb-4 flex-row items-center gap-2">
        <Text variant="h3" className="flex-1">Mis Cursos</Text>
        <TouchableOpacity
          onPress={() => router.push("/criterios" as RelativePathString)}
          style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="list-outline" size={18} color="#374151" />
        </TouchableOpacity>
        <Button size="sm" onPress={() => setIsAddOpen(true)}>
          <Text>Agregar</Text>
        </Button>
        <LogoutButton />
      </View>

      {/* Top course cards (estilo estudiante) */}
      {myCourses.length > 0 && (
        <View className="mb-4">
          <FlatList
            data={myCourses}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
            keyExtractor={(c) => c._id}
            renderItem={({ item, index }) => (
              <View style={{ width: 260 }}>
                <CourseCard
                  course={item as any}
                  pendingCount={Math.floor(Math.abs(hashCode(item._id)) % 4)}
                  svg={index % 2 === 0 ? CARD_PURPLE_SVG : CARD_ORANGE_SVG}
                  background={index % 2 === 0 ? "#808AFF" : "#F9D7A6"}
                  textColor={index % 2 === 0 ? "#FFFFFF" : "#1F2937"}
                  secondaryTextColor={index % 2 === 0 ? "#EDEEFF" : "#4B5563"}
                  buttonBackground={index % 2 === 0 ? "#FFFFFF" : "#111827"}
                  buttonTextColor={index % 2 === 0 ? "#4F46E5" : "#FFFFFF"}
                />
              </View>
            )}
          />
        </View>
      )}

      {/* Crear nuevo curso grande */}
      <View className="mb-6 items-center">
        <Button size="lg" className="rounded-full px-6" onPress={() => setIsAddOpen(true)} style={{ backgroundColor: "#7C5CFF" }}>
          <Text className="text-white">CREAR UN NUEVO CURSO</Text>
        </Button>
      </View>

      {myCourses.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">No tienes cursos creados</Text>
        </View>
      ) : (
        <FlatList
          data={myCourses}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ gap: 12, paddingBottom: 88 }}
          renderItem={({ item }) => (
            <Card>
              <CardContent className="py-4">
                <View className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <Text className="font-semibold">{item.name}</Text>
                    <Text className="text-sm text-muted-foreground">NRC: {item.nrc}</Text>
                    {!!item.description && <Text className="text-sm text-muted-foreground">{item.description}</Text>}
                  </View>
                  <Button size="sm" variant="outline" onPress={() => router.push(`/professor-course/${item._id}` as RelativePathString)}>
                    <Text>Ver</Text>
                  </Button>
                  <Button size="sm" variant="outline" onPress={() => setEditCourse(item)}>
                    <Text>Editar</Text>
                  </Button>
                  <Button size="sm" variant="destructive" onPress={() => deleteCourse(item._id)}>
                    <Text>Eliminar</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>
          )}
        />
      )}

      {/* Analiza el estado de tus evaluaciones */}
      <View className="mt-6">
        <Text variant="h4" className="mb-3">Analiza el estado de tus evaluaciones</Text>
        <FlatList
          data={myCourses}
          keyExtractor={(c) => `eval-${c._id}`}
          contentContainerStyle={{ gap: 12, paddingBottom: 140 }}
          renderItem={({ item }) => {
            const total = 20;
            const finished = Math.floor(Math.abs(hashCode(item._id + "f")) % (total + 1));
            return (
              <Card>
                <CardContent>
                  <View className="flex-row items-center gap-4">
                    <View className="w-12 h-12 rounded-full items-center justify-center border border-gray-200">
                      <Text className="text-sm font-semibold">{`${finished}/${total}`}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold">Sprint Review</Text>
                      <Text className="text-sm text-muted-foreground">{item.name} · 28 feb 2026</Text>
                    </View>
                    <Text className="text-sm text-muted-foreground">Ver</Text>
                  </View>
                </CardContent>
              </Card>
            );
          }}
        />
      </View>

      <Drawer open={isAddOpen} onOpenChange={(o) => { if (!o) setIsAddOpen(false); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Agregar curso</DrawerTitle>
            <DrawerDescription>Crea un nuevo curso</DrawerDescription>
          </DrawerHeader>
          <View className="px-4"><AddCourseForm onCancel={() => setIsAddOpen(false)} /></View>
        </DrawerContent>
      </Drawer>

      <Drawer open={!!editCourse} onOpenChange={(o) => { if (!o) setEditCourse(null); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar curso</DrawerTitle>
            <DrawerDescription>Modifica los datos del curso</DrawerDescription>
          </DrawerHeader>
          <View className="px-4">
            {editCourse && <UpdateCourseForm course={editCourse} onCancel={() => setEditCourse(null)} />}
          </View>
        </DrawerContent>
      </Drawer>

    </View>
  );
}
