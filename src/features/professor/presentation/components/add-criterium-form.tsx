import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import React, { useState } from "react";
import { Keyboard, View } from "react-native";
import { useProfessor } from "../context/professor-context";

type Props = { onDone: () => void };

export function AddCriteriumForm({ onDone }: Props) {
  const { addCriterium } = useProfessor();
  const { loggedUser } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!name.trim()) { setNameError("El nombre es obligatorio"); return; }
    if (!loggedUser) return;
    try {
      setIsSaving(true);
      await addCriterium({ name: name.trim(), description: description.trim(), created_by: loggedUser.userId });
      setName("");
      setDescription("");
      setNameError("");
      onDone();
    } finally {
      setIsSaving(false);
    }
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
      <Button onPress={handleSubmit} disabled={isSaving}>
        <Text>{isSaving ? "Añadiendo..." : "AÑADIR"}</Text>
      </Button>
    </View>
  );
}
