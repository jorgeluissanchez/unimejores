import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { Criterium } from "@/features/professor/domain/entities/professor";
import React, { useState } from "react";
import { Keyboard, View } from "react-native";
import { useProfessor } from "../context/professor-context";

type Props = { criterium: Criterium; onDone: () => void };

export function EditCriteriumForm({ criterium, onDone }: Props) {
  const { updateCriterium, deleteCriterium } = useProfessor();

  const [name, setName] = useState(criterium.name);
  const [description, setDescription] = useState(criterium.description ?? "");
  const [nameError, setNameError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!name.trim()) { setNameError("El nombre es obligatorio"); return; }
    try {
      setIsSaving(true);
      await updateCriterium({ ...criterium, name: name.trim(), description: description.trim() });
      onDone();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteCriterium(criterium._id);
    onDone();
  };

  return (
    <View className="gap-4">
      <View className="gap-1.5">
        <Label>Nombre</Label>
        <Input
          value={name}
          onChangeText={(v) => { setName(v); setNameError(""); }}
          placeholder="Nombre del criterio"
          className={nameError ? "border-destructive" : undefined}
        />
        {!!nameError && <Text className="text-sm text-destructive">{nameError}</Text>}
      </View>
      <View className="gap-1.5">
        <Label>Descripción</Label>
        <Textarea
          value={description}
          onChangeText={setDescription}
          placeholder="Descripción del criterio"
        />
      </View>
      <View className="gap-3">
        <Button onPress={handleSave} disabled={isSaving} className="rounded-full w-full" style={{ paddingVertical: 18 }}>
          <Text>{isSaving ? "GUARDANDO..." : "GUARDAR"}</Text>
        </Button>
        <Button variant="destructive" onPress={handleDelete} disabled={isSaving} className="rounded-full w-full" style={{ paddingVertical: 18 }}>
          <Text>ELIMINAR</Text>
        </Button>
      </View>
    </View>
  );
}
