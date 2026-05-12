import { ILocalPreferences } from "@/core/storage/i-local-preferences";
import { LocalPreferencesAsyncStorage } from "@/core/storage/local-preferences-async-storage";
import { AuthRemoteDataSourceImpl } from "@/features/auth/data/datasources/auth-remote-data-source-impl";
import {
  Category,
  Course,
  Criterium,
  EvaluationCriterium,
  Group,
  GroupMember,
  NewCategory,
  NewCourse,
  NewCriterium,
  NewGroup,
  NewProfessorEvaluation,
  ProfessorEvaluation,
  ResultEvaluation,
  StudentEnrollment,
} from "../../domain/entities/professor";
import { ProfessorDataSource } from "./professor-data-source";

export class ProfessorRemoteDataSourceImpl implements ProfessorDataSource {
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

  // ── Courses ──────────────────────────────────────────────────────────────

  async getMyCourses(userId: string): Promise<Course[]> {
    return this.readTable<Course>("course", { created_by: userId });
  }

  async addCourse(course: NewCourse): Promise<void> {
    await this.insertRecord("course", course);
  }

  async updateCourse({ _id, ...updates }: Course): Promise<void> {
    await this.updateRecord("course", _id, updates);
  }

  async deleteCourse(id: string): Promise<void> {
    await this.deleteRecord("course", id);
  }

  // ── Criteria ─────────────────────────────────────────────────────────────

  async getMyCriteria(userId: string): Promise<Criterium[]> {
    return this.readTable<Criterium>("criterium", { created_by: userId });
  }

  async addCriterium(criterium: NewCriterium): Promise<void> {
    await this.insertRecord("criterium", criterium);
  }

  async updateCriterium({ _id, ...updates }: Criterium): Promise<void> {
    await this.updateRecord("criterium", _id, updates);
  }

  async deleteCriterium(id: string): Promise<void> {
    await this.deleteRecord("criterium", id);
  }

  // ── Categories ───────────────────────────────────────────────────────────

  async getCategoriesByCourse(courseId: string): Promise<Category[]> {
    return this.readTable<Category>("category", { course_id: courseId });
  }

  async addCategory(category: NewCategory): Promise<void> {
    await this.insertRecord("category", category);
  }

  async updateCategory({ _id, ...updates }: Category): Promise<void> {
    await this.updateRecord("category", _id, updates);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.deleteRecord("category", id);
  }

  // ── Students ─────────────────────────────────────────────────────────────

  async getStudentsInCourse(courseId: string): Promise<StudentEnrollment[]> {
    const userCourses = await this.readTable<{ _id: string; user_id: string }>("user_course", { course_id: courseId });
    if (userCourses.length === 0) return [];
    const enrollments = await Promise.all(
      userCourses.map(async (uc) => {
        const users = await this.readTable<{ user_id: string; name: string; email: string; role: string }>(
          "user",
          { user_id: uc.user_id },
        );
        if (!users[0] || users[0].role !== "student") return null;
        return {
          userCourseId: uc._id,
          userId: uc.user_id,
          name: users[0].name,
          email: users[0].email,
        } as StudentEnrollment;
      }),
    );
    return enrollments.filter(Boolean) as StudentEnrollment[];
  }

  async getAvailableStudents(courseId: string): Promise<StudentEnrollment[]> {
    const [enrolled, allStudents] = await Promise.all([
      this.readTable<{ user_id: string }>("user_course", { course_id: courseId }),
      this.readTable<{ user_id: string; name: string; email: string; role: string }>("user", { role: "student" }),
    ]);
    const enrolledIds = new Set(enrolled.map((e) => e.user_id));
    return allStudents
      .filter((u) => !enrolledIds.has(u.user_id))
      .map((u) => ({ userCourseId: "", userId: u.user_id, name: u.name, email: u.email }));
  }

  async addStudentToCourse(courseId: string, userId: string): Promise<void> {
    await this.insertRecord("user_course", { course_id: courseId, user_id: userId });
  }

  async removeStudentFromCourse(userCourseId: string): Promise<void> {
    await this.deleteRecord("user_course", userCourseId);
  }

  // ── Evaluation ───────────────────────────────────────────────────────────

  async getEvaluationByCategory(categoryId: string): Promise<ProfessorEvaluation | null> {
    const rows = await this.readTable<ProfessorEvaluation>("evaluation", { category_id: categoryId });
    return rows[0] ?? null;
  }

  async createEvaluation(evaluation: NewProfessorEvaluation): Promise<void> {
    await this.insertRecord("evaluation", evaluation);
  }

  async updateEvaluation({ _id, ...updates }: ProfessorEvaluation): Promise<void> {
    await this.updateRecord("evaluation", _id, updates);
  }

  // ── Evaluation criteria ──────────────────────────────────────────────────

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

  // ── Groups management ────────────────────────────────────────────────────────

  async addGroup(group: NewGroup): Promise<void> {
    await this.insertRecord("group", group);
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.deleteRecord("group", groupId);
  }

  async getGroupMembersDetail(groupId: string): Promise<GroupMember[]> {
    const userGroups = await this.readTable<{ _id: string; user_id: string }>("user_group", { group_id: groupId });
    if (userGroups.length === 0) return [];
    const members = await Promise.all(
      userGroups.map(async (ug) => {
        const users = await this.readTable<{ user_id: string; name: string; email: string }>("user", { user_id: ug.user_id });
        if (!users[0]) return null;
        return { userGroupId: ug._id, userId: ug.user_id, name: users[0].name, email: users[0].email } as GroupMember;
      }),
    );
    return members.filter(Boolean) as GroupMember[];
  }

  async addMemberToGroup(userId: string, groupId: string): Promise<void> {
    await this.insertRecord("user_group", { user_id: userId, group_id: groupId });
  }

  async removeMemberFromGroup(userGroupId: string): Promise<void> {
    await this.deleteRecord("user_group", userGroupId);
  }

  async getUserByEmail(email: string): Promise<{ userId: string; name: string; email: string } | null> {
    const rows = await this.readTable<{ user_id: string; name: string; email: string }>("user", { email });
    if (!rows[0]) return null;
    return { userId: rows[0].user_id, name: rows[0].name, email: rows[0].email };
  }

  // ── Reports ──────────────────────────────────────────────────────────────────

  async getGroupsByCategory(categoryId: string): Promise<Group[]> {
    return this.readTable<Group>("group", { category_id: categoryId });
  }

  async getMembersByGroup(groupId: string): Promise<StudentEnrollment[]> {
    const userGroups = await this.readTable<{ _id: string; user_id: string }>("user_group", { group_id: groupId });
    if (userGroups.length === 0) return [];
    const members = await Promise.all(
      userGroups.map(async (ug) => {
        const users = await this.readTable<{ user_id: string; name: string; email: string }>("user", { user_id: ug.user_id });
        if (!users[0]) return null;
        return { userCourseId: ug._id, userId: ug.user_id, name: users[0].name, email: users[0].email } as StudentEnrollment;
      }),
    );
    return members.filter(Boolean) as StudentEnrollment[];
  }

  async getResultsByGroup(groupId: string): Promise<ResultEvaluation[]> {
    return this.readTable<ResultEvaluation>("result_evaluation", { group_id: groupId });
  }
}
