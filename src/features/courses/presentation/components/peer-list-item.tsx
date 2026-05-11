import { Text } from "@/core/components/ui/text";
import { PeerStatus } from "@/features/courses/presentation/context/course-detail-context";
import { RelativePathString, useRouter } from "expo-router";
import { Play } from "lucide-react-native";
import React from "react";
import { Pressable, View } from "react-native";

type Props = {
  peer: PeerStatus;
  courseId: string;
  groupId: string;
};

export function PeerListItem({ peer, courseId, groupId }: Props) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        if (!peer.evaluated) {
          router.push(
            `/course/${courseId}/group/${groupId}/evaluatee/${peer.user.user_id}` as RelativePathString
          );
        }
      }}
      className="flex-row items-center py-3.5 gap-4"
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center"
        style={{
          backgroundColor: peer.evaluated ? "transparent" : "#818CF8",
          borderWidth: peer.evaluated ? 2 : 0,
          borderColor: "#D1D5DB",
        }}
      >
        <Play
          size={16}
          color={peer.evaluated ? "#D1D5DB" : "#FFFFFF"}
          fill={peer.evaluated ? "#D1D5DB" : "#FFFFFF"}
        />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-[#1E1E2E]">{peer.user.name}</Text>
        <Text
          className="text-xs mt-0.5"
          style={{ color: peer.evaluated ? "#9CA3AF" : "#EF4444" }}
        >
          {peer.evaluated ? `Calificacion en: ${peer.avgScore ?? "—"}` : "SIN CALIFICAR"}
        </Text>
      </View>
    </Pressable>
  );
}
