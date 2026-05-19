import { ILocalPreferences } from "@/core/storage/i-local-preferences";
import { LocalPreferencesAsyncStorage } from "@/core/storage/local-preferences-async-storage";
import { AuthRemoteDataSourceImpl } from "@/features/auth/data/datasources/auth-remote-data-source-impl";
import { EvaluationDataSource } from "@/features/evaluation/data/datasources/evaluation-data-source";
import {
  Criterium,
  Evaluation,
  EvaluationCriterium,
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
    const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && retry) {
      const refreshed = await this.authService.refreshToken();
      if (refreshed) {
        const newToken = await this.prefs.retrieveData<string>("token");
        return fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${newToken}` } });
      }
    }
    return response;
  }

  private async readTable<T>(tableName: string, filters?: Record<string, string>): Promise<T[]> {
    const params = new URLSearchParams({ tableName, ...filters });
    const url = `${this.baseUrl}/read?${params.toString()}`;
    const response = await this.authorizedFetch(url, { method: "GET" });
    if (!response.ok) throw new Error(`Error leyendo ${tableName}: ${response.status}`);
    return response.json();
  }

  private async insertRecord(tableName: string, record: object): Promise<void> {
    const url = `${this.baseUrl}/insert`;
    const response = await this.authorizedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableName, records: [record] }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Error insertando en ${tableName}: ${body.message ?? response.status}`);
    }
  }

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
      })
    );
    return criteria.filter(Boolean) as Criterium[];
  }

  async getResultsByEvaluatorInGroup(groupId: string, evaluatorId: string): Promise<ResultEvaluation[]> {
    return this.readTable<ResultEvaluation>("result_evaluation", {
      group_id: groupId,
      evaluator_id: evaluatorId,
    });
  }

  async getResultsForEvaluatedInGroup(groupId: string, evaluatedId: string): Promise<ResultEvaluation[]> {
    return this.readTable<ResultEvaluation>("result_evaluation", {
      group_id: groupId,
      evaluated_id: evaluatedId,
    });
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
        })
      )
    );
  }
}
