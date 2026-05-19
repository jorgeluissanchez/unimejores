import { Button } from "@/core/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/core/components/ui/combobox";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { GroupMember } from "@/features/courses/domain/entities/course";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Minus } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Keyboard, View } from "react-native";

const PRIMARY = "#818CF8";

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
    updateGroup,
  } = useCourses();

  const [groupName, setGroupName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [available, setAvailable] = useState<{ userId: string; name: string; email: string }[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!groupId || !courseId || !categoryId) return;
    try {
      setIsLoading(true);

      const [groups, enrolled] = await Promise.all([
        getGroupsByCategory(categoryId),
        getStudentsInCourse(courseId),
      ]);

      const g = groups.find((x) => x._id === groupId);
      if (g) { setGroupName(g.name); setOriginalName(g.name); }

      const grpMembers = await getGroupMembersDetail(groupId);
      setMembers(grpMembers);

      const allMembers = await Promise.all(groups.map((gr) => getGroupMembersDetail(gr._id)));
      const occupiedIds = new Set(allMembers.flat().map((m) => m.userId));

      setAvailable(enrolled.filter((s) => !occupiedIds.has(s.userId)));
    } catch (e: any) {
      if (!e?.message?.includes("401")) Alert.alert("Error", e.message);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, courseId, categoryId]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () =>
      query.trim()
        ? available.filter(
            (s) =>
              s.name.toLowerCase().includes(query.toLowerCase()) ||
              s.email.toLowerCase().includes(query.toLowerCase()),
          )
        : available,
    [available, query],
  );

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!groupName.trim() || groupName.trim() === originalName) return;
    try {
      setIsSaving(true);
      const groups = await getGroupsByCategory(categoryId!);
      const g = groups.find((x) => x._id === groupId);
      if (g) await updateGroup({ ...g, name: groupName.trim() });
      setOriginalName(groupName.trim());
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo actualizar el grupo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelect = async (userId: string | undefined) => {
    if (!userId) return;
    try {
      await addMemberToGroup(userId, groupId!);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo añadir el miembro.");
    }
  };

  const handleRemove = async (userGroupId: string) => {
    setRemoving(userGroupId);
    try {
      await removeMemberFromGroup(userGroupId);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo remover el miembro.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="w-full max-w-lg mx-auto flex-1 px-5 pt-4 pb-6">

        {/* ── Header ── */}
        <View className="flex-row items-center mb-6">
          <Button
            variant="secondary"
            onPress={() => router.back()}
            className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
          >
            <ArrowLeft size={20} color="#1F265E" />
          </Button>
          <Text variant="h4" className="text-center flex-1">GRUPO</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* ── Nombre ── */}
        <View className="gap-1.5 mb-5">
          <Label>Nombre</Label>
          <Input value={groupName} onChangeText={setGroupName} placeholder="Nombre del grupo" />
        </View>

        {/* ── Combobox añadir miembro ── */}
        <View className="gap-1.5 mb-5" style={{ zIndex: 10 }}>
          <Label>Añadir miembro</Label>
          <Combobox value={undefined} onValueChange={handleSelect}>
            <ComboboxInput placeholder="Buscar por nombre o correo..." filterFn={setQuery} />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty shown={filtered.length === 0} />
                {filtered.map((s) => (
                  <ComboboxItem key={s.userId} value={s.userId} label={s.name} />
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </View>

        {/* ── Miembros header ── */}
        <Text variant="small" className="text-muted-foreground tracking-wide uppercase mb-3">
          Miembros ({members.length})
        </Text>
        <View className="h-px bg-muted mb-1" />

        {/* ── Lista ── */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.userGroupId}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <View className="py-10 items-center">
                <Text variant="muted">Sin miembros aún</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View>
                <View className="flex-row items-center py-4">
                  <View className="flex-1">
                    <Text className="font-semibold text-[15px] text-foreground">{item.name}</Text>
                    {!!item.email && <Text variant="muted">{item.email}</Text>}
                  </View>
                  <Button
                    variant="secondary"
                    onPress={() => handleRemove(item.userGroupId)}
                    disabled={removing === item.userGroupId}
                    className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
                  >
                    {removing === item.userGroupId
                      ? <ActivityIndicator size="small" color={PRIMARY} />
                      : <Minus size={18} color="#1F265E" />
                    }
                  </Button>
                </View>
                <View className="h-px bg-muted" />
              </View>
            )}
          />
        )}

        {/* ── Guardar ── */}
        <Button
          onPress={handleSave}
          disabled={isSaving || groupName.trim() === originalName}
          className="rounded-full w-full mt-4"
          style={{ paddingVertical: 18 }}
        >
          <Text>{isSaving ? "GUARDANDO..." : "GUARDAR"}</Text>
        </Button>
      </View>
    </View>
  );
}
