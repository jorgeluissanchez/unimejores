import { Text } from "@/core/components/ui/text";
import { Criterium } from "@/features/evaluation/domain/entities/evaluation";
import React from "react";
import { Pressable, View } from "react-native";

const SCORE_OPTIONS = [2, 3, 4, 5];

type Props = {
  criterium: Criterium;
  index: number;
  total: number;
  selected?: number;
  onSelect: (score: number) => void;
};

export function CriteriumScoreCard({ criterium, index, total, selected, onSelect }: Props) {
  return (
    <View>
      <View className="mb-3">
        <Text className="text-sm font-semibold text-muted-foreground">
          Pregunta {index + 1} de {total}
        </Text>
        <Text className="mt-1 text-base font-semibold">{criterium.name}</Text>
        {!!criterium.description && (
          <Text className="mt-0.5 text-sm text-muted-foreground">{criterium.description}</Text>
        )}
      </View>

      <View className="flex-row gap-3">
        {SCORE_OPTIONS.map((score) => {
          const isSelected = selected === score;
          return (
            <Pressable
              key={score}
              onPress={() => onSelect(score)}
              className={`flex-1 items-center justify-center rounded-xl border py-4 ${
                isSelected ? "border-primary bg-primary" : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-xl font-bold ${
                  isSelected ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {score}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
