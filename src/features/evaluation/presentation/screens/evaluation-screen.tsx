import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { CourseRepository } from "@/features/courses/domain/repositories/course-repository";
import { CriteriumScoreCard } from "@/features/evaluation/presentation/components/criterium-score-card";
import {
  EvaluationProvider,
  useEvaluation,
} from "@/features/evaluation/presentation/context/evaluation-context";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View
} from "react-native";

function ProgressDot({ state, index }: { state: "done" | "current" | "pending"; index: number }) {
  if (state === "done") {
    return (
      <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center">
        <Check size={16} color="#fff" strokeWidth={3} />
      </View>
    );
  }
  if (state === "current") {
    return (
      <View className="w-8 h-8 rounded-full bg-[#1E1E2E] items-center justify-center">
        <Text className="text-white text-[13px] font-bold">{index + 1}</Text>
      </View>
    );
  }
  return (
    <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
      <Text className="text-gray-400 text-[13px] font-semibold">{index + 1}</Text>
    </View>
  );
}

function EvaluationContent() {
  const router = useRouter();
  const { courseId, groupId, evaluateeId } = useLocalSearchParams<{
    courseId: string;
    groupId: string;
    evaluateeId: string;
  }>();

  const di = useDI();
  const { expireSession } = useAuth();
  const { evaluation, criteria, peers, isLoading, error, loadEvaluation, submitScores } =
    useEvaluation();
  const courseRepo = useMemo(() => di.resolve<CourseRepository>(TOKENS.CourseRepo), [di]);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const userGroups = await courseRepo.getMembersByGroup(groupId);
        const details = await Promise.all(
          userGroups.map((ug) => courseRepo.getUserById(ug.user_id))
        );
        await loadEvaluation(groupId, details.filter(Boolean) as any[]);
      } catch (e) {
        if (isSessionExpiredError(e)) await expireSession();
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
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

  if (isLoading || loadingMembers) {
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
        <Button variant="link" onPress={() => router.replace(`/course/${courseId}` as RelativePathString)}>
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
          className="rounded-full bg-white/30"
        >
          <ArrowLeft className="text-gray-800 w-5 h-5" />
        </Button>
        <View className="flex-1">
          <Text className="text-base font-bold text-[#1E1E2E]">
            Evaluando a {peer.name
              .toLowerCase()
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </Text>
          {evaluation && (
            <Text className="text-xs text-gray-400 mt-0.5">
              {evaluation.title} · {currentIdx + 1} de {peers.length}
            </Text>
          )}
        </View>

        <View className="flex-row gap-1.5">
          {peers.map((p, idx) => {
            const state =
              p.user.user_id === evaluateeId
                ? "current"
                : p.evaluated
                ? "done"
                : "pending";
            return <ProgressDot key={p.user.user_id} state={state} index={idx} />;
          })}
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

      {/* Bottom button */}
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
          <Text className="text-white text-sm ">
            {submitting ? "GUARDANDO..." : hasNext ? "SIGUIENTE COMPAÑEROS" : "TERMINAR"}
          </Text>
        </Button>
      </View>
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
