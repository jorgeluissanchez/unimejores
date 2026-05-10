import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-Provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Category, CourseUser, Group } from "@/features/courses/domain/entities/course";
import { PeerCard } from "@/features/courses/presentation/components/peer-card";
import { ResultEvaluation } from "@/features/evaluation/domain/entities/evaluation";
import { EvaluationRepository } from "@/features/evaluation/domain/repositories/evaluation-repository";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";

type PeerStatus = { user: CourseUser; evaluated: boolean };

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
  const { loggedUser, expireSession } = useAuth();
  const di = useDI();
  const evalRepo = useMemo(() => di.resolve<EvaluationRepository>(TOKENS.EvaluationRepo), [di]);

  const [peers, setPeers] = useState<PeerStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loggedUser?.userId || !group) { setIsLoading(false); return; }

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const results = await evalRepo.getResultsByEvaluatorInGroup(group._id, loggedUser.userId);
        const evaluatedIds = new Set(results.map((r: ResultEvaluation) => r.evaluated_id));
        setPeers(
          members
            .filter((m) => m.user_id !== loggedUser.userId)
            .map((m) => ({ user: m, evaluated: evaluatedIds.has(m.user_id) }))
        );
      } catch (e) {
        if (isSessionExpiredError(e)) { await expireSession(); return; }
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [category._id, group?._id, loggedUser?.userId]);

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

  return (
    <View className="flex-1 p-4">
      <Text className="mb-1 text-base font-semibold text-foreground">
        Grupo: {group.name}
      </Text>
      <Text className="mb-4 text-sm text-muted-foreground">
        {peers.length} compañero{peers.length !== 1 ? "s" : ""} por evaluar
      </Text>

      {peers.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">No hay compañeros en este grupo</Text>
        </View>
      ) : (
        <FlatList
          data={peers}
          keyExtractor={(item) => item.user.user_id}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <PeerCard
              user={item.user}
              evaluated={item.evaluated}
              courseId={courseId}
              groupId={group._id}
            />
          )}
        />
      )}
    </View>
  );
}
