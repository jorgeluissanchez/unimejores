import { Button } from "@/core/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/core/components/ui/drawer";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Category, Group, GroupMember } from "@/features/courses/domain/entities/course";
import { GroupModal } from "@/features/courses/presentation/components/group-modal";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { SquarePen, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Keyboard, TouchableOpacity, View } from "react-native";

const PRIMARY = "#818CF8";

type GroupWithMembers = { group: Group; members: GroupMember[] };

type Props = {
  courseId: string;
  category: Category;
  open: boolean;
  onClose: () => void;
  onCategoryUpdated: (cat: Category) => void;
  onCategoryDeleted: (catId: string) => void;
};

export function CategoryDrawer({ courseId, category, open, onClose, onCategoryUpdated, onCategoryDeleted }: Props) {
  const {
    updateCategory,
    deleteCategory,
    getGroupsByCategory,
    getGroupMembersDetail,
    addGroup,
  } = useCourses();
  const [categoryName, setCategoryName] = useState(category.name);
  const [originalName, setOriginalName] = useState(category.name);
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);

  useEffect(() => {
    setCategoryName(category.name);
    setOriginalName(category.name);
  }, [category._id]);

  const load = useCallback(async () => {
    if (!category._id) return;
    try {
      setIsLoading(true);
      const rawGroups = await getGroupsByCategory(category._id);
      const withMembers = await Promise.all(
        rawGroups.map(async (g) => {
          const members = await getGroupMembersDetail(g._id);
          return { group: g, members };
        }),
      );
      setGroups(withMembers);
    } catch (e: any) {
      if (!e?.message?.includes("401")) Alert.alert("Error", e.message);
    } finally {
      setIsLoading(false);
    }
  }, [category._id]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!categoryName.trim() || categoryName.trim() === originalName) return;
    try {
      setIsSaving(true);
      const updated = { ...category, name: categoryName.trim() };
      await updateCategory(updated);
      setOriginalName(categoryName.trim());
      onCategoryUpdated(updated);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCategory(category._id);
      onCategoryDeleted(category._id);
      onClose();
    } catch (e: any) {
      setConfirmDelete(false);
      Alert.alert("Error", e.message ?? "No se pudo eliminar.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
            Categoría
          </DrawerTitle>

          <View style={{ flex: 1 }}>
            {/* Static header area */}
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              {/* Header row */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
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

              {/* Nombre */}
              <View className="gap-1.5" style={{ marginBottom: 20 }}>
                <Label>Nombre</Label>
                <Input value={categoryName} onChangeText={setCategoryName} placeholder="Nombre de la categoría" />
              </View>

              {/* Grupos header */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Text variant="small" className="text-primary tracking-widest uppercase flex-1">Grupos</Text>
                <Button
                  onPress={() => setIsCreateOpen(true)}
                  className="rounded-full"
                  style={{ paddingHorizontal: 16, paddingVertical: 10 }}
                >
                  <Text>Añadir</Text>
                </Button>
              </View>

              <View className="h-px bg-muted" />
            </View>

            {/* Groups list */}
            {isLoading ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator color={PRIMARY} />
              </View>
            ) : (
              <FlatList
                data={groups}
                keyExtractor={(item) => item.group._id}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <Text variant="muted">Sin grupos aún</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View>
                    <TouchableOpacity
                      onPress={() => setEditGroup(item.group)}
                      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16 }}
                    >
                      <View style={{ flex: 1 }}>
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
                      <View style={{ width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6" }}>
                        <SquarePen size={18} color="#1F265E" />
                      </View>
                    </TouchableOpacity>
                    <View className="h-px bg-muted" />
                  </View>
                )}
              />
            )}

            {/* Fixed footer */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, borderTopWidth: 1, borderTopColor: "#F3F4F6", gap: 8 }}>
              {confirmDelete ? (
                <>
                  <Text style={{ textAlign: "center", fontSize: 13, color: "#EF4444", fontWeight: "600" }}>
                    ¿Eliminar "{originalName}"?
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Button variant="secondary" onPress={() => setConfirmDelete(false)} className="flex-1 rounded-full" style={{ paddingVertical: 14 }} disabled={isDeleting}>
                      <Text>Cancelar</Text>
                    </Button>
                    <Button variant="destructive" onPress={handleDelete} className="flex-1 rounded-full" style={{ paddingVertical: 14 }} disabled={isDeleting}>
                      <Text>{isDeleting ? "..." : "Eliminar"}</Text>
                    </Button>
                  </View>
                </>
              ) : (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button
                    onPress={handleSave}
                    disabled={isSaving || categoryName.trim() === originalName}
                    className="flex-1 rounded-full"
                    style={{ paddingVertical: 14 }}
                  >
                    <Text>{isSaving ? "..." : "Guardar"}</Text>
                  </Button>
                  <Button
                    variant="destructive"
                    onPress={() => setConfirmDelete(true)}
                    className="flex-1 rounded-full"
                    style={{ paddingVertical: 14 }}
                  >
                    <Text>Eliminar</Text>
                  </Button>
                </View>
              )}
            </View>
          </View>
        </DrawerContent>
      </Drawer>

      <GroupModal
        mode="create"
        categoryId={category._id}
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(group) => {
          setGroups((prev) => [...prev, { group, members: [] }]);
          setIsCreateOpen(false);
        }}
      />
      {editGroup && (
        <GroupModal
          mode="edit"
          group={editGroup}
          courseId={courseId}
          categoryId={category._id}
          open={!!editGroup}
          onClose={() => setEditGroup(null)}
          onUpdated={() => {
            load();
            setEditGroup(null);
          }}
        />
      )}
    </>
  );
}
