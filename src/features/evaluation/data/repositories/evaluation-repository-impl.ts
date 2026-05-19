import { EvaluationDataSource } from "@/features/evaluation/data/datasources/evaluation-data-source";
import {
  Criterium,
  Evaluation,
  EvaluationCriterium,
  NewCriterium,
  NewEvaluation,
  ResultEvaluation,
} from "@/features/evaluation/domain/entities/evaluation";
import { EvaluationRepository } from "@/features/evaluation/domain/repositories/evaluation-repository";

export class EvaluationRepositoryImpl implements EvaluationRepository {
  constructor(private ds: EvaluationDataSource) {}

  getEvaluationByGroup(groupId: string): Promise<Evaluation | null> { return this.ds.getEvaluationByGroup(groupId); }
  getCriteriaByEvaluation(evaluationId: string): Promise<Criterium[]> { return this.ds.getCriteriaByEvaluation(evaluationId); }
  getResultsByEvaluatorInGroup(groupId: string, evaluatorId: string): Promise<ResultEvaluation[]> { return this.ds.getResultsByEvaluatorInGroup(groupId, evaluatorId); }
  getResultsForEvaluatedInGroup(groupId: string, evaluatedId: string): Promise<ResultEvaluation[]> { return this.ds.getResultsForEvaluatedInGroup(groupId, evaluatedId); }
  submitEvaluation(groupId: string, evaluatorId: string, evaluatedId: string, scores: Record<string, number>): Promise<void> { return this.ds.submitEvaluation(groupId, evaluatorId, evaluatedId, scores); }

  getMyCriteria(userId: string): Promise<Criterium[]> { return this.ds.getMyCriteria(userId); }
  addCriterium(criterium: NewCriterium): Promise<void> { return this.ds.addCriterium(criterium); }
  updateCriterium(criterium: Criterium): Promise<void> { return this.ds.updateCriterium(criterium); }
  deleteCriterium(id: string): Promise<void> { return this.ds.deleteCriterium(id); }

  getEvaluationByCategory(categoryId: string): Promise<Evaluation | null> { return this.ds.getEvaluationByCategory(categoryId); }
  createEvaluation(evaluation: NewEvaluation): Promise<void> { return this.ds.createEvaluation(evaluation); }
  updateEvaluation(evaluation: Evaluation): Promise<void> { return this.ds.updateEvaluation(evaluation); }

  getCriteriaForEvaluation(evaluationId: string): Promise<Criterium[]> { return this.ds.getCriteriaForEvaluation(evaluationId); }
  getEvaluationCriteria(evaluationId: string): Promise<EvaluationCriterium[]> { return this.ds.getEvaluationCriteria(evaluationId); }
  addCriteriumToEvaluation(evaluationId: string, criteriumId: string): Promise<void> { return this.ds.addCriteriumToEvaluation(evaluationId, criteriumId); }
  removeCriteriumFromEvaluation(evaluationCriteriumId: string): Promise<void> { return this.ds.removeCriteriumFromEvaluation(evaluationCriteriumId); }

  getResultsByGroup(groupId: string): Promise<ResultEvaluation[]> { return this.ds.getResultsByGroup(groupId); }
}
