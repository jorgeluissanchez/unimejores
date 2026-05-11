import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { CriteriumScoreCard } from "@/features/evaluation/presentation/components/criterium-score-card";
import { useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

export default function EvaluationScreen() {
  const router = useRouter();
  const { courseId, groupId, evaluateeId } = useLocalSearchParams<{
    courseId: string;
    groupId: string;
    evaluateeId: string;
  }>();

  const { evaluation, criteria, peers, isLoading, error, loadEvaluation, submitScores } =
    useEvaluation();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (groupId) loadEvaluation(groupId);
  }, [groupId]);

  const currentPeer = peers.find((p) => p.user.user_id === evaluateeId);
  const peer = currentPeer?.user ?? { user_id: evaluateeId, name: "", email: "", _id: "", role: "" };
  const pendingPeers = peers.filter((p) => !p.evaluated && p.user.user_id !== evaluateeId);
  const hasNext = pendingPeers.length > 0;
  const allAnswered = criteria.length > 0 && criteria.every((c) => scores[c._id] !== undefined);
  const currentIdx = peers.findIndex((p) => p.user.user_id === evaluateeId);

  const handleSubmit = async () => {
    if (!allAnswered) return;
    try {
      setSubmitting(true);
      await submitScores(groupId, evaluateeId, scores);
      setScores({});
      if (hasNext) {
        const next = pendingPeers[0].user;
        router.replace({
          pathname: `/course/${courseId}/group/${groupId}/evaluatee/${next.user_id}` as RelativePathString,
        });
      } else {
        router.replace(`/course/${courseId}` as RelativePathString);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#818CF8" />
      </View>
    );
  }

  if (error || criteria.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-red-500 text-center mb-4">
          {error ?? "Esta evaluación no tiene criterios configurados"}
        </Text>
        <Button
          variant="link"
          onPress={() => router.replace(`/course/${courseId}` as RelativePathString)}
        >
          <Text>Volver</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 w-full max-w-lg self-center">

        {/* Header */}
        <View className="flex-row items-center px-5 pt-[52px] pb-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            onPress={() => router.replace(`/course/${courseId}` as RelativePathString)}
            className="rounded-full bg-gray-100 w-[40px] h-[40px] items-center justify-center hover:bg-gray-200"
          >
            <ArrowLeft size={18} color="#1E1E2E" />
          </Button>

          <View className="flex-1">
            <Text className="text-base font-bold text-[#1E1E2E]">
              Evaluando a {peer.name}
            </Text>
            {evaluation && (
              <Text className="text-xs text-gray-400 mt-0.5">
                {evaluation.title} · {currentIdx + 1} de {peers.length}
              </Text>
            )}
          </View>
        </View>

        {/* Criteria list */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {criteria.map((criterium) => (
            <CriteriumScoreCard
              key={criterium._id}
              criterium={criterium}
              selected={scores[criterium._id]}
              onSelect={(score) => setScores((prev) => ({ ...prev, [criterium._id]: score }))}
            />
          ))}
        </ScrollView>

        {/* Submit */}
        <View className="px-5 pb-9 pt-3">
          {!allAnswered && (
            <Text className="text-center text-xs text-gray-400 mb-2.5">
              Responde todas las preguntas para continuar
            </Text>
          )}
          <Button
            onPress={handleSubmit}
            disabled={!allAnswered || submitting}
            className="rounded-full py-[18px] items-center mb-6"
            style={{ backgroundColor: allAnswered ? "#818CF8" : "#C7D2FE" }}
          >
            <Text className="text-white text-sm">
              {submitting ? "GUARDANDO..." : hasNext ? "SIGUIENTE COMPAÑEROS" : "TERMINAR"}
            </Text>
          </Button>
        </View>

      </View>
    </View>
  );
}
