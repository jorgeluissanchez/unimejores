import { Button } from "@/core/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Category, CourseUser, Group } from "@/features/courses/domain/entities/course";
import { CourseRepository } from "@/features/courses/domain/repositories/course-repository";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { EvaluationRepository } from "@/features/evaluation/domain/repositories/evaluation-repository";
import { avg } from "@/features/evaluation/domain/utils";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Play } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    View
} from "react-native";

type CategoryState = {
  category: Category;
  group: Group | null;
  members: CourseUser[];
};

type PeerStatus = {
  user: CourseUser;
  evaluated: boolean;
  avgScore: number | null;
};

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const { courses } = useCourses();
  const courseRepo = useMemo(() => di.resolve<CourseRepository>(TOKENS.CourseRepo), [di]);
  const evalRepo = useMemo(() => di.resolve<EvaluationRepository>(TOKENS.EvaluationRepo), [di]);

  const course = useMemo(() => courses.find((c) => c._id === courseId), [courses, courseId]);

  const [categoryStates, setCategoryStates] = useState<CategoryState[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [peersByCategory, setPeersByCategory] = useState<Record<string, PeerStatus[]>>({});
  const [myAvgScore, setMyAvgScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!courseId || !loggedUser?.userId) return;
    try {
      setIsLoading(true);
      setError(null);
      const categories = await courseRepo.getCategoriesByCourse(courseId);
      const states = await Promise.all(
        categories.map(async (cat) => {
          const group = await courseRepo.getGroupByCategory(cat._id, loggedUser.userId);
          let members: CourseUser[] = [];
          if (group) {
            const ugs = await courseRepo.getMembersByGroup(group._id);
            const details = await Promise.all(ugs.map((ug) => courseRepo.getUserById(ug.user_id)));
            members = details.filter(Boolean) as CourseUser[];
          }
          return { category: cat, group, members };
        })
      );
      setCategoryStates(states);
      setActiveId((prev) => prev || states[0]?.category._id);

      const allReceivedScores: any = [];
      const peersMap: Record<string, PeerStatus[]> = {};

      await Promise.all(
        states.map(async (cs) => {
          if (!cs.group) return;
          const [givenResults, receivedResults] = await Promise.all([
            evalRepo.getResultsByEvaluatorInGroup(cs.group._id, loggedUser.userId),
            evalRepo.getResultsForEvaluatedInGroup(cs.group._id, loggedUser.userId),
          ]);
          allReceivedScores.push(...receivedResults);
          const evaluatedIds = new Set(givenResults.map((r) => r.evaluated_id));
          peersMap[cs.category._id] = cs.members
            .filter((m) => m.user_id !== loggedUser.userId)
            .map((m) => {
              const peerScores = givenResults.filter((r) => r.evaluated_id === m.user_id);
              return { user: m, evaluated: evaluatedIds.has(m.user_id), avgScore: avg(peerScores) };
            });
        })
      );

      setPeersByCategory(peersMap);
      setMyAvgScore(avg(allReceivedScores));
    } catch (e) {
      if (isSessionExpiredError(e)) { await expireSession(); return; }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [courseId, loggedUser?.userId]);

  const activeCat = categoryStates.find((cs) => cs.category._id === activeId);
  const activePeers = activeCat ? (peersByCategory[activeCat.category._id] ?? []) : [];

  return (
    <View className="flex-1 bg-white">

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Decorative header */}
        <View style={{ height: 200, backgroundColor: "#3D3B6E", overflow: "hidden" }}>

          <View className="absolute bottom-[-10] left-[-40] w-[160] h-[100] rounded-md bg-[#4A4880]" />
          <View className="absolute bottom-[10] left-[60] w-[120] h-[80] rounded-full bg-[#4A4880]" />
          <View className="absolute bottom-[-5] right-[-20] w-[140] h-[90] rounded-full bg-[#4A4880]" />
          <View className="absolute top-[30] right-[30] w-[60] h-[40] rounded-full bg-[#5B5990]" />
          <View className="absolute top-[20] right-[80] w-[40] h-[25] rounded-full bg-[#5B5990]" />
          
          <Button
            variant="ghost"
            size="icon"
            onPress={() => router.replace("/home" as RelativePathString)}
            className="absolute left-5 top-[52px] rounded-full bg-white/30"
          >
            <ArrowLeft className="text-gray-800 w-5 h-5" />
          </Button>
        </View>

        {/* Course info */}
        <View className="px-5 pt-5">
          <Text className="text-[26px] font-bold text-[#1E1E2E]">
            {course?.name ?? "Curso"}
          </Text>
          {myAvgScore !== null && (
            <Text variant="muted" className="mt-1">
              Tu promedio es de {myAvgScore}
            </Text>
          )}
          {!!course?.description && (
            <Text className="text-sm text-gray-400 italic mt-3 leading-5">
              {course.description}
            </Text>
          )}
        </View>

        {/* Section title */}
        <View className="px-5 pt-6 pb-3">
          <Text className="text-lg font-bold text-[#1E1E2E]">Calificalos a todos</Text>
        </View>

        {/* Category tabs */}
        {categoryStates.length > 0 && (
          <Tabs value={activeId} onValueChange={setActiveId} className="mb-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              <TabsList className="bg-transparent h-auto rounded-none p-0 gap-6">
                {categoryStates.map((cs) => (
                  <TabsTrigger
                    key={cs.category._id}
                    value={cs.category._id}
                    className="bg-transparent rounded-none px-0 pb-2 h-auto"
                    style={{
                      borderBottomWidth: activeId === cs.category._id ? 2 : 0,
                      borderBottomColor: "#818CF8",
                    }}
                  >
                    <Text
                      className="text-[13px] font-bold tracking-[0.5px]"
                      style={{ color: activeId === cs.category._id ? "#818CF8" : "#9CA3AF" }}
                    >
                      {cs.category.name.toUpperCase()}
                    </Text>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollView>
          </Tabs>
        )}

        {/* Peer list */}
        {isLoading ? (
          <View className="p-10 items-center">
            <ActivityIndicator color="#818CF8" size="large" />
          </View>
        ) : error ? (
          <View className="p-5 items-center gap-2">
            <Text className="text-red-500">{error}</Text>
            <Button variant="link" onPress={load}>
              <Text>Reintentar</Text>
            </Button>
          </View>
        ) : !activeCat?.group ? (
          <View className="p-8 items-center">
            <Text variant="muted" className="text-center">
              No perteneces a ningún grupo en esta categoría
            </Text>
          </View>
        ) : activePeers.length === 0 ? (
          <View className="p-8 items-center">
            <Text variant="muted">No hay compañeros en este grupo</Text>
          </View>
        ) : (
          <View className="px-5 pb-10 gap-1">
            {activePeers.map((peer) => (
              <Pressable
                key={peer.user.user_id}
                onPress={() => {
                  if (!peer.evaluated && activeCat.group) {
                    router.push(
                      `/course/${courseId}/group/${activeCat.group._id}/evaluatee/${peer.user.user_id}` as RelativePathString
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
                    color={peer.evaluated ? "#9CA3AF" : "#FFFFFF"}
                    fill={peer.evaluated ? "transparent" : "#FFFFFF"}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-[#1E1E2E]">
                    {peer.user.name}
                  </Text>
                  <Text
                    className="text-xs mt-0.5"
                    style={{ color: peer.evaluated ? "#9CA3AF" : "#EF4444" }}
                  >
                    {peer.evaluated ? `Calificacion en: ${peer.avgScore ?? "—"}` : "SIN CALIFICAR"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
