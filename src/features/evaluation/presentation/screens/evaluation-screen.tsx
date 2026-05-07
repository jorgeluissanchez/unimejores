import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { CourseUser } from "@/features/courses/domain/entities/course";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

const SCORE_OPTIONS = [0, 1, 2, 3, 4, 5];

type Props = {
  peer: CourseUser;
  courseId: string;
  onDone: () => void;
  onNext: (peer: CourseUser) => void;
};

export function EvaluationScreen({ peer, courseId, onDone, onNext }: Props) {
  const { criteria, peers, isLoading, error, submitScores } = useEvaluation();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = criteria.length > 0 && criteria.every((c) => scores[c.criterium_id] !== undefined);

  const { courses } = useCourses();

  const courseName = useMemo(
    () => courses.find((course) => course.course_id === courseId)?.name ?? "Evaluación",
    [courses, courseId]
  );

  const pendingPeers = useMemo(
    () => peers.filter((p) => !p.evaluated && p.user.user_id !== peer.user_id),
    [peers, peer.user_id]
  );
  const hasNext = pendingPeers.length > 0;

  const currentPeerIndex = peers.findIndex((p) => p.user.user_id === peer.user_id);
  const peerPosition = currentPeerIndex >= 0 ? currentPeerIndex + 1 : 1;
  const totalPeers = peers.length || 1;

  const handleSubmit = async (goNext: boolean) => {
    if (!allAnswered) return;
    try {
      setSubmitting(true);
      await submitScores(peer.user_id, scores);
      setScores({});
      if (goNext && hasNext) {
        onNext(pendingPeers[0].user);
      } else {
        onDone();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
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
        <Button variant="outline" className="mt-4" onPress={onDone}>
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
        <Button variant="outline" className="mt-4" onPress={onDone}>
          <Text>Volver</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="border-b border-border bg-background px-5 pb-4 pt-6">
        <View className="mb-4 flex-row items-center justify-between gap-3">
          <View className="rounded-full bg-primary/10 px-3 py-1">
            <Text className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              {peerPosition} de {totalPeers}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground">{courseName}</Text>
        </View>

        <Text className="text-sm text-muted-foreground">Evaluando a</Text>
        <Text variant="h2" className="mt-1">{peer.name}</Text>
        <Text className="mt-1 text-sm text-muted-foreground">{peer.email}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {criteria.map((criterium, index) => {
          const selected = scores[criterium.criterium_id];
          return (
            <View key={criterium.criterium_id} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <View className="mb-5">
                <Text className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Pregunta {index + 1} de {criteria.length}
                </Text>
                <Text className="mt-3 text-lg font-semibold text-foreground">{criterium.name}</Text>
                {!!criterium.description && (
                  <Text className="mt-2 text-sm leading-6 text-muted-foreground">{criterium.description}</Text>
                )}
              </View>

              <View className="flex-row flex-wrap justify-center gap-3">
                {SCORE_OPTIONS.map((score) => {
                  const isSelected = selected === score;
                  return (
                    <Pressable
                      key={score}
                      onPress={() =>
                        setScores((prev) => ({ ...prev, [criterium.criterium_id]: score }))
                      }
                      className={`h-12 w-12 mb-1 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-border bg-background"
                      }`}
                    >
                      <Text className={`text-lg font-bold ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                        {score}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View className="border-t border-border bg-background px-5 pb-8 pt-4">
        {!allAnswered && (
          <Text className="mb-3 text-center text-xs text-muted-foreground">
            Responde todas las preguntas para continuar
          </Text>
        )}

        <Button variant="outline" className="mb-3" onPress={onDone}>
          <Text>Cancelar</Text>
        </Button>

        {hasNext ? (
          <Button onPress={() => handleSubmit(true)} disabled={!allAnswered || submitting}>
            <Text>{submitting ? "Guardando..." : "Siguiente compañero"}</Text>
          </Button>
        ) : (
          <Button variant="default" onPress={() => handleSubmit(false)} disabled={!allAnswered || submitting}>
            <Text>{submitting ? "Guardando..." : "Terminar"}</Text>
          </Button>
        )}
      </View>
    </View>
  );
}
