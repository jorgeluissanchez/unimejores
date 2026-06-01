import { Text } from "@/core/components/ui/text";
import { Category, Group } from "@/features/courses/domain/entities/course";
import { Evaluation } from "@/features/evaluation/domain/entities/evaluation";
import { SquarePen } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";

const PRIMARY = "#818CF8";
const PRIMARY_LIGHT = "rgba(129,140,248,0.15)";

export type CategoryWithData = {
  category: Category;
  evaluation: Evaluation | null;
  groups: Group[];
};

type Props = {
  categoryData: CategoryWithData[];
  onSelectCategory: (category: Category) => void;
  suppressEmpty?: boolean;
};

export function CategoriasTab({ categoryData, onSelectCategory, suppressEmpty }: Props) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: suppressEmpty ? 0 : 40 }}>
      {categoryData.length === 0 && !suppressEmpty && (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <Text style={{ color: "#9CA3AF" }}>Sin categorías aún</Text>
        </View>
      )}
      {categoryData.map((cd) => (
        <View key={cd.category._id}>
          <TouchableOpacity
            onPress={() => onSelectCategory(cd.category)}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 18 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
              <SquarePen size={20} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 15, color: "#111827" }}>{cd.category.name}</Text>
              <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                {cd.groups.length} {cd.groups.length === 1 ? "Grupo" : "Grupos"}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
        </View>
      ))}
    </View>
  );
}
