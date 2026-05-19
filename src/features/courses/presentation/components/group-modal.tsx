import { Button } from "@/core/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/core/components/ui/combobox";
import { Dialog, DialogContent, DialogTitle } from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Group, GroupMember } from "@/features/courses/domain/entities/course";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { Minus, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, Platform, ScrollView, View } from "react-native";

const PRIMARY = "#818CF8";

// ─── Create mode ───────────────────────────────────────────────────────────────

type CreateProps = {
  mode: "create";
  categoryId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

// ─── Edit mode ─────────────────────────────────────────────────────────────────

type EditProps = {
  mode: "edit";
  group: Group;
  courseId: string;
  categoryId: string;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

type Props = CreateProps | EditProps;

export function GroupModal(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={(o) => { if (!o) props.onClose(); }}>
      <DialogContent
        className="p-0 gap-0 sm:w-[480px] sm:max-w-[480px]"
      >
        <DialogTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
          {props.mode === "create" ? "Crear grupo" : "Editar grupo"}
        </DialogTitle>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24 }}
          style={Platform.OS === "web"
            ? { maxHeight: "80vh", scrollbarWidth: "none", msOverflowStyle: "none" } as any
            : undefined}
          keyboardShouldPersistTaps="handled"
        >
          {props.mode === "create"
            ? <CreateContent {...props} />
            : <EditContent {...props} />
          }
        </ScrollView>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create content ────────────────────────────────────────────────────────────

function CreateContent({ categoryId, onClose, onCreated }: CreateProps) {
  const { addGroup } = useCourses();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    Keyboard.dismiss();
    if (!name.trim()) return;
    try {
      setIsSaving(true);
      await addGroup({ name: name.trim(), category_id: categoryId });
      onCreated();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo crear el grupo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="gap-4">
      <View className="flex-row items-center mb-2">
        <Button variant="secondary" onPress={onClose} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
          <X size={20} color="#1F265E" />
        </Button>
        <Text variant="h4" className="text-center flex-1">CREAR GRUPO</Text>
        <View style={{ width: 50 }} />
      </View>
      <View className="gap-1.5">
        <Label>Nombre</Label>
        <Input value={name} onChangeText={setName} placeholder="Ej: Grupo A" autoFocus />
      </View>
      <Button onPress={handleCreate} disabled={isSaving || !name.trim()} className="rounded-full w-full" style={{ paddingVertical: 18 }}>
        <Text>{isSaving ? "CREANDO..." : "CREAR"}</Text>
      </Button>
    </View>
  );
}

// ─── Edit content ──────────────────────────────────────────────────────────────

function EditContent({ group, courseId, categoryId, onClose, onUpdated }: EditProps) {
  const {
    getGroupsByCategory,
    getGroupMembersDetail,
    updateGroup,
    deleteGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    getStudentsInCourse,
  } = useCourses();

  const [name, setName] = useState(group.name);
  const [originalName, setOriginalName] = useState(group.name);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [available, setAvailable] = useState<{ userId: string; name: string; email: string }[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const [groups, enrolled] = await Promise.all([
        getGroupsByCategory(categoryId),
        getStudentsInCourse(courseId),
      ]);

      const grpMembers = await getGroupMembersDetail(group._id);
      setMembers(grpMembers);

      const allMembers = await Promise.all(groups.map((gr) => getGroupMembersDetail(gr._id)));
      const occupiedIds = new Set(allMembers.flat().map((m) => m.userId));
      setAvailable(enrolled.filter((s) => !occupiedIds.has(s.userId)));
    } catch (e: any) {
      if (!e?.message?.includes("401")) Alert.alert("Error", e.message);
    } finally {
      setIsLoading(false);
    }
  }, [group._id, courseId, categoryId]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => query.trim()
      ? available.filter((s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.email.toLowerCase().includes(query.toLowerCase()))
      : available,
    [available, query],
  );

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!name.trim() || name.trim() === originalName) return;
    try {
      setIsSaving(true);
      await updateGroup({ ...group, name: name.trim() });
      setOriginalName(name.trim());
      onUpdated();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelect = async (userId: string | undefined) => {
    if (!userId) return;
    try {
      await addMemberToGroup(userId, group._id);
      await load();
      onUpdated();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo añadir el miembro.");
    }
  };

  const handleRemove = async (userGroupId: string) => {
    setRemoving(userGroupId);
    try {
      await removeMemberFromGroup(userGroupId);
      await load();
      onUpdated();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo remover el miembro.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <View className="gap-4">
      {/* Header */}
      <View className="flex-row items-center mb-2">
        <Button variant="secondary" onPress={onClose} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
          <X size={20} color="#1F265E" />
        </Button>
        <Text variant="h4" className="text-center flex-1">GRUPO</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Nombre */}
      <View className="gap-1.5">
        <Label>Nombre</Label>
        <Input value={name} onChangeText={setName} placeholder="Nombre del grupo" />
      </View>

      <Button
        onPress={handleSave}
        disabled={isSaving || name.trim() === originalName}
        className="rounded-full w-full"
        style={{ paddingVertical: 18 }}
      >
        <Text>{isSaving ? "GUARDANDO..." : "GUARDAR"}</Text>
      </Button>

      <Button
        variant="destructive"
        onPress={() =>
          Alert.alert(
            "Eliminar grupo",
            `¿Eliminar "${group.name}"? Esta acción no se puede deshacer.`,
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                  try {
                    await deleteGroup(group._id);
                    onUpdated();
                    onClose();
                  } catch (e: any) {
                    Alert.alert("Error", e.message ?? "No se pudo eliminar el grupo.");
                  }
                },
              },
            ]
          )
        }
        className="rounded-full w-full"
        style={{ paddingVertical: 18 }}
      >
        <Text>ELIMINAR GRUPO</Text>
      </Button>

      {/* Combobox añadir miembro */}
      <View className="gap-1.5" style={{ zIndex: 10 }}>
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

      {/* Miembros */}
      <View className="gap-2">
        <Text variant="small" className="text-muted-foreground tracking-wide uppercase">
          Miembros ({members.length})
        </Text>
        <View className="h-px bg-muted" />

        {isLoading ? (
          <View className="py-6 items-center">
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : members.length === 0 ? (
          <View className="py-6 items-center">
            <Text variant="muted">Sin miembros aún</Text>
          </View>
        ) : (
          members.map((m, idx) => (
            <View key={m.userGroupId}>
              <View className="flex-row items-center py-3">
                <View className="flex-1">
                  <Text className="font-semibold text-[15px] text-foreground">{m.name}</Text>
                  {!!m.email && <Text variant="muted">{m.email}</Text>}
                </View>
                <Button
                  variant="secondary"
                  onPress={() => handleRemove(m.userGroupId)}
                  disabled={removing === m.userGroupId}
                  className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
                >
                  {removing === m.userGroupId
                    ? <ActivityIndicator size="small" color={PRIMARY} />
                    : <Minus size={18} color="#1F265E" />
                  }
                </Button>
              </View>
              {idx < members.length - 1 && <View className="h-px bg-muted" />}
            </View>
          ))
        )}
      </View>
    </View>
  );
}
