import { Criterium, Evaluation, ResultEvaluation } from "@/features/evaluation/domain/entities/evaluation";

export interface EvaluationRepository {
  getEvaluationByGroup(groupId: string): Promise<Evaluation | null>;
  getCriteriaByEvaluation(evaluationId: string): Promise<Criterium[]>;
  getResultsByEvaluatorInGroup(groupId: string, evaluatorId: string): Promise<ResultEvaluation[]>;
  submitEvaluation(groupId: string, evaluatorId: string, evaluatedId: string, scores: Record<string, number>): Promise<void>;
}
