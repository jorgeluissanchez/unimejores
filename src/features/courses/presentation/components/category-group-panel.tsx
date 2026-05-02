import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Category, CourseUser, Group } from "@/features/courses/domain/entities/course";
import { useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import { EvaluationScreen } from "@/features/evaluation/presentation/screens/evaluation-screen";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, View } from "react-native";

type CategoryState = {
  category: Category;
  group: Group | null;
  members: CourseUser[];
};

type Props = {
  categoryState: CategoryState;
  courseId: string;
};

export function CategoryGroupPanel({ categoryState, courseId }: Props) {
  const { category, group, members } = categoryState;
  const { loggedUser } = useAuth();
  const { peers, isLoading, error, loadEvaluation } = useEvaluation();

  const [evaluatingPeer, setEvaluatingPeer] = useState<CourseUser | null>(null);

  useEffect(() => {
    loadEvaluation(category.category_id, members);
  }, [category.category_id]);

  const handlePeerPress = (peer: CourseUser, evaluated: boolean) => {
    if (evaluated) return;
    setEvaluatingPeer(peer);
  };

  const handleEvaluationDone = () => {
    setEvaluatingPeer(null);
  };

  const handleNextPeer = (nextPeer: CourseUser) => {
    setEvaluatingPeer(nextPeer);
  };

  if (!group) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-center text-muted-foreground">
          No perteneces a ningún grupo en esta categoría
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-center text-destructive">{error}</Text>
      </View>
    );
  }

  const otherMembers = members.filter((m) => m.user_id !== loggedUser?.userId);

  return (
    <View className="flex-1 p-4">
      <Text className="mb-1 text-base font-semibold text-foreground">
        Grupo: {group.name}
      </Text>
      <Text className="mb-4 text-sm text-muted-foreground">
        {otherMembers.length} compañero{otherMembers.length !== 1 ? "s" : ""} por evaluar
      </Text>

      {peers.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">No hay evaluación activa para esta categoría</Text>
        </View>
      ) : (
        <FlatList
          data={peers}
          keyExtractor={(item) => item.user.user_id}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => {
            const { user, evaluated } = item;
            return (
              <Pressable
                onPress={() => handlePeerPress(user, evaluated)}
                disabled={evaluated}
                className={`rounded-xl border p-4 ${
                  evaluated
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
                    className={`rounded-full px-3 py-1 ${
                      evaluated ? "bg-muted-foreground/20" : "bg-primary/10"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        evaluated ? "text-muted-foreground" : "text-primary"
                      }`}
                    >
                      {evaluated ? "✓ Calificado" : "Calificar"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Evaluation Modal */}
      <Modal
        visible={!!evaluatingPeer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEvaluatingPeer(null)}
      >
        {evaluatingPeer && (
          <EvaluationScreen
            peer={evaluatingPeer}
            courseId={courseId}
            onDone={handleEvaluationDone}
            onNext={handleNextPeer}
          />
        )}
      </Modal>
    </View>
  );
}
