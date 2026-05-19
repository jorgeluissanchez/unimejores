import { Button } from "@/core/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/core/components/ui/drawer";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { parseCsvLine } from "@/core/lib/utils";
import { Category, Group, GroupMember } from "@/features/professor/domain/entities/professor";
import { GroupModal } from "@/features/professor/presentation/components/group-modal";
import { useProfessor } from "@/features/professor/presentation/context/professor-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { CloudUpload, Plus, SquarePen, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Keyboard, TouchableOpacity, View } from "react-native";

const PRIMARY = "#818CF8";

type GroupWithMembers = { group: Group; members: GroupMember[] };

type Props = {
  courseId: string;
  category: Category;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

export function CategoryDrawer({ courseId, category, open, onClose, onUpdated }: Props) {
  const {
    getCategoriesByCourse,
    updateCategory,
    getGroupsByCategory,
    getGroupMembersDetail,
    getUserByEmail,
    getMembersByGroup,
    addMemberToGroup,
    addGroup,
  } = useProfessor();

  const [categoryName, setCategoryName] = useState(category.name);
  const [originalName, setOriginalName] = useState(category.name);
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);

  // Reset when category changes
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
      await updateCategory({ ...category, name: categoryName.trim() });
      setOriginalName(categoryName.trim());
      onUpdated();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "*/*"] });
      if (result.canceled || !result.assets?.[0]) return;
      setIsImporting(true);
      const content = await new FileSystem.File(result.assets[0].uri).text();
      await parseCategoryGroupsCsv(content);
      await load();
      onUpdated();
      Alert.alert("Importación completa", "Grupos creados correctamente.");
    } catch (e: any) {
      Alert.alert("Error al importar", e.message ?? "No se pudo procesar el archivo.");
    } finally {
      setIsImporting(false);
    }
  };

  const parseCategoryGroupsCsv = async (csv: string) => {
    const text = csv.replace(/^﻿/, "");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("El CSV está vacío o no tiene datos.");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const grpIdx = headers.findIndex((h) => h.includes("group") || h.includes("grupo"));
    const emailIdx = headers.findIndex((h) => h.includes("email") || h.includes("username") || h.includes("correo"));
    if (grpIdx < 0) throw new Error("El CSV debe tener columna 'Group Name' o 'Grupo'.");
    const existingGroups = await getGroupsByCategory(category._id);
    const groupMap = new Map(existingGroups.map((g) => [g.name.toLowerCase().trim(), g]));
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const grpName = cols[grpIdx]?.trim();
      const email = emailIdx >= 0 ? cols[emailIdx]?.trim().toLowerCase() : undefined;
      if (!grpName) continue;
      if (!groupMap.has(grpName.toLowerCase())) {
        await addGroup({ name: grpName, category_id: category._id });
        const updated = await getGroupsByCategory(category._id);
        updated.forEach((g) => groupMap.set(g.name.toLowerCase().trim(), g));
      }
      const group = groupMap.get(grpName.toLowerCase())!;
      if (email) {
        const user = await getUserByEmail(email);
        if (user) {
          const members = await getMembersByGroup(group._id);
          if (!members.some((m) => m.userId === user.userId)) {
            await addMemberToGroup(user.userId, group._id);
          }
        }
      }
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
            Categoría
          </DrawerTitle>
          <View className="px-5 pt-4 pb-16 flex-1">
            {/* Header */}
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

            {/* Nombre */}
            <View className="gap-1.5 mb-5">
              <Label>Nombre</Label>
              <Input value={categoryName} onChangeText={setCategoryName} placeholder="Nombre de la categoría" />
            </View>

            {/* Grupos header */}
            <View className="flex-row items-center gap-2 mb-3">
              <Text variant="small" className="text-primary tracking-widest uppercase flex-1">Grupos</Text>
              <Button
                variant="secondary"
                onPress={handleImportCsv}
                disabled={isImporting}
                className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
              >
                {isImporting
                  ? <ActivityIndicator size="small" color={PRIMARY} />
                  : <CloudUpload size={18} color="#1F265E" />
                }
              </Button>
              <Button
                onPress={() => setIsCreateOpen(true)}
                className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
              >
                <Plus size={18} color="#fff" />
              </Button>
            </View>

            <View className="h-px bg-muted mb-1" />

            {/* Lista grupos */}
            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={PRIMARY} />
              </View>
            ) : (
              <FlatList
                data={groups}
                keyExtractor={(item) => item.group._id}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                ListEmptyComponent={
                  <View className="py-10 items-center">
                    <Text variant="muted">Sin grupos aún</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View>
                    <TouchableOpacity
                      onPress={() => setEditGroup(item.group)}
                      className="flex-row items-center py-4"
                    >
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
                      <View className="w-[50px] h-[50px] rounded-2xl items-center justify-center bg-secondary">
                        <SquarePen size={18} color="#1F265E" />
                      </View>
                    </TouchableOpacity>
                    <View className="h-px bg-muted" />
                  </View>
                )}
              />
            )}

            {/* Guardar */}
            <Button
              onPress={handleSave}
              disabled={isSaving || categoryName.trim() === originalName}
              className="rounded-full w-full mt-4"
              style={{ paddingVertical: 18 }}
            >
              <Text>{isSaving ? "GUARDANDO..." : "GUARDAR"}</Text>
            </Button>
          </View>
        </DrawerContent>
      </Drawer>

      {/* Modales de grupo (fuera del Drawer para evitar anidación) */}
      <GroupModal
        mode="create"
        categoryId={category._id}
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => { setIsCreateOpen(false); load(); onUpdated(); }}
      />
      {editGroup && (
        <GroupModal
          mode="edit"
          group={editGroup}
          courseId={courseId}
          categoryId={category._id}
          open={!!editGroup}
          onClose={() => setEditGroup(null)}
          onUpdated={() => { load(); onUpdated(); }}
        />
      )}
    </>
  );
}

