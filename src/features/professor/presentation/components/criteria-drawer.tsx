import { Button } from "@/core/components/ui/button";
import { Card, CardContent } from "@/core/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/core/components/ui/drawer";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Criterium } from "@/features/professor/domain/entities/professor";
import React, { useState } from "react";
import { FlatList, Keyboard, View } from "react-native";
import { useProfessor } from "../context/professor-context";

type Props = { open: boolean; onClose: () => void };

export function CriteriaDrawer({ open, onClose }: Props) {
  const { myCriteria, addCriterium, updateCriterium, deleteCriterium } = useProfessor();
  const { loggedUser } = useAuth();

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [nameError, setNameError] = useState("");

  const [editTarget, setEditTarget] = useState<Criterium | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleAdd = async () => {
    Keyboard.dismiss();
    if (!newName.trim()) { setNameError("El nombre es obligatorio"); return; }
    if (!loggedUser) return;
    await addCriterium({ name: newName.trim(), description: newDesc.trim(), created_by: loggedUser.userId });
    setNewName("");
    setNewDesc("");
    setNameError("");
  };

  const openEdit = (c: Criterium) => {
    setEditTarget(c);
    setEditName(c.name);
    setEditDesc(c.description);
  };

  const handleUpdate = async () => {
    if (!editTarget || !editName.trim()) return;
    await updateCriterium({ ...editTarget, name: editName.trim(), description: editDesc.trim() });
    setEditTarget(null);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Criterios de evaluación</DrawerTitle>
            <DrawerDescription>Gestiona los criterios que puedes usar en evaluaciones</DrawerDescription>
          </DrawerHeader>
          

          <View className="gap-4 py-4">
            <View className="gap-1.5">
              <Label>Nombre del criterio</Label>
              <Input
                value={newName}
                onChangeText={(v) => {
                  setNewName(v);
                }}
                placeholder="Nombre del criterio"
                className={nameError ? "border-destructive" : undefined}
              />
              {!!nameError && <Text className="text-sm text-destructive">{nameError}</Text>}
            </View>



            <View className="gap-1.5">
              <Label>Descripción del criterio</Label>
              <Input
                value={newDesc}
                onChangeText={(v) => {
                  setNewDesc(v);
                }}
                placeholder="Descripción del criterio"
              />
            </View>

            <Button onPress={handleAdd}><Text>Agregar</Text></Button>

          </View>
          <FlatList
            data={myCriteria}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 32 }}
            ListEmptyComponent={<Text className="text-center text-muted-foreground py-4">Sin criterios aún</Text>}
            renderItem={({ item }) => (
              <Card>
                <CardContent>
                  <View className="flex-row items-center gap-2">
                    <View className="flex-1">
                      <Text className="font-medium">{item.name}</Text>
                      {!!item.description && <Text className="text-sm text-muted-foreground">{item.description}</Text>}
                    </View>

                    <View className="flex-col gap-2">
                      <Button size="sm" variant="outline" onPress={() => openEdit(item)}><Text>Editar</Text></Button>
                      <Button size="sm" variant="destructive" onPress={() => deleteCriterium(item._id)}><Text>Eliminar</Text></Button>
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}
          />
        </DrawerContent>
      </Drawer>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar criterio</DialogTitle></DialogHeader>
          <View className="gap-3 mt-2">
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
        </DialogContent>
      </Dialog>
    </>
  );
}
