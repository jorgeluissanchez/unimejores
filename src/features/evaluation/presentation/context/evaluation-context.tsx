import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { CourseUser } from "@/features/courses/domain/entities/course";
import { Criterium, Evaluation, NewResultCriterium, ResultEvaluation } from "@/features/evaluation/domain/entities/evaluation";
import { EvaluationRepository } from "@/features/evaluation/domain/repositories/evaluation-repository";
import React, { createContext, useContext, useMemo, useState } from "react";

type PeerEvalStatus = {
  user: CourseUser;
  evaluated: boolean;
};

type EvaluationContextType = {
  evaluation: Evaluation | null;
  criteria: Criterium[];
  peers: PeerEvalStatus[];
  isLoading: boolean;
  error: string | null;
  loadEvaluation: (categoryId: string, groupMembers: CourseUser[]) => Promise<void>;
  submitScores: (evaluatedId: string, scores: Record<string, number>) => Promise<void>;
};

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

export function EvaluationProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<EvaluationRepository>(TOKENS.EvaluationRepo), [di]);

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [criteria, setCriteria] = useState<Criterium[]>([]);
  const [peers, setPeers] = useState<PeerEvalStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvaluation = async (categoryId: string, groupMembers: CourseUser[]) => {
    if (!loggedUser?.userId) return;
    try {
      setIsLoading(true);
      setError(null);

      const eval_ = await repo.getEvaluationByCategory(categoryId);
      setEvaluation(eval_);

      if (!eval_) {
        setPeers([]);
        setCriteria([]);
        return;
      }

      const [crit, results] = await Promise.all([
        repo.getCriteriaByEvaluation(eval_.evaluation_id),
        repo.getResultsByEvaluator(eval_.evaluation_id, loggedUser.userId),
      ]);

      setCriteria(crit);

      const evaluatedIds = new Set(results.map((r: ResultEvaluation) => r.evaluated_id));
      const peerList = groupMembers
        .filter((m) => m.user_id !== loggedUser.userId)
        .map((m) => ({ user: m, evaluated: evaluatedIds.has(m.user_id) }));

      setPeers(peerList);
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

  const submitScores = async (evaluatedId: string, scores: Record<string, number>) => {
    if (!loggedUser?.userId || !evaluation) return;
    try {
      setIsLoading(true);
      setError(null);

      const scoreEntries: NewResultCriterium[] = Object.entries(scores).map(([criteriumId, score]) => ({
        result_id: "",
        criterium_id: criteriumId,
        score,
      }));

      await repo.submitEvaluation(
        {
          evaluation_id: evaluation.evaluation_id,
          evaluator_id: loggedUser.userId,
          evaluated_id: evaluatedId,
        },
        scoreEntries
      );

      // Mark as evaluated locally
      setPeers((prev) =>
        prev.map((p) => (p.user.user_id === evaluatedId ? { ...p, evaluated: true } : p))
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
