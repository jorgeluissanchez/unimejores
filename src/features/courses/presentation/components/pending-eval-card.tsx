import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { PendingEvalData } from "@/features/courses/domain/entities/course";
import { RelativePathString, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

type Props = {
  data: PendingEvalData;
  svg: string;
  background: string;
  textColor: string;
  secondaryTextColor: string;
  buttonBackground: string;
  buttonTextColor: string;
};

function formatTimeUntil(endDate: string): string {
  const ms = new Date(endDate).getTime() - Date.now();
  if (ms <= 0) return "Cerrada";
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `Cierra en ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Cierra en ${days}d`;
}

export function PendingEvalCard({
  data,
  svg,
  background,
  textColor,
  secondaryTextColor,
  buttonBackground,
  buttonTextColor,
}: Props) {
  const router = useRouter();

  return (
    <View
      className="mb-5 overflow-hidden rounded-[22px] px-5 py-6"
      style={{ backgroundColor: background, width: "100%" }}
    >
      <View className="absolute right-[-12px] top-[-18px] opacity-95">
        <SvgXml xml={svg} width={100} height={100} />
      </View>
      <View
        className="absolute bottom-[-26px] right-[-26px] h-[108px] w-[108px] rounded-full opacity-10"
        style={{ backgroundColor: "#808AFF" }}
      />
      <View
        className="absolute bottom-[-4px] left-[-18px] h-[74px] w-[74px] rounded-full opacity-10"
        style={{ backgroundColor: "#99A1FF" }}
      />

      <View className="flex-row justify-between items-start">
        <Text className="flex-1 text-[19px] font-bold leading-6" style={{ color: textColor }}>
          {data.courseName}
        </Text>
        <Text className="mt-1 text-[12px]" style={{ color: secondaryTextColor }}>
          {formatTimeUntil(data.evaluationEndDate)}
        </Text>
      </View>

      <Text
        className="mb-5 mt-1 text-[12px] tracking-wide"
        style={{ color: secondaryTextColor }}
      >
        {data.evaluationTitle.toUpperCase()}
      </Text>

      <Button
        className="h-12 rounded-[18px]"
        style={{ backgroundColor: buttonBackground, width: "100%", justifyContent: "center" }}
        onPress={() => router.push(`/course/${data.courseId}` as RelativePathString)}
      >
        <Text
          className="text-[15px] tracking-wide text-center"
          style={{ color: buttonTextColor }}
        >
          EVALUAR
        </Text>
      </Button>
    </View>
  );
}
