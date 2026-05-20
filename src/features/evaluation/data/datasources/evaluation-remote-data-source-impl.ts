import { ILocalPreferences } from "@/core/storage/i-local-preferences";
import { LocalPreferencesAsyncStorage } from "@/core/storage/local-preferences-async-storage";
import { AuthRemoteDataSourceImpl } from "@/features/auth/data/datasources/auth-remote-data-source-impl";
import { EvaluationDataSource } from "@/features/evaluation/data/datasources/evaluation-data-source";
import {
  Criterium,
  Evaluation,
  EvaluationCriterium,
  NewCriterium,
  NewEvaluation,
  ResultEvaluation,
} from "@/features/evaluation/domain/entities/evaluation";

export class EvaluationRemoteDataSourceImpl implements EvaluationDataSource {
  private readonly baseUrl: string;
  private prefs: ILocalPreferences;

  constructor(
    private authService: AuthRemoteDataSourceImpl,
    projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID,
  ) {
    if (!projectId) throw new Error("Falta EXPO_PUBLIC_ROBLE_PROJECT_ID");
    this.baseUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://roble-api.openlab.uninorte.edu.co"}/database/${projectId}`;
    this.prefs = LocalPreferencesAsyncStorage.getInstance();
  }

  private async authorizedFetch(url: string, options: RequestInit, retry = true): Promise<Response> {
    const token = await this.prefs.retrieveData<string>("token");
    const headers = { ...(options.headers ?? {}), Authorization: `Bearer ${token}` };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 && retry) {
      const refreshed = await this.authService.refreshToken();
      if (refreshed) {
        const newToken = await this.prefs.retrieveData<string>("token");
        return fetch(url, { ...options, headers: { ...(options.headers ?? {}), Authorization: `Bearer ${newToken}` } });
      }
    }
    return response;
  }

  private async readTable<T>(tableName: string, filters?: Record<string, string>): Promise<T[]> {
    const params = new URLSearchParams({ tableName, ...(filters ?? {}) });
    const response = await this.authorizedFetch(`${this.baseUrl}/read?${params}`, { method: "GET" });
    if (!response.ok) throw new Error(`Error leyendo ${tableName}: ${response.status}`);
    return response.json();
  }

  private async insertRecord(tableName: string, record: Record<string, unknown>): Promise<void> {
    const response = await this.authorizedFetch(`${this.baseUrl}/insert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableName, records: [record] }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Error insertando en ${tableName}: ${body.message ?? response.status}`);
    }
  }

  private async updateRecord(tableName: string, id: string, updates: Record<string, unknown>): Promise<void> {
    const response = await this.authorizedFetch(`${this.baseUrl}/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableName, idColumn: "_id", idValue: id, updates }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Error actualizando en ${tableName}: ${body.message ?? response.status}`);
    }
  }

  private async deleteRecord(tableName: string, id: string): Promise<void> {
    const response = await this.authorizedFetch(`${this.baseUrl}/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableName, idColumn: "_id", idValue: id }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Error eliminando en ${tableName}: ${body.message ?? response.status}`);
    }
  }

  // ── Student ───────────────────────────────────────────────────────────────

  async getEvaluationByGroup(groupId: string): Promise<Evaluation | null> {
    const groups = await this.readTable<{ category_id: string }>("group", { _id: groupId });
    const categoryId = groups[0]?.category_id;
    if (!categoryId) return null;
    const rows = await this.readTable<Evaluation>("evaluation", { category_id: categoryId });
    return rows[0] ?? null;
  }

  async getCriteriaByEvaluation(evaluationId: string): Promise<Criterium[]> {
    const links = await this.readTable<EvaluationCriterium>("evaluation_criterium", { evaluation_id: evaluationId });
    if (links.length === 0) return [];
    const criteria = await Promise.all(
      links.map(async (link) => {
        const rows = await this.readTable<Criterium>("criterium", { _id: link.criterium_id });
        return rows[0] ?? null;
      }),
    );
    return criteria.filter(Boolean) as Criterium[];
  }

  async getResultsByEvaluatorInGroup(groupId: string, evaluatorId: string): Promise<ResultEvaluation[]> {
    return this.readTable<ResultEvaluation>("result_evaluation", { group_id: groupId, evaluator_id: evaluatorId });
  }

  async getResultsForEvaluatedInGroup(groupId: string, evaluatedId: string): Promise<ResultEvaluation[]> {
    return this.readTable<ResultEvaluation>("result_evaluation", { group_id: groupId, evaluated_id: evaluatedId });
  }

  async submitEvaluation(groupId: string, evaluatorId: string, evaluatedId: string, scores: Record<string, number>): Promise<void> {
    await Promise.all(
      Object.entries(scores).map(([criteriumId, score]) =>
        this.insertRecord("result_evaluation", {
          evaluator_id: evaluatorId,
          evaluated_id: evaluatedId,
          score: String(score),
          group_id: groupId,
          criterium_id: criteriumId,
        }),
      ),
    );
  }

  // ── Professor: Criteria ───────────────────────────────────────────────────

  async getMyCriteria(userId: string): Promise<Criterium[]> {
    return this.readTable<Criterium>("criterium", { created_by: userId });
  }

  async addCriterium(criterium: NewCriterium): Promise<void> {
    await this.insertRecord("criterium", criterium as Record<string, unknown>);
  }

  async updateCriterium({ _id, ...updates }: Criterium): Promise<void> {
    await this.updateRecord("criterium", _id, updates);
  }

  async deleteCriterium(id: string): Promise<void> {
    const links = await this.readTable<{ _id: string }>("evaluation_criterium", { criterium_id: id });
    await Promise.all(links.map((l) => this.deleteRecord("evaluation_criterium", l._id)));
    const results = await this.readTable<{ _id: string }>("result_evaluation", { criterium_id: id });
    await Promise.all(results.map((r) => this.deleteRecord("result_evaluation", r._id)));
    await this.deleteRecord("criterium", id);
  }

  // ── Professor: Evaluations ────────────────────────────────────────────────

  async getEvaluationByCategory(categoryId: string): Promise<Evaluation | null> {
    const rows = await this.readTable<Evaluation>("evaluation", { category_id: categoryId });
    return rows[0] ?? null;
  }

  async createEvaluation(evaluation: NewEvaluation): Promise<void> {
    await this.insertRecord("evaluation", evaluation as Record<string, unknown>);
  }

  async updateEvaluation({ _id, ...updates }: Evaluation): Promise<void> {
    await this.updateRecord("evaluation", _id, updates);
  }

  async deleteEvaluation(id: string): Promise<void> {
    const links = await this.readTable<{ _id: string }>("evaluation_criterium", { evaluation_id: id });
    await Promise.all(links.map((l) => this.deleteRecord("evaluation_criterium", l._id)));
    await this.deleteRecord("evaluation", id);
  }

  // ── Professor: Evaluation-criteria links ──────────────────────────────────

  async getCriteriaForEvaluation(evaluationId: string): Promise<Criterium[]> {
    const links = await this.readTable<EvaluationCriterium>("evaluation_criterium", { evaluation_id: evaluationId });
    if (links.length === 0) return [];
    const criteria = await Promise.all(
      links.map(async (link) => {
        const rows = await this.readTable<Criterium>("criterium", { _id: link.criterium_id });
        return rows[0] ?? null;
      }),
    );
    return criteria.filter(Boolean) as Criterium[];
  }

  async getEvaluationCriteria(evaluationId: string): Promise<EvaluationCriterium[]> {
    return this.readTable<EvaluationCriterium>("evaluation_criterium", { evaluation_id: evaluationId });
  }

  async addCriteriumToEvaluation(evaluationId: string, criteriumId: string): Promise<void> {
    await this.insertRecord("evaluation_criterium", { evaluation_id: evaluationId, criterium_id: criteriumId });
  }

  async removeCriteriumFromEvaluation(evaluationCriteriumId: string): Promise<void> {
    await this.deleteRecord("evaluation_criterium", evaluationCriteriumId);
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  async getResultsByGroup(groupId: string): Promise<ResultEvaluation[]> {
    return this.readTable<ResultEvaluation>("result_evaluation", { group_id: groupId });
  }
}
