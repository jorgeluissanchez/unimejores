import { ResultEvaluation } from "@/features/evaluation/domain/entities/evaluation";

/** Promedia los scores de un arreglo de ResultEvaluation, redondeado a 1 decimal. Retorna null si no hay scores. */
export function avg(scores: ResultEvaluation[]): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((s, r) => s + parseFloat(r.score), 0);
  return Math.round((sum / scores.length) * 10) / 10;
}
