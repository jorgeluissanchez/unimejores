import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Group, GroupMember } from "@/features/courses/domain/entities/course";
import { GroupModal } from "@/features/courses/presentation/components/group-modal";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { SquarePen, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  View,
} from "react-native";

const PRIMARY = "#818CF8";

type GroupWithMembers = { group: Group; members: GroupMember[] };

type Props = {
  courseId: string;
  categoryId: string;
  onClose: () => void;
};

export function ProfessorCategoryGroupsScreen({ courseId, categoryId, onClose }: Props) {
  const {
    getCategoriesByCourse,
    updateCategory,
    deleteCategory,
    getGroupsByCategory,
    getGroupMembersDetail,
  } = useCourses();

  const [categoryName, setCategoryName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);

  const load = useCallback(async () => {
    if (!categoryId) return;
    try {
      setIsLoading(true);
      const rawGroups = await getGroupsByCategory(categoryId);
      const withMembers = await Promise.all(
        rawGroups.map(async (g) => {
          const members = await getGroupMembersDetail(g._id);
          return { group: g, members };
        }),
      );
      setGroups(withMembers);
    } catch (e: any) {
      if (e?.message?.includes("401")) return;
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    load();
    getCategoriesByCourse(courseId ?? "").then((cats) => {
      const cat = cats.find((c) => c._id === categoryId);
      if (cat) { setCategoryName(cat.name); setOriginalName(cat.name); }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!categoryName.trim() || categoryName.trim() === originalName) return;
    try {
      setIsSaving(true);
      const cats = await getCategoriesByCourse(courseId ?? "");
      const cat = cats.find((c) => c._id === categoryId);
      if (cat) await updateCategory({ ...cat, name: categoryName.trim() });
      setOriginalName(categoryName.trim());
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1">
      <View className="w-full max-w-lg mx-auto flex-1 px-5 pt-4 pb-6">

        {/* ── Header ── */}
        <View className="flex-row items-center mb-6">
          <Button
            variant="secondary"
            onPress={onClose}
            className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
          >
            <X size={20} color="#1F265E" />
          </Button>
          <Text variant="h4" className="text-center flex-1">CATEGORÍA</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* ── Nombre ── */}
        <View className="gap-1.5 mb-5">
          <Label>Nombre</Label>
          <Input value={categoryName} onChangeText={setCategoryName} placeholder="Nombre de la categoría" />
        </View>

        {/* ── Grupos header ── */}
        <View className="flex-row items-center gap-2 mb-3">
          <Text variant="small" className="text-primary tracking-widest uppercase flex-1">Grupos</Text>
          <Button onPress={() => setIsCreateOpen(true)}>
            <Text>Añadir</Text>
          </Button>
        </View>

        <View className="h-[1px] bg-muted mb-1" />

        {/* ── Lista ── */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.group._id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <View className="py-10 items-center">
                <Text variant="muted">Sin grupos aún</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-1">
                  <Text className="font-bold text-[15px] text-foreground">
                    {item.group.name.toUpperCase()}
                  </Text>
                  {item.members.length > 0 ? (
                    <Text variant="muted" numberOfLines={1}>
                      {item.members.map((m) => m.name).join(", ")}
                    </Text>
                  ) : (
                    <Text className="text-xs text-muted-foreground/50 mt-0.5">Sin miembros</Text>
                  )}
                </View>
                <Button
                  variant="secondary"
                  className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
                  onPress={() => setEditGroup(item.group)}
                >
                  <SquarePen size={18} color="#1F265E" />
                </Button>
              </View>
            )}
          />
        )}

        {/* ── Guardar nombre categoría ── */}
        <Button
          onPress={handleSave}
          disabled={isSaving || categoryName.trim() === originalName}
          className="rounded-full w-full mt-4"
        >
          <Text>{isSaving ? "GUARDANDO..." : "GUARDAR"}</Text>
        </Button>
        {confirmDelete ? (
          <View className="gap-2 mt-3">
            <Text className="text-center text-sm text-destructive font-semibold">¿Eliminar "{originalName}"?</Text>
            <View className="flex-row gap-2">
              <Button variant="secondary" onPress={() => setConfirmDelete(false)} className="flex-1 rounded-full" disabled={isDeleting}>
                <Text>Cancelar</Text>
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-full"
                disabled={isDeleting}
                onPress={async () => {
                  try {
                    setIsDeleting(true);
                    await deleteCategory(categoryId);
                    onClose();
                  } catch (e: any) {
                    setConfirmDelete(false);
                    Alert.alert("Error", e.message ?? "No se pudo eliminar.");
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                <Text>{isDeleting ? "..." : "Eliminar"}</Text>
              </Button>
            </View>
          </View>
        ) : (
          <Button
            variant="destructive"
            onPress={() => setConfirmDelete(true)}
            className="rounded-full w-full mt-3"
          >
            <Text>ELIMINAR CATEGORÍA</Text>
          </Button>
        )}
      </View>

      {/* ── Modal: Crear grupo ── */}
      <GroupModal
        mode="create"
        categoryId={categoryId}
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => { setIsCreateOpen(false); load(); }}
      />

      {/* ── Modal: Editar grupo ── */}
      {editGroup && (
        <GroupModal
          mode="edit"
          group={editGroup}
          courseId={courseId}
          categoryId={categoryId}
          open={!!editGroup}
          onClose={() => setEditGroup(null)}
          onUpdated={() => load()}
        />
      )}
    </View>
  );
}
