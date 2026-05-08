import { EvaluationRemoteDataSourceImpl } from "@/features/evaluation/data/datasources/evaluation-remote-data-source-impl";
import { Criterium, Evaluation, ResultEvaluation } from "@/features/evaluation/domain/entities/evaluation";
import { EvaluationRepository } from "@/features/evaluation/domain/repositories/evaluation-repository";

export class EvaluationRepositoryImpl implements EvaluationRepository {
  constructor(private ds: EvaluationRemoteDataSourceImpl) {}

  getEvaluationByGroup(groupId: string): Promise<Evaluation | null> {
    return this.ds.getEvaluationByGroup(groupId);
  }

  getCriteriaByEvaluation(evaluationId: string): Promise<Criterium[]> {
    return this.ds.getCriteriaByEvaluation(evaluationId);
  }

  getResultsByEvaluatorInGroup(groupId: string, evaluatorId: string): Promise<ResultEvaluation[]> {
    return this.ds.getResultsByEvaluatorInGroup(groupId, evaluatorId);
  }

  getResultsForEvaluatedInGroup(groupId: string, evaluatedId: string): Promise<ResultEvaluation[]> {
    return this.ds.getResultsForEvaluatedInGroup(groupId, evaluatedId);
  }

  submitEvaluation(groupId: string, evaluatorId: string, evaluatedId: string, scores: Record<string, number>): Promise<void> {
    return this.ds.submitEvaluation(groupId, evaluatorId, evaluatedId, scores);
  }
}
