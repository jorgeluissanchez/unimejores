import { Criterium } from "@/features/evaluation/domain/entities/evaluation";
import React from "react";
import { Pressable, Text, View } from "react-native";

const SCORES = [0, 1, 2, 3, 4, 5];

function scoreColor(score: number): string {
  if (score <= 1) return "#F59E0B";
  if (score === 2) return "#9CA3AF";
  return "#1E1E2E";
}

type Props = {
  criterium: Criterium;
  selected?: number;
  onSelect: (score: number) => void;
};

export function CriteriumScoreCard({ criterium, selected, onSelect }: Props) {
  return (
    <View className="mb-2">
      <Text className="text-[22px] font-bold text-[#1E1E2E] leading-[30px] mb-2">
        {criterium.name}
      </Text>

      {!!criterium.description && (
        <Text className="text-sm text-gray-400 italic leading-5 mb-1.5">
          {criterium.description}
        </Text>
      )}

      <Text className="text-xs text-gray-400 mb-3.5">Elije solo una.</Text>

      <View className="flex-row gap-2">
        {SCORES.map((score) => {
          const isSelected = selected === score;
          return (
            <Pressable
              key={score}
              onPress={() => onSelect(score)}
              className="flex-1 aspect-square rounded-full items-center justify-center"
              style={{
                borderWidth: 1.5,
                borderColor: isSelected ? scoreColor(score) : "#E5E7EB",
                backgroundColor: isSelected ? scoreColor(score) : "transparent",
              }}
            >
              <Text
                className="text-[15px] font-semibold"
                style={{ color: isSelected ? "#FFFFFF" : "#9CA3AF" }}
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
