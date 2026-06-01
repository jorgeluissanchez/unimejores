import {
  Criterium,
  Evaluation,
  EvaluationCriterium,
  NewCriterium,
  NewEvaluation,
  ResultEvaluation,
} from "@/features/evaluation/domain/entities/evaluation";

export interface EvaluationDataSource {
  // Student
  getEvaluationByGroup(groupId: string): Promise<Evaluation | null>;
  getCriteriaByEvaluation(evaluationId: string): Promise<Criterium[]>;
  getResultsByEvaluatorInGroup(groupId: string, evaluatorId: string): Promise<ResultEvaluation[]>;
  getResultsForEvaluatedInGroup(groupId: string, evaluatedId: string): Promise<ResultEvaluation[]>;
  submitEvaluation(groupId: string, evaluatorId: string, evaluatedId: string, scores: Record<string, number>): Promise<void>;

  // Professor: criteria
  getMyCriteria(userId: string): Promise<Criterium[]>;
  addCriterium(criterium: NewCriterium): Promise<void>;
  updateCriterium(criterium: Criterium): Promise<void>;
  deleteCriterium(id: string): Promise<void>;

  // Professor: evaluations
  getEvaluationByCategory(categoryId: string): Promise<Evaluation | null>;
  getEvaluationsByCategory(categoryId: string): Promise<Evaluation[]>;
  createEvaluation(evaluation: NewEvaluation): Promise<Evaluation>;
  updateEvaluation(evaluation: Evaluation): Promise<void>;
  deleteEvaluation(id: string): Promise<void>;

  // Professor: evaluation-criteria links
  getCriteriaForEvaluation(evaluationId: string): Promise<Criterium[]>;
  getEvaluationCriteria(evaluationId: string): Promise<EvaluationCriterium[]>;
  addCriteriumToEvaluation(evaluationId: string, criteriumId: string): Promise<void>;
  removeCriteriumFromEvaluation(evaluationCriteriumId: string): Promise<void>;

  // Reports
  getResultsByGroup(groupId: string): Promise<ResultEvaluation[]>;
}
