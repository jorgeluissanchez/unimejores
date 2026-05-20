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

type CreateProps = {
  mode: "create";
  categoryId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

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
  const { addGroup, updateGroup, deleteGroup } = useCourses();

  const [name, setName] = useState(props.mode === "edit" ? props.group.name : "");
  const [originalName, setOriginalName] = useState(props.mode === "edit" ? props.group.name : "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSaveDisabled = props.mode === "create"
    ? isSaving || !name.trim()
    : isSaving || name.trim() === originalName;

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!name.trim()) return;
    if (props.mode === "create") {
      try {
        setIsSaving(true);
        await addGroup({ name: name.trim(), category_id: props.categoryId });
        props.onCreated();
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "No se pudo crear el grupo.");
      } finally {
        setIsSaving(false);
      }
    } else {
      if (name.trim() === originalName) return;
      try {
        setIsSaving(true);
        await updateGroup({ ...props.group, name: name.trim() });
        setOriginalName(name.trim());
        props.onUpdated();
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "No se pudo guardar.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDelete = async () => {
    if (props.mode !== "edit") return;
    try {
      setIsDeleting(true);
      await deleteGroup(props.group._id);
      props.onUpdated();
      props.onClose();
    } catch (e: any) {
      setConfirmDelete(false);
      Alert.alert("Error", e.message ?? "No se pudo eliminar el grupo.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={(o) => { if (!o) props.onClose(); }}>
      <DialogContent className="p-0 gap-0 sm:w-[480px] sm:max-w-[480px]">
        <DialogTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
          {props.mode === "create" ? "Crear grupo" : "Editar grupo"}
        </DialogTitle>

        <View style={{ flexDirection: "column" }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24 }}
            style={Platform.OS === "web"
              ? { maxHeight: "60vh", scrollbarWidth: "none", msOverflowStyle: "none" } as any
              : undefined}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <Button variant="secondary" onPress={props.onClose} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">
                {props.mode === "create" ? "CREAR GRUPO" : "GRUPO"}
              </Text>
              <View style={{ width: 50 }} />
            </View>

            {/* Nombre */}
            <View className="gap-1.5">
              <Label>Nombre</Label>
              <Input
                value={name}
                onChangeText={setName}
                placeholder={props.mode === "create" ? "Ej: Grupo A" : "Nombre del grupo"}
                autoFocus={props.mode === "create"}
              />
            </View>

            {/* Edit-only: members */}
            {props.mode === "edit" && (
              <MembersSection
                group={props.group}
                courseId={props.courseId}
                categoryId={props.categoryId}
              />
            )}
          </ScrollView>

          {/* Fixed footer */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, borderTopWidth: 1, borderTopColor: "#F3F4F6", gap: 8 }}>
            {confirmDelete ? (
              <>
                <Text style={{ textAlign: "center", fontSize: 13, color: "#EF4444", fontWeight: "600" }}>
                  ¿Eliminar "{props.mode === "edit" ? props.group.name : ""}"?
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
                <Button onPress={handleSave} disabled={isSaveDisabled} className="flex-1 rounded-full" style={{ paddingVertical: 14 }}>
                  <Text>{isSaving ? "..." : props.mode === "create" ? "Crear" : "Guardar"}</Text>
                </Button>
                {props.mode === "edit" && (
                  <Button variant="destructive" onPress={() => setConfirmDelete(true)} className="flex-1 rounded-full" style={{ paddingVertical: 14 }}>
                    <Text>Eliminar</Text>
                  </Button>
                )}
              </View>
            )}
          </View>
        </View>
      </DialogContent>
    </Dialog>
  );
}

// ─── Members section (edit mode only) ─────────────────────────────────────────

function MembersSection({ group, courseId, categoryId }: { group: Group; courseId: string; categoryId: string }) {
  const {
    getGroupsByCategory,
    getGroupMembersDetail,
    addMemberToGroup,
    removeMemberFromGroup,
    getStudentsInCourse,
  } = useCourses();

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [available, setAvailable] = useState<{ userId: string; name: string; email: string }[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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

  const handleSelect = async (userId: string | undefined) => {
    if (!userId) return;
    try {
      await addMemberToGroup(userId, group._id);
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
    <View style={{ gap: 16, marginTop: 20 }}>
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

      <View style={{ gap: 8 }}>
        <Text variant="small" className="text-muted-foreground tracking-wide uppercase">
          Miembros ({members.length})
        </Text>
        <View className="h-px bg-muted" />
        {isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : members.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <Text variant="muted">Sin miembros aún</Text>
          </View>
        ) : (
          members.map((m, idx) => (
            <View key={m.userGroupId}>
              <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}>
                <View style={{ flex: 1 }}>
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
