import { Button } from "@/core/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/core/components/ui/drawer";
import { Input } from "@/core/components/ui/input";
import { Text } from "@/core/components/ui/text";
import { GroupMember, StudentEnrollment } from "@/features/professor/domain/entities/professor";
import { useProfessor } from "@/features/professor/presentation/context/professor-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Minus, Plus } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, TouchableOpacity, View } from "react-native";

const PRIMARY = "#818CF8";

type Tab = "enrolled" | "others";

export function ProfessorGroupDetailScreen() {
  const { courseId, categoryId, groupId } = useLocalSearchParams<{
    courseId: string;
    categoryId: string;
    groupId: string;
  }>();
  const router = useRouter();
  const {
    getGroupsByCategory,
    getGroupMembersDetail,
    removeMemberFromGroup,
    addMemberToGroup,
    getStudentsInCourse,
    getAvailableStudents,
    addStudentToCourse,
  } = useProfessor();

  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<StudentEnrollment[]>([]);
  const [otherStudents, setOtherStudents] = useState<StudentEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("enrolled");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId || !groupId) return;
    getGroupsByCategory(categoryId).then((groups) => {
      const g = groups.find((x) => x._id === groupId);
      if (g) setGroupName(g.name);
    }).catch(() => {});
  }, [categoryId, groupId]);

  const load = useCallback(async () => {
    if (!groupId || !courseId) return;
    try {
      setIsLoading(true);
      const [grpMembers, courseStudents, available] = await Promise.all([
        getGroupMembersDetail(groupId),
        getStudentsInCourse(courseId),
        getAvailableStudents(courseId),
      ]);
      setMembers(grpMembers);
      const memberIds = new Set(grpMembers.map((m) => m.userId));
      setEnrolledStudents(courseStudents.filter((s) => !memberIds.has(s.userId)));
      setOtherStudents(available);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [groupId, courseId]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (userGroupId: string) => {
    await removeMemberFromGroup(userGroupId);
    await load();
  };

  const handleAddEnrolled = async (userId: string) => {
    setAdding(userId);
    try {
      await addMemberToGroup(userId, groupId!);
      await load();
    } finally {
      setAdding(null);
    }
  };

  const handleAddOther = async (userId: string) => {
    setAdding(userId);
    try {
      await addStudentToCourse(courseId!, userId);
      await addMemberToGroup(userId, groupId!);
      await load();
    } finally {
      setAdding(null);
    }
  };

  const matches = (s: StudentEnrollment) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase());

  const filteredEnrolled = enrolledStudents.filter(matches);
  const filteredOthers = otherStudents.filter(matches);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="w-full max-w-lg mx-auto flex-1 px-5">
        <View className="flex-row items-center pt-4 pb-6">
          <Button
            onPress={() => router.back()}
            className="rounded-full w-[50px] h-[50px] p-0 items-center justify-center mr-4"
            style={{ backgroundColor: "#E6E7F2" }}
          >
            <ArrowLeft size={20} color="#1F265E" />
          </Button>
          <Text className="text-lg font-bold tracking-widest text-gray-900">GRUPO</Text>
        </View>

        <View className="bg-muted rounded-2xl px-4 py-3 mb-5">
          <Text className="text-xs text-muted-foreground">Nombre</Text>
          <Text className="text-base font-semibold text-foreground mt-0.5">{groupName.toUpperCase()}</Text>
        </View>

        <View className="flex-row items-center mb-3">
          <Text className="text-[13px] font-bold tracking-widest flex-1" style={{ color: PRIMARY }}>
            MIEMBROS
          </Text>
          <Button size="sm" onPress={() => { setSearch(""); setIsAddOpen(true); }}>
            <Text>AÑADIR</Text>
          </Button>
        </View>
        <View className="h-px bg-gray-200 mb-1" />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.userGroupId}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={<Text className="text-muted-foreground text-center mt-6">Sin miembros aún</Text>}
            renderItem={({ item }) => (
              <View>
                <View className="flex-row items-center py-4">
                  <View className="flex-1">
                    <Text className="font-semibold text-base text-foreground">{item.name}</Text>
                    {!!item.email && <Text className="text-xs text-muted-foreground mt-0.5">{item.email}</Text>}
                  </View>
                  <Button
                    onPress={() => handleRemove(item.userGroupId)}
                    className="w-[50px] h-[50px] rounded-full p-0 items-center justify-center"
                    style={{ backgroundColor: "#E6E7F2" }}
                  >
                    <Minus size={18} color="#1F265E" />
                  </Button>
                </View>
                <View className="h-px bg-gray-100" />
              </View>
            )}
          />
        )}
      </View>

      <Drawer open={isAddOpen} onOpenChange={(o) => { if (!o) setIsAddOpen(false); }}>
        <DrawerContent side="bottom">
          <DrawerHeader>
            <DrawerTitle>Añadir miembro</DrawerTitle>
            <DrawerDescription>Selecciona un estudiante para agregar al grupo</DrawerDescription>
          </DrawerHeader>
          <View className="px-4 pb-6 gap-3">
            <View className="flex-row gap-1 rounded-xl bg-muted p-1">
              {([
                { key: "enrolled", label: "Inscritos en el curso" },
                { key: "others", label: "Otros estudiantes" },
              ] as { key: Tab; label: string }[]).map((t) => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  className={`flex-1 py-2 rounded-lg ${tab === t.key ? "bg-white" : ""}`}
                >
                  <Text
                    className={`text-xs text-center font-semibold ${
                      tab === t.key ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input value={search} onChangeText={setSearch} placeholder="Buscar por nombre o correo..." />

            <FlatList
              data={tab === "enrolled" ? filteredEnrolled : filteredOthers}
              keyExtractor={(s) => s.userId}
              style={{ maxHeight: 360 }}
              ListEmptyComponent={
                <Text className="text-muted-foreground text-center py-6">
                  {tab === "enrolled" ? "Sin estudiantes inscritos disponibles" : "Sin otros estudiantes"}
                </Text>
              }
              renderItem={({ item }) => (
                <View className="flex-row items-center py-3 border-b border-gray-100">
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">{item.name}</Text>
                    {!!item.email && <Text className="text-xs text-muted-foreground">{item.email}</Text>}
                  </View>
                  {adding === item.userId ? (
                    <ActivityIndicator color={PRIMARY} />
                  ) : (
                    <Button
                      onPress={() => (tab === "enrolled" ? handleAddEnrolled(item.userId) : handleAddOther(item.userId))}
                      className="w-[50px] h-[50px] rounded-full p-0 items-center justify-center"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      <Plus size={18} color="#fff" />
                    </Button>
                  )}
                </View>
              )}
            />
          </View>
        </DrawerContent>
      </Drawer>
    </SafeAreaView>
  );
}
