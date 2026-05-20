import { Text } from "@/core/components/ui/text";
import { Evaluation } from "@/features/evaluation/domain/entities/evaluation";
import { SquarePen } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";

const PRIMARY = "#818CF8";
const PRIMARY_LIGHT = "rgba(129,140,248,0.15)";

export type EvalListItem = {
  evaluation: Evaluation;
  categoryName: string;
};

type Props = {
  evalList: EvalListItem[];
  onEditEval: (item: EvalListItem) => void;
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function EvaluacionesTab({ evalList, onEditEval }: Props) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}>
      {evalList.length === 0 && (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <Text style={{ color: "#9CA3AF" }}>Sin evaluaciones aún</Text>
        </View>
      )}
      {evalList.map((item) => (
        <View key={item.evaluation._id}>
          <TouchableOpacity onPress={() => onEditEval(item)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16 }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
              <SquarePen size={20} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 15, color: "#111827" }}>{item.evaluation.title}</Text>
              <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                {item.categoryName}{item.evaluation.end_date ? ` · ${formatDate(item.evaluation.end_date)}` : ""}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
        </View>
      ))}
    </View>
  );
}
