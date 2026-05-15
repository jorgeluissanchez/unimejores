import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Group, GroupMember } from "@/features/professor/domain/entities/professor";
import { GroupModal } from "@/features/professor/presentation/components/group-modal";
import { useProfessor } from "@/features/professor/presentation/context/professor-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CloudUpload, Plus, SquarePen } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#818CF8";

type GroupWithMembers = { group: Group; members: GroupMember[] };

export function ProfessorCategoryGroupsScreen() {
  const { courseId, categoryId } = useLocalSearchParams<{ courseId: string; categoryId: string }>();
  const router = useRouter();

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

  const [categoryName, setCategoryName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Modals
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

  const handleImportCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "*/*"] });
      if (result.canceled || !result.assets?.[0]) return;
      setIsImporting(true);
      const content = await new FileSystem.File(result.assets[0].uri).text();
      await parseCategoryGroupsCsv(content);
      await load();
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
    const existingGroups = await getGroupsByCategory(categoryId!);
    const groupMap = new Map(existingGroups.map((g) => [g.name.toLowerCase().trim(), g]));
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const grpName = cols[grpIdx]?.trim();
      const email = emailIdx >= 0 ? cols[emailIdx]?.trim().toLowerCase() : undefined;
      if (!grpName) continue;
      if (!groupMap.has(grpName.toLowerCase())) {
        await addGroup({ name: grpName, category_id: categoryId! });
        const updated = await getGroupsByCategory(categoryId!);
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

        {/* ── Guardar nombre categoría ── */}
        <Button
          onPress={handleSave}
          disabled={isSaving || categoryName.trim() === originalName}
          className="rounded-full w-full mt-4"
          style={{ paddingVertical: 18 }}
        >
          <Text>{isSaving ? "GUARDANDO..." : "GUARDAR"}</Text>
        </Button>
      </View>

      {/* ── Modal: Crear grupo ── */}
      <GroupModal
        mode="create"
        categoryId={categoryId!}
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => { setIsCreateOpen(false); load(); }}
      />

      {/* ── Modal: Editar grupo ── */}
      {editGroup && (
        <GroupModal
          mode="edit"
          group={editGroup}
          courseId={courseId!}
          categoryId={categoryId!}
          open={!!editGroup}
          onClose={() => setEditGroup(null)}
          onUpdated={() => load()}
        />
      )}
    </View>
  );
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}
