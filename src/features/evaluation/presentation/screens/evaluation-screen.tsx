import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { CriteriumScoreCard } from "@/features/evaluation/presentation/components/criterium-score-card";
import { CourseUser } from "@/features/courses/domain/entities/course";
import { useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

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

  const pendingPeers = peers.filter((p) => !p.evaluated && p.user.user_id !== peer.user_id);
  const hasNext = pendingPeers.length > 0;

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
            key={criterium.criterium_id}
            criterium={criterium}
            index={index}
            total={criteria.length}
            selected={scores[criterium.criterium_id]}
            onSelect={(score) => setScores((prev) => ({ ...prev, [criterium.criterium_id]: score }))}
          />
        ))}
      </ScrollView>

      <View className="border-t border-border px-5 pb-8 pt-4 gap-3">
        <Button variant="outline" onPress={onDone}>
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
