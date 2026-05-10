import { Button } from "@/core/components/ui/button";
import { Card, CardContent } from "@/core/components/ui/card";
import { Input } from "@/core/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-Provider";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { StudentEnrollment } from "@/features/professor/domain/entities/professor";
import { ProfessorRepository } from "@/features/professor/domain/repositories/professor-repository";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";

export function ProfessorStudentsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const di = useDI();
  const { expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<ProfessorRepository>(TOKENS.ProfessorRepo), [di]);

  const [tab, setTab] = useState("inscritos");

  const [enrolled, setEnrolled] = useState<StudentEnrollment[]>([]);
  const [available, setAvailable] = useState<StudentEnrollment[]>([]);
  const [loadingEnrolled, setLoadingEnrolled] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const availableLoaded = useRef(false);

  const [enrolledSearch, setEnrolledSearch] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadEnrolled = async () => {
    try {
      setLoadingEnrolled(true);
      setError(null);
      const data = await repo.getStudentsInCourse(courseId!);
      setEnrolled(data);
    } catch (e: any) {
      if (e?.message?.includes("401")) { await expireSession(); return; }
      setError(e.message);
    } finally {
      setLoadingEnrolled(false);
    }
  };

  const loadAvailable = async () => {
    try {
      setLoadingAvailable(true);
      setError(null);
      const data = await repo.getAvailableStudents(courseId!);
      setAvailable(data);
      availableLoaded.current = true;
    } catch (e: any) {
      if (e?.message?.includes("401")) { await expireSession(); return; }
      setError(e.message);
    } finally {
      setLoadingAvailable(false);
    }
  };

  useEffect(() => { loadEnrolled(); }, [courseId]);

  useEffect(() => {
    if (tab === "agregar" && !availableLoaded.current) {
      loadAvailable();
    }
  }, [tab]);

  const handleAdd = async (student: StudentEnrollment) => {
    try {
      await repo.addStudentToCourse(courseId!, student.userId);
      await Promise.all([loadEnrolled(), loadAvailable()]);
    } catch (e: any) { setError(e.message); }
  };

  const handleRemove = async (userCourseId: string) => {
    try {
      await repo.removeStudentFromCourse(userCourseId);
      availableLoaded.current = false;
      await loadEnrolled();
    } catch (e: any) { setError(e.message); }
  };

  const filteredEnrolled = enrolled.filter((s) =>
    enrolledSearch ? s.email.toLowerCase().includes(enrolledSearch.toLowerCase()) || s.name.toLowerCase().includes(enrolledSearch.toLowerCase()) : true,
  );

  const filteredAvailable = available.filter((s) =>
    availableSearch ? s.email.toLowerCase().includes(availableSearch.toLowerCase()) || s.name.toLowerCase().includes(availableSearch.toLowerCase()) : true,
  );

  return (
    <View className="flex-1 p-4 gap-3">
      {!!error && <Text className="text-destructive">{error}</Text>}

      <Tabs value={tab} onValueChange={setTab} className="flex-1">
        <TabsList>
          <TabsTrigger value="inscritos"><Text>Inscritos</Text></TabsTrigger>
          <TabsTrigger value="agregar"><Text>Agregar</Text></TabsTrigger>
        </TabsList>

        <TabsContent value="inscritos" className="flex-1 gap-3 mt-2">
          <Input
            value={enrolledSearch}
            onChangeText={setEnrolledSearch}
            placeholder="Buscar por nombre o correo..."
          />
          {loadingEnrolled ? (
            <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
          ) : filteredEnrolled.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground">
                {enrolledSearch ? "Sin resultados" : "Sin estudiantes inscritos"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredEnrolled}
              keyExtractor={(item) => item.userCourseId}
              contentContainerStyle={{ gap: 10, paddingBottom: 88 }}
              renderItem={({ item }) => (
                <Card>
                  <CardContent className="py-3">
                    <View className="flex-row items-center gap-2">
                      <View className="flex-1">
                        <Text className="font-semibold">{item.name}</Text>
                        <Text className="text-sm text-muted-foreground">{item.email}</Text>
                      </View>
                      <Button size="sm" variant="destructive" onPress={() => handleRemove(item.userCourseId)}>
                        <Text>Retirar</Text>
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              )}
            />
          )}
        </TabsContent>

        <TabsContent value="agregar" className="flex-1 gap-3 mt-2">
          <Input
            value={availableSearch}
            onChangeText={setAvailableSearch}
            placeholder="Buscar por nombre o correo..."
          />
          {loadingAvailable ? (
            <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
          ) : filteredAvailable.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground">
                {availableSearch ? "Sin resultados" : "No hay estudiantes disponibles"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredAvailable}
              keyExtractor={(item) => item.userId}
              contentContainerStyle={{ gap: 10, paddingBottom: 88 }}
              renderItem={({ item }) => (
                <Card>
                  <CardContent className="py-3">
                    <View className="flex-row items-center gap-2">
                      <View className="flex-1">
                        <Text className="font-semibold">{item.name}</Text>
                        <Text className="text-sm text-muted-foreground">{item.email}</Text>
                      </View>
                      <Button size="sm" onPress={() => handleAdd(item)}>
                        <Text>Añadir</Text>
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              )}
            />
          )}
        </TabsContent>
      </Tabs>
    </View>
  );
}
