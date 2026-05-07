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
    <View >

      {peers.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">No hay evaluación activa para esta categoría</Text>
        </View>
      ) : (
        <FlatList
          style={{
            marginTop: 8,
          }}
          data={peers}
          keyExtractor={(item) => item.user.user_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 40,
          }}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-zinc-200 ml-[72px]" />
          )}
          renderItem={({ item }) => {
            const { user, evaluated } = item;

            return (
              <Pressable
                onPress={() =>
                  handlePeerPress(user, evaluated)
                }
                disabled={evaluated}
                className="py-4 active:opacity-70"
              >
                <View className="flex-row items-center">

                  {/* Left Button */}
                  <View
                    className={`w-11 h-11 rounded-full items-center justify-center ${evaluated
                      ? "bg-zinc-200"
                      : "bg-brand"
                      }`}
                  >
                    <Text
                      className={`text-lg ${evaluated
                        ? "text-zinc-500"
                        : "text-white"
                        }`}
                    >
                      {evaluated ? "✓" : "▶"}
                    </Text>
                  </View>

                  {/* User Info */}
                  <View className="ml-4 flex-1">
                    <Text className="text-[16px] font-medium text-zinc-700">
                      {user.name}
                    </Text>

                    <Text className="text-[11px] uppercase tracking-[1px] text-zinc-400 mt-1">
                      {evaluated
                        ? "CALIFICADO"
                        : "SIN CALIFICAR"}
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
