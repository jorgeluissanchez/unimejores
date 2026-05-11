import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { CourseUser } from "@/features/courses/domain/entities/course";
import { CourseRepository } from "@/features/courses/domain/repositories/course-repository";
import { Criterium, Evaluation, ResultEvaluation } from "@/features/evaluation/domain/entities/evaluation";
import { EvaluationRepository } from "@/features/evaluation/domain/repositories/evaluation-repository";
import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type PeerEvalStatus = {
  user: CourseUser;
  evaluated: boolean;
};

type EvaluationContextType = {
  evaluation: Evaluation | null;
  criteria: Criterium[];
  peers: PeerEvalStatus[];
  isLoading: boolean;
  error: string | null;
  loadEvaluation: (groupId: string) => Promise<void>;
  submitScores: (groupId: string, evaluatedId: string, scores: Record<string, number>) => Promise<void>;
};

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

export function EvaluationProvider({ children }: { children: ReactNode }) {
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const evalRepo = useMemo(() => di.resolve<EvaluationRepository>(TOKENS.EvaluationRepo), [di]);
  const courseRepo = useMemo(() => di.resolve<CourseRepository>(TOKENS.CourseRepo), [di]);

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [criteria, setCriteria] = useState<Criterium[]>([]);
  const [peers, setPeers] = useState<PeerEvalStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvaluation = async (groupId: string) => {
    if (!loggedUser?.userId) return;
    try {
      setIsLoading(true);
      setError(null);

      const userGroups = await courseRepo.getMembersByGroup(groupId);
      const details = await Promise.all(
        userGroups.map((ug) => courseRepo.getUserById(ug.user_id))
      );
      const groupMembers = details.filter(Boolean) as CourseUser[];

      const eval_ = await evalRepo.getEvaluationByGroup(groupId);
      setEvaluation(eval_);

      if (!eval_) {
        setPeers([]);
        setCriteria([]);
        return;
      }

      const [crit, results] = await Promise.all([
        evalRepo.getCriteriaByEvaluation(eval_._id),
        evalRepo.getResultsByEvaluatorInGroup(groupId, loggedUser.userId),
      ]);

      setCriteria(crit);

      const evaluatedIds = new Set(results.map((r: ResultEvaluation) => r.evaluated_id));
      setPeers(
        groupMembers
          .filter((m) => m.user_id !== loggedUser.userId)
          .map((m) => ({ user: m, evaluated: evaluatedIds.has(m.user_id) }))
      );
    } catch (e) {
      if (isSessionExpiredError(e)) {
        await expireSession();
        setEvaluation(null);
        setCriteria([]);
        setPeers([]);
        return;
      }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitScores = async (
    groupId: string,
    evaluatedId: string,
    scores: Record<string, number>
  ) => {
    if (!loggedUser?.userId || !evaluation) return;
    try {
      setIsLoading(true);
      setError(null);
      await evalRepo.submitEvaluation(groupId, loggedUser.userId, evaluatedId, scores);
      setPeers((prev) =>
        prev.map((p) => (p.user.user_id === evaluatedId ? { ...p, evaluated: true } : p))
      );
    } catch (e) {
      if (isSessionExpiredError(e)) {
        await expireSession();
        return;
      }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(
    () => ({ evaluation, criteria, peers, isLoading, error, loadEvaluation, submitScores }),
    [evaluation, criteria, peers, isLoading, error]
  );

  return <EvaluationContext.Provider value={value}>{children}</EvaluationContext.Provider>;
}

export function useEvaluation() {
  const ctx = useContext(EvaluationContext);
  if (!ctx) throw new Error("useEvaluation debe usarse dentro de EvaluationProvider");
  return ctx;
}
