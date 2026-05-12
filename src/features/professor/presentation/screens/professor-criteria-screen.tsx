import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Criterium } from "@/features/professor/domain/entities/professor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Keyboard, SafeAreaView, TouchableOpacity, View } from "react-native";
import { useProfessor } from "../context/professor-context";

const PRIMARY = "#818CF8";

export function ProfessorCriteriaScreen() {
  const router = useRouter();
  const { myCriteria, addCriterium, deleteCriterium } = useProfessor();
  const { loggedUser } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  const handleAdd = async () => {
    Keyboard.dismiss();
    if (!name.trim()) { setNameError("El nombre es obligatorio"); return; }
    if (!loggedUser) return;
    await addCriterium({ name: name.trim(), description: description.trim(), created_by: loggedUser.userId });
    setName("");
    setDescription("");
    setNameError("");
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
          <Text style={{ fontSize: 18, fontWeight: "700", letterSpacing: 1, color: "#111827" }}>CRITERIOS</Text>
        </View>

        {/* Add form */}
        <Input
          value={name}
          onChangeText={(v) => { setName(v); setNameError(""); }}
          placeholder="Nombre"
          style={{ marginBottom: 12, backgroundColor: "#F3F4F6", borderColor: nameError ? "#EF4444" : "#F3F4F6" }}
        />
        {!!nameError && <Text style={{ color: "#EF4444", fontSize: 12, marginBottom: 8 }}>{nameError}</Text>}
        <Input
          value={description}
          onChangeText={setDescription}
          placeholder="Descripcion"
          style={{ marginBottom: 16, backgroundColor: "#F3F4F6", borderColor: "#F3F4F6" }}
        />
        <Button onPress={handleAdd} style={{ backgroundColor: PRIMARY, borderRadius: 30, marginBottom: 28 }}>
          <Text style={{ color: "#fff", fontWeight: "700", letterSpacing: 1 }}>AÑADIR</Text>
        </Button>

        {/* List */}
        <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>CRITERIOS</Text>
        <View style={{ height: 1, backgroundColor: "#E5E7EB", marginBottom: 4 }} />

        <FlatList
          data={myCriteria}
          keyExtractor={(item) => item._id}
          renderItem={({ item }: { item: Criterium }) => (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 15, color: "#111827" }}>{item.name}</Text>
                  {!!item.description && (
                    <Text style={{ fontSize: 11, color: "#9CA3AF", letterSpacing: 0.5, marginTop: 2 }}>{item.description.toUpperCase()}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => deleteCriterium(item._id)}
                  style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" }}
                >
                  <Ionicons name="remove" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={{ height: 1, backgroundColor: "#E5E7EB" }} />
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: "#9CA3AF", textAlign: "center", marginTop: 24 }}>Sin criterios aún</Text>}
        />
      </View>
    </SafeAreaView>
  );
}
