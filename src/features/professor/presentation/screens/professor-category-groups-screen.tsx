import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Group, GroupMember } from "@/features/professor/domain/entities/professor";
import { ProfessorRepository } from "@/features/professor/domain/repositories/professor-repository";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#818CF8";

type GroupWithMembers = { group: Group; members: GroupMember[] };

export function ProfessorCategoryGroupsScreen() {
  const { courseId, categoryId } = useLocalSearchParams<{ courseId: string; categoryId: string }>();
  const router = useRouter();
  const di = useDI();
  const { expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<ProfessorRepository>(TOKENS.ProfessorRepo), [di]);

  const [categoryName, setCategoryName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const load = useCallback(async () => {
    if (!categoryId) return;
    try {
      setIsLoading(true);
      const rawGroups = await repo.getGroupsByCategory(categoryId);
      const withMembers = await Promise.all(
        rawGroups.map(async (g) => {
          const members = await repo.getGroupMembersDetail(g._id);
          return { group: g, members };
        }),
      );
      setGroups(withMembers);
    } catch (e: any) {
      if (e?.message?.includes("401")) { await expireSession(); return; }
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]);

  // Load category name from parent (categories list) — we just show from route or fetch
  useEffect(() => {
    load();
    // Fetch category name
    repo.getCategoriesByCourse(courseId ?? "").then((cats) => {
      const cat = cats.find((c) => c._id === categoryId);
      if (cat) { setCategoryName(cat.name); setOriginalName(cat.name); }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!categoryName.trim() || categoryName.trim() === originalName) return;
    try {
      setIsSaving(true);
      const cats = await repo.getCategoriesByCourse(courseId ?? "");
      const cat = cats.find((c) => c._id === categoryId);
      if (cat) await repo.updateCategory({ ...cat, name: categoryName.trim() });
      setOriginalName(categoryName.trim());
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await repo.addGroup({ name: newGroupName.trim(), category_id: categoryId! });
      setNewGroupName("");
      setIsCreatingGroup(false);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    Alert.alert("Eliminar grupo", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive", onPress: async () => {
          try {
            await repo.deleteGroup(groupId);
            await load();
          } catch (e: any) { Alert.alert("Error", e.message); }
        },
      },
    ]);
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

    const existingGroups = await repo.getGroupsByCategory(categoryId!);
    const groupMap = new Map(existingGroups.map((g) => [g.name.toLowerCase().trim(), g]));

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const grpName = cols[grpIdx]?.trim();
      const email = emailIdx >= 0 ? cols[emailIdx]?.trim().toLowerCase() : undefined;
      if (!grpName) continue;

      if (!groupMap.has(grpName.toLowerCase())) {
        await repo.addGroup({ name: grpName, category_id: categoryId! });
        const updated = await repo.getGroupsByCategory(categoryId!);
        updated.forEach((g) => groupMap.set(g.name.toLowerCase().trim(), g));
      }

      const group = groupMap.get(grpName.toLowerCase())!;
      if (email) {
        const user = await repo.getUserByEmail(email);
        if (user) {
          const members = await repo.getMembersByGroup(group._id);
          if (!members.some((m) => m.userId === user.userId)) {
            await repo.addMemberToGroup(user.userId, group._id);
          }
        }
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 24 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", marginRight: 16 }}
          >
            <Ionicons name="arrow-back" size={18} color="#374151" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", letterSpacing: 1, color: "#111827" }}>CATEGORIA</Text>
        </View>

        {/* Name input */}
        <TextInput
          value={categoryName}
          onChangeText={setCategoryName}
          placeholder="Nombre"
          placeholderTextColor="#9CA3AF"
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            color: "#111827",
            marginBottom: 20,
          }}
        />

        {/* Groups section header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 13, letterSpacing: 1, flex: 1 }}>GRUPOS</Text>
          <TouchableOpacity
            onPress={handleImportCsv}
            disabled={isImporting}
            style={{ backgroundColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 }}
          >
            {isImporting ? <ActivityIndicator size="small" color={PRIMARY} /> : <Text style={{ fontWeight: "700", fontSize: 13, color: "#374151" }}>IMPORTAR</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsCreatingGroup(true)}
            style={{ backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Text style={{ fontWeight: "700", fontSize: 13, color: "#fff" }}>Crear Grupo</Text>
          </TouchableOpacity>
        </View>

        {/* New group input */}
        {isCreatingGroup && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 }}>
            <TextInput
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Nombre del grupo"
              placeholderTextColor="#9CA3AF"
              autoFocus
              style={{ flex: 1, backgroundColor: "#F3F4F6", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#111827" }}
            />
            <TouchableOpacity onPress={handleCreateGroup} style={{ backgroundColor: PRIMARY, borderRadius: 10, padding: 10 }}>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsCreatingGroup(false)} style={{ borderRadius: 10, padding: 10 }}>
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
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
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16 }}>
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
                  <TouchableOpacity
                    onPress={() => handleDeleteGroup(item.group._id)}
                    style={{ width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ionicons name="create-outline" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
              </View>
            )}
          />
        )}

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || categoryName.trim() === originalName}
          style={{
            backgroundColor: categoryName.trim() !== originalName ? PRIMARY : "#E5E7EB",
            borderRadius: 30,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : (
            <Text style={{ color: categoryName.trim() !== originalName ? "#fff" : "#9CA3AF", fontWeight: "700", letterSpacing: 1 }}>GUARDAR</Text>
          )}
        </TouchableOpacity>
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
