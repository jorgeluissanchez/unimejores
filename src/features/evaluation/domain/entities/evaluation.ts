export type Evaluation = {
  _id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  category_id: string;
};

export type NewEvaluation = Omit<Evaluation, "_id">;

export type Criterium = {
  _id: string;
  name: string;
  description: string;
  created_by: string;
};

export type NewCriterium = Omit<Criterium, "_id">;

export type EvaluationCriterium = {
  _id: string;
  evaluation_id: string;
  criterium_id: string;
};

export type ResultEvaluation = {
  _id: string;
  evaluator_id: string;
  evaluated_id: string;
  score: string;
  group_id: string;
  criterium_id: string;
};
