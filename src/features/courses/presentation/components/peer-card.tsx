import { Text } from "@/core/components/ui/text";
import { CourseUser } from "@/features/courses/domain/entities/course";
import { RelativePathString, useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

type Props = {
  user: CourseUser;
  evaluated: boolean;
  courseId: string;
  groupId: string;
};

export function PeerCard({ user, evaluated, courseId, groupId }: Props) {
  const router = useRouter();
  return (
    <Pressable
      testID="peer-card"
      onPress={() => {
        router.push({
          pathname: `/course/${courseId}/group/${groupId}/evaluatee/${user.user_id}` as RelativePathString
        });
      }}
      disabled={evaluated}
      className={`rounded-xl border p-4 ${evaluated
          ? "border-border bg-muted opacity-60"
          : "border-primary/30 bg-card active:opacity-70"
        }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-medium">{user.name}</Text>
          <Text className="text-sm text-muted-foreground">{user.email}</Text>
        </View>
        <View
          className={`rounded-full px-3 py-1 ${evaluated ? "bg-muted-foreground/20" : "bg-primary/10"
            }`}
        >
          <Text
            className={`text-xs font-medium ${evaluated ? "text-muted-foreground" : "text-primary"
              }`}
          >
            {evaluated ? "✓ Calificado" : "Calificar"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
