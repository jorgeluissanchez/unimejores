import { Button } from "@/core/components/ui/button";
import { Card, CardContent } from "@/core/components/ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/core/components/ui/drawer";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Category } from "@/features/professor/domain/entities/professor";
import { ProfessorRepository } from "@/features/professor/domain/repositories/professor-repository";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Keyboard, View } from "react-native";

export function ProfessorCategoriesScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const di = useDI();
  const { expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<ProfessorRepository>(TOKENS.ProfessorRepo), [di]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newNameError, setNewNameError] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await repo.getCategoriesByCourse(courseId!);
      setCategories(data);
    } catch (e: any) {
      if (e?.message?.includes("401")) { await expireSession(); return; }
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [courseId]);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async () => {
    Keyboard.dismiss();
    if (!newName.trim()) { setNewNameError("El nombre es obligatorio"); return; }
    try {
      await repo.addCategory({ name: newName.trim(), description: newDesc.trim(), course_id: courseId! });
      setNewName(""); setNewDesc(""); setNewNameError("");
      setIsAddOpen(false);
      await load();
    } catch (e: any) { setError(e.message); }
  };

  const handleUpdate = async () => {
    if (!editTarget || !editName.trim()) return;
    try {
      await repo.updateCategory({ ...editTarget, name: editName.trim(), description: editDesc.trim() });
      setEditTarget(null);
      await load();
    } catch (e: any) { setError(e.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      await repo.deleteCategory(id);
      await load();
    } catch (e: any) { setError(e.message); }
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setEditName(cat.name);
    setEditDesc(cat.description);
  };

  if (isLoading && categories.length === 0) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>;
  }

  return (
    <View className="flex-1 p-4">
      <View className="mb-3 flex-row items-center gap-2">
        <Input className="flex-1" value={search} onChangeText={setSearch} placeholder="Buscar por nombre..." />
        <Button size="sm" onPress={() => setIsAddOpen(true)}><Text>Agregar</Text></Button>
      </View>

      {!!error && <Text className="text-destructive mb-2">{error}</Text>}

      {filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Sin categorías</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ gap: 12, paddingBottom: 88 }}
          renderItem={({ item }) => (
            <Card>
              <CardContent className="py-4">
                <View className="flex-row items-center gap-2">
                  <View className="flex-1" onTouchEnd={() => router.push(`/professor-course/${courseId}/category/${item._id}` as RelativePathString)}>
                    <Text className="font-semibold">{item.name}</Text>
                    {!!item.description && <Text className="text-sm text-muted-foreground">{item.description}</Text>}
                  </View>
                  <Button size="sm" variant="outline" onPress={() => openEdit(item)}><Text>Editar</Text></Button>
                  <Button size="sm" variant="destructive" onPress={() => handleDelete(item._id)}><Text>Eliminar</Text></Button>
                </View>
              </CardContent>
            </Card>
          )}
        />
      )}

      <Drawer open={isAddOpen} onOpenChange={(o) => { if (!o) setIsAddOpen(false); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Agregar categoría</DrawerTitle>
            <DrawerDescription>Crea una nueva categoría para este curso</DrawerDescription>
          </DrawerHeader>
          <View className="px-4 mt-4 gap-4 pb-8">
            <View className="gap-1.5">
              <Label>Nombre</Label>
              <Input value={newName} onChangeText={(v) => { setNewName(v); setNewNameError(""); }} placeholder="Ej: Unidad 1" className={newNameError ? "border-destructive" : undefined} />
              {!!newNameError && <Text className="text-sm text-destructive">{newNameError}</Text>}
            </View>
            <View className="gap-1.5">
              <Label>Descripción</Label>
              <Textarea value={newDesc} onChangeText={setNewDesc} placeholder="Descripción (opcional)" />
            </View>
            <View className="flex-row justify-end gap-2">
              <Button variant="outline" onPress={() => setIsAddOpen(false)}><Text>Cancelar</Text></Button>
              <Button onPress={handleAdd}><Text>Guardar</Text></Button>
            </View>
          </View>
        </DrawerContent>
      </Drawer>

      <Drawer open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar categoría</DrawerTitle>
            <DrawerDescription>Modifica los datos de la categoría</DrawerDescription>
          </DrawerHeader>
          <View className="px-4 mt-4 gap-4 pb-8">
            <View className="gap-1.5">
              <Label>Nombre</Label>
              <Input value={editName} onChangeText={setEditName} />
            </View>
            <View className="gap-1.5">
              <Label>Descripción</Label>
              <Textarea value={editDesc} onChangeText={setEditDesc} />
            </View>
            <View className="flex-row justify-end gap-2">
              <Button variant="outline" onPress={() => setEditTarget(null)}><Text>Cancelar</Text></Button>
              <Button onPress={handleUpdate}><Text>Actualizar</Text></Button>
            </View>
          </View>
        </DrawerContent>
      </Drawer>
    </View>
  );
}
