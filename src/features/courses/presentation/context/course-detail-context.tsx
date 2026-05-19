import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Category, CourseUser, Group } from "@/features/courses/domain/entities/course";
import { CourseRepository } from "@/features/courses/domain/repositories/course-repository";
import { ResultEvaluation } from "@/features/evaluation/domain/entities/evaluation";
import { EvaluationRepository } from "@/features/evaluation/domain/repositories/evaluation-repository";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CategoryState = {
  category: Category;
  group: Group | null;
  members: CourseUser[];
};

export type PeerStatus = {
  user: CourseUser;
  evaluated: boolean;
  avgScore: number | null;
};

type CourseDetailContextType = {
  categoryStates: CategoryState[];
  activeId: string;
  setActiveId: (id: string) => void;
  activeCat: CategoryState | undefined;
  activePeers: PeerStatus[];
  myAvgScore: number | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const CourseDetailContext = createContext<CourseDetailContextType | undefined>(undefined);

function calcAvg(scores: ResultEvaluation[]): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((t, r) => t + parseFloat(r.score), 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

export function CourseDetailProvider({
  courseId,
  children,
}: {
  courseId: string;
  children: React.ReactNode;
}) {
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const courseRepo = useMemo(() => di.resolve<CourseRepository>(TOKENS.CourseRepo), [di]);
  const evalRepo = useMemo(() => di.resolve<EvaluationRepository>(TOKENS.EvaluationRepo), [di]);

  const [categoryStates, setCategoryStates] = useState<CategoryState[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [peersByCategory, setPeersByCategory] = useState<Record<string, PeerStatus[]>>({});
  const [myAvgScore, setMyAvgScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!courseId || !loggedUser?.userId) return;
    try {
      setIsLoading(true);
      setError(null);

      // 1. Cargar categorías → grupos → miembros
      const categories = await courseRepo.getCategoriesByCourse(courseId);
      const states = await Promise.all(
        categories.map(async (cat) => {
          const group = await courseRepo.getGroupByCategory(cat._id, loggedUser.userId);
          let members: CourseUser[] = [];
          if (group) {
            const ugs = await courseRepo.getMembersByGroupIds(group._id);
            const details = await Promise.all(
              ugs.map((ug) => courseRepo.getUserById(ug.user_id))
            );
            members = details.filter(Boolean) as CourseUser[];
          }
          return { category: cat, group, members };
        })
      );
      setCategoryStates(states);
      setActiveId((prev) => prev || (states[0]?.category._id ?? ""));

      // 2. Cargar resultados de evaluación por categoría
      const allReceivedScores: ResultEvaluation[] = [];
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
              return {
                user: m,
                evaluated: evaluatedIds.has(m.user_id),
                avgScore: calcAvg(peerScores),
              };
            });
        })
      );

      setPeersByCategory(peersMap);
      setMyAvgScore(calcAvg(allReceivedScores));
    } catch (e) {
      if (isSessionExpiredError(e)) {
        await expireSession();
        return;
      }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, loggedUser?.userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const activeCat = useMemo(
    () => categoryStates.find((cs) => cs.category._id === activeId),
    [categoryStates, activeId]
  );

  const activePeers = useMemo(
    () =>
      activeCat
        ? [...(peersByCategory[activeCat.category._id] ?? [])].sort((a, b) =>
            a.evaluated ? 1 : -1
          )
        : [],
    [activeCat, peersByCategory]
  );

  const value = useMemo(
    () => ({
      categoryStates,
      activeId,
      setActiveId,
      activeCat,
      activePeers,
      myAvgScore,
      isLoading,
      error,
      reload,
    }),
    [categoryStates, activeId, activeCat, activePeers, myAvgScore, isLoading, error, reload]
  );

  return <CourseDetailContext.Provider value={value}>{children}</CourseDetailContext.Provider>;
}

export function useCourseDetail() {
  const ctx = useContext(CourseDetailContext);
  if (!ctx) throw new Error("useCourseDetail debe usarse dentro de CourseDetailProvider");
  return ctx;
}
