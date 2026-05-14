import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Text } from "@/core/components/ui/text";
import { Group, GroupMember } from "@/features/professor/domain/entities/professor";
import { AddGroupForm } from "@/features/professor/presentation/components/add-group-form";
import { useProfessor } from "@/features/professor/presentation/context/professor-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, SquarePen } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  SafeAreaView,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#818CF8";

type GroupWithMembers = { group: Group; members: GroupMember[] };

export function ProfessorCategoryGroupsScreen() {
  const { courseId, categoryId } = useLocalSearchParams<{ courseId: string; categoryId: string }>();
  const router = useRouter();

  const goToGroup = (groupId: string) =>
    router.push(
      `/professor-course/${courseId}/category/${categoryId}/group/${groupId}` as RelativePathString,
    );
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
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="w-full max-w-lg mx-auto flex-1" style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 24 }}>
          <Button
            onPress={() => router.back()}
            className="rounded-full w-[50px] h-[50px] p-0 items-center justify-center mr-4"
            style={{ backgroundColor: "#E6E7F2" }}
          >
            <ArrowLeft size={20} color="#1F265E" />
          </Button>
          <Text style={{ fontSize: 18, fontWeight: "700", letterSpacing: 1, color: "#111827" }}>CATEGORIA</Text>
        </View>

        <Input
          value={categoryName}
          onChangeText={setCategoryName}
          placeholder="Nombre"
          style={{ marginBottom: 20 }}
        />

        <View className="flex-row items-center gap-2 mb-3">
          <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 13, letterSpacing: 1, flex: 1 }}>GRUPOS</Text>
          <Button size="sm" variant="secondary" onPress={handleImportCsv} disabled={isImporting}>
            {isImporting ? <ActivityIndicator size="small" color={PRIMARY} /> : <Text>IMPORTAR</Text>}
          </Button>
          <Button size="sm" onPress={() => setIsCreatingGroup(true)}>
            <Text>Crear Grupo</Text>
          </Button>
        </View>

        {isCreatingGroup && (
          <View style={{ marginBottom: 12 }}>
            <AddGroupForm
              categoryId={categoryId!}
              onCancel={async () => { setIsCreatingGroup(false); await load(); }}
            />
          </View>
        )}

        <View style={{ height: 1, backgroundColor: "#E5E7EB", marginBottom: 4 }} />

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.group._id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={<Text style={{ color: "#9CA3AF", textAlign: "center", marginTop: 24 }}>Sin grupos aún</Text>}
            renderItem={({ item }) => (
              <View>
                <TouchableOpacity
                  onPress={() => goToGroup(item.group._id)}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16 }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 15, color: "#111827" }}>{item.group.name.toUpperCase()}</Text>
                    {item.members.length > 0 ? (
                      <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }} numberOfLines={1}>
                        {item.members.map((m) => m.name).join(", ")}
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 12, color: "#D1D5DB", marginTop: 2 }}>Sin miembros</Text>
                    )}
                  </View>
                  <View
                    className="w-[50px] h-[50px] rounded-2xl items-center justify-center"
                    style={{ backgroundColor: "#E6E7F2" }}
                  >
                    <SquarePen size={18} color="#1F265E" />
                  </View>
                </TouchableOpacity>
                <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
              </View>
            )}
          />
        )}

        <Button
          onPress={handleSave}
          disabled={isSaving || categoryName.trim() === originalName}
          size="lg"
          className="rounded-full mb-3"
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text>GUARDAR</Text>}
        </Button>
      </View>
    </SafeAreaView>
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
