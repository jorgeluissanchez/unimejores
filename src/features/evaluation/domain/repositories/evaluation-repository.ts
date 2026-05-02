import {
  Criterium,
  Evaluation,
  NewResultCriterium,
  NewResultEvaluation,
  ResultEvaluation,
} from "@/features/evaluation/domain/entities/evaluation";

export interface EvaluationRepository {
  getEvaluationByCategory(categoryId: string): Promise<Evaluation | null>;
  getCriteriaByEvaluation(evaluationId: string): Promise<Criterium[]>;
  getResultsByEvaluator(evaluationId: string, evaluatorId: string): Promise<ResultEvaluation[]>;
  submitEvaluation(result: NewResultEvaluation, scores: NewResultCriterium[]): Promise<void>;
}
