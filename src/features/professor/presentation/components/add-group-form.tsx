import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Text } from "@/core/components/ui/text";
import { Check, X } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useProfessor } from "../context/professor-context";

type Props = { categoryId: string; onCancel: () => void };

export function AddGroupForm({ categoryId, onCancel }: Props) {
  const { addGroup } = useProfessor();

  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      setIsSaving(true);
      await addGroup({ name: name.trim(), category_id: categoryId });
      setName("");
      onCancel();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-row items-center gap-2">
      <Input
        value={name}
        onChangeText={setName}
        placeholder="Nombre del grupo"
        autoFocus
        className="flex-1"
      />
      {isSaving ? (
        <ActivityIndicator color="#818CF8" />
      ) : (
        <Button size="icon" onPress={handleSubmit}>
          <Check size={18} color="#fff" />
        </Button>
      )}
      <Button size="icon" variant="outline" onPress={onCancel}>
        <X size={18} color="#9CA3AF" />
        <Text className="sr-only">Cancelar</Text>
      </Button>
    </View>
  );
}
