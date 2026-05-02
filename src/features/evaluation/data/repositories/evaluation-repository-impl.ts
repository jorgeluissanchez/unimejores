import { EvaluationRemoteDataSourceImpl } from "@/features/evaluation/data/datasources/evaluation-remote-data-source-impl";
import {
  Criterium,
  Evaluation,
  NewResultCriterium,
  NewResultEvaluation,
  ResultEvaluation,
} from "@/features/evaluation/domain/entities/evaluation";
import { EvaluationRepository } from "@/features/evaluation/domain/repositories/evaluation-repository";

export class EvaluationRepositoryImpl implements EvaluationRepository {
  constructor(private ds: EvaluationRemoteDataSourceImpl) {}

  getEvaluationByCategory(categoryId: string): Promise<Evaluation | null> {
    return this.ds.getEvaluationByCategory(categoryId);
  }

  getCriteriaByEvaluation(evaluationId: string): Promise<Criterium[]> {
    return this.ds.getCriteriaByEvaluation(evaluationId);
  }

  getResultsByEvaluator(evaluationId: string, evaluatorId: string): Promise<ResultEvaluation[]> {
    return this.ds.getResultsByEvaluator(evaluationId, evaluatorId);
  }

  submitEvaluation(result: NewResultEvaluation, scores: NewResultCriterium[]): Promise<void> {
    return this.ds.submitEvaluation(result, scores);
  }
}
