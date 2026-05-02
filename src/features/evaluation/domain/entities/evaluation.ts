export type Evaluation = {
  _id: string;
  evaluation_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  category_id: string;
  created_by: string;
};

export type Criterium = {
  _id: string;
  criterium_id: string;
  name: string;
  description: string;
  max_score: number;
};

export type EvaluationCriterium = {
  _id: string;
  evaluation_id: string;
  criterium_id: string;
};

export type ResultEvaluation = {
  _id: string;
  resultEvaluation_id: string;
  evaluation_id: string;
  evaluator_id: string;
  evaluated_id: string;
};

export type ResultCriterium = {
  _id: string;
  result_id: string;
  criterium_id: string;
  score: number;
};

export type NewResultEvaluation = Omit<ResultEvaluation, "_id" | "resultEvaluation_id">;
export type NewResultCriterium = Omit<ResultCriterium, "_id">;
