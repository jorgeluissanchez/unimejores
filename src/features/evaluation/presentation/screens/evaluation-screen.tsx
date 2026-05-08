import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { CourseRepository } from "@/features/courses/domain/repositories/course-repository";
import { CriteriumScoreCard } from "@/features/evaluation/presentation/components/criterium-score-card";
import { EvaluationProvider, useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

function EvaluationContent() {
  const router = useRouter();
  const { courseId, groupId, evaluateeId } = useLocalSearchParams<{
    courseId: string;
    groupId: string;
    evaluateeId: string;
  }>();

  const di = useDI();
  const { expireSession } = useAuth();
  const { criteria, peers, isLoading, error, loadEvaluation, submitScores } = useEvaluation();
  const courseRepo = useMemo(() => di.resolve<CourseRepository>(TOKENS.CourseRepo), [di]);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if ( !groupId) return;

    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const userGroups = await courseRepo.getMembersByGroup(groupId);
        const memberDetails = await Promise.all(
          userGroups.map((ug) => courseRepo.getUserById(ug.user_id))
        );
        const members = memberDetails.filter(Boolean) as any[];
        await loadEvaluation(groupId, members);
      } catch (e) {
        if (isSessionExpiredError(e)) await expireSession();
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  const evaluateePeer = peers.find((p) => p.user.user_id === evaluateeId);
  const peer = evaluateePeer?.user ?? { user_id: evaluateeId, name: "", email: "", _id: evaluateeId, role: "", created_at: "" };
  const pendingPeers = peers.filter((p) => !p.evaluated && p.user.user_id !== evaluateeId);
  const hasNext = pendingPeers.length > 0;
  const allAnswered = criteria.length > 0 && criteria.every((c) => scores[c._id] !== undefined);

  const handleSubmit = async (goNext: boolean) => {
    if (!allAnswered) return;
    try {
      setSubmitting(true);
      await submitScores(groupId, evaluateeId, scores);
      setScores({});
      if (goNext && hasNext) {
        const next = pendingPeers[0].user;
        router.replace({
          pathname: `/course/${courseId}/group/${groupId}/evaluatee/${next.user_id}` as RelativePathString
        });
      } else {
        router.back();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loadingMembers) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-destructive">{error}</Text>
        <Button variant="outline" className="mt-4" onPress={() => router.back()}>
          <Text>Volver</Text>
        </Button>
      </View>
    );
  }

  if (criteria.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted-foreground">
          Esta evaluación no tiene criterios configurados
        </Text>
        <Button variant="outline" className="mt-4" onPress={() => router.back()}>
          <Text>Volver</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="border-b border-border px-5 pb-4 pt-6">
        <Text className="text-sm text-muted-foreground">Evaluando a</Text>
        <Text variant="h2">{peer.name}</Text>
        <Text className="text-sm text-muted-foreground">{peer.email}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {criteria.map((criterium, index) => (
          <CriteriumScoreCard
            key={criterium._id}
            criterium={criterium}
            index={index}
            total={criteria.length}
            selected={scores[criterium._id]}
            onSelect={(score) => setScores((prev) => ({ ...prev, [criterium._id]: score }))}
          />
        ))}
      </ScrollView>

      <View className="border-t border-border px-5 pb-8 pt-4 gap-3">
        <Button variant="outline" onPress={() => router.back()}>
          <Text>Cancelar</Text>
        </Button>

        {!allAnswered && (
          <Text className="text-center text-xs text-muted-foreground">
            Responde todas las preguntas para continuar
          </Text>
        )}

        {hasNext && (
          <Button onPress={() => handleSubmit(true)} disabled={!allAnswered || submitting}>
            <Text>{submitting ? "Guardando..." : "Guardar y calificar siguiente"}</Text>
          </Button>
        )}

        <Button
          variant={hasNext ? "outline" : "default"}
          onPress={() => handleSubmit(false)}
          disabled={!allAnswered || submitting}
        >
          <Text>{submitting ? "Guardando..." : "Terminar"}</Text>
        </Button>
      </View>
    </View>
  );
}

export default function EvaluationScreen() {
  return (
    <EvaluationProvider>
      <EvaluationContent />
    </EvaluationProvider>
  );
}
