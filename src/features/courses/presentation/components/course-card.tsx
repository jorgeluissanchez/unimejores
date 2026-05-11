import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { Course } from "@/features/courses/domain/entities/course";
import { RelativePathString, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

type Props = {
  course: Course;
  pendingCount: number;
  svg: string;
  background: string;
  textColor: string;
  secondaryTextColor: string;
  buttonBackground: string;
  buttonTextColor: string;
};

export function CourseCard({
  course,
  pendingCount,
  svg,
  background,
  textColor,
  secondaryTextColor,
  buttonBackground,
  buttonTextColor,
}: Props) {
  const router = useRouter();
  const statusText =
    pendingCount === 0
      ? "Todos han Sido Calificados"
      : `${pendingCount} Grupo${pendingCount !== 1 ? "s" : ""} por Calificar`;

  return (
    <View
      className="min-h-[188px] flex-1 justify-between overflow-hidden rounded-[20px] px-4 py-5"
      style={{ backgroundColor: background }}
    >
      <View className="absolute right-[-10px] top-[-12px] opacity-90">
        <SvgXml xml={svg} width={100} height={100} />
      </View>

      <View className="mt-auto">
        <Text className="text-[20px] font-semibold leading-6" style={{ color: textColor }}>
          {course.name}
        </Text>
        <Text
          className="mb-4 mt-1 text-[12px] leading-[16px]"
          style={{ color: secondaryTextColor }}
        >
          {statusText}
        </Text>

        <Button
          size="sm"
          className="ml-auto mt-2 h-11 rounded-full px-5"
          style={{ backgroundColor: buttonBackground }}
          onPress={() => router.push(`/course/${course._id}` as RelativePathString)}
          disabled={pendingCount === 0}
        >
          <Text className="text-[13px] tracking-wide" style={{ color: buttonTextColor }}>
            COMIENZA
          </Text>
        </Button>
      </View>
    </View>
  );
}
