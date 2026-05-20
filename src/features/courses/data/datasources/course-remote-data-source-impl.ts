import { parseCsvLine } from "@/core/lib/utils";
import { ILocalPreferences } from "@/core/storage/i-local-preferences";
import { LocalPreferencesAsyncStorage } from "@/core/storage/local-preferences-async-storage";
import { AuthRemoteDataSourceImpl } from "@/features/auth/data/datasources/auth-remote-data-source-impl";
import { CourseDataSource } from "@/features/courses/data/datasources/course-data-source";
import {
  Category,
  Course,
  CourseUser,
  Group,
  GroupMember,
  NewCategory,
  NewCourse,
  NewGroup,
  PendingEvalData,
  StudentEnrollment,
  UserGroup,
} from "@/features/courses/domain/entities/course";

export class CourseRemoteDataSourceImpl implements CourseDataSource {
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

  async getMyEnrolledCourses(userId: string): Promise<Course[]> {
    const userCourses = await this.readTable<{ course_id: string }>("user_course", { user_id: userId });
    if (userCourses.length === 0) return [];
    const courses = await Promise.all(
      userCourses.map(async (uc) => {
        const rows = await this.readTable<Course>("course", { _id: uc.course_id });
        return rows[0] ?? null;
      }),
    );
    return courses.filter(Boolean) as Course[];
  }

  async getGroupByCategory(categoryId: string, userId: string): Promise<Group | null> {
    const userGroups = await this.readTable<UserGroup>("user_group", { user_id: userId });
    if (userGroups.length === 0) return null;
    for (const ug of userGroups) {
      const rows = await this.readTable<Group>("group", { _id: ug.group_id, category_id: categoryId });
      if (rows.length > 0) return rows[0];
    }
    return null;
  }

  async getMembersByGroupIds(groupId: string): Promise<UserGroup[]> {
    return this.readTable<UserGroup>("user_group", { group_id: groupId });
  }

  async getUserById(userId: string): Promise<CourseUser | null> {
    const rows = await this.readTable<CourseUser>("user", { user_id: userId });
    return rows[0] ?? null;
  }

  async getPendingEvaluations(userId: string, courses: Course[]): Promise<PendingEvalData[]> {
    const now = new Date();
    const perCourse = await Promise.all(
      courses.map(async (course) => {
        const categories = await this.getCategoriesByCourse(course._id);
        const perCategory = await Promise.all(
          categories.map(async (category) => {
            const [group, evals] = await Promise.all([
              this.getGroupByCategory(category._id, userId),
              this.readTable<{ _id: string; title: string; end_date: string }>("evaluation", { category_id: category._id }),
            ]);
            if (!group || !evals[0]) return null;
            const ev = evals[0];
            if (new Date(ev.end_date) <= now) return null;
            return {
              evaluationId: ev._id,
              evaluationTitle: ev.title,
              evaluationEndDate: ev.end_date,
              courseName: course.name,
              courseId: course._id,
              groupId: group._id,
            } as PendingEvalData;
          }),
        );
        return perCategory.filter(Boolean) as PendingEvalData[];
      }),
    );
    return perCourse.flat().sort(
      (a, b) => new Date(a.evaluationEndDate).getTime() - new Date(b.evaluationEndDate).getTime(),
    );
  }

  // ── Professor: Courses ────────────────────────────────────────────────────

  async getMyCreatedCourses(userId: string): Promise<Course[]> {
    return this.readTable<Course>("course", { created_by: userId });
  }

  async addCourse(course: NewCourse): Promise<void> {
    await this.insertRecord("course", course as Record<string, unknown>);
  }

  async updateCourse({ _id, ...updates }: Course): Promise<void> {
    await this.updateRecord("course", _id, updates);
  }

  async deleteCourse(id: string): Promise<void> {
    const cats = await this.readTable<{ _id: string }>("category", { course_id: id });
    await Promise.all(cats.map((c) => this.deleteCategory(c._id)));
    const uc = await this.readTable<{ _id: string }>("user_course", { course_id: id });
    await Promise.all(uc.map((r) => this.deleteRecord("user_course", r._id)));
    await this.deleteRecord("course", id);
  }

  // ── Professor: Categories ─────────────────────────────────────────────────

  async getCategoriesByCourse(courseId: string): Promise<Category[]> {
    return this.readTable<Category>("category", { course_id: courseId });
  }

  async addCategory(category: NewCategory): Promise<void> {
    await this.insertRecord("category", category as Record<string, unknown>);
  }

  async updateCategory({ _id, ...updates }: Category): Promise<void> {
    await this.updateRecord("category", _id, updates);
  }

  async deleteCategory(id: string): Promise<void> {
    const groups = await this.readTable<{ _id: string }>("group", { category_id: id });
    await Promise.all(groups.map((g) => this.deleteGroup(g._id)));
    const evals = await this.readTable<{ _id: string }>("evaluation", { category_id: id });
    await Promise.all(
      evals.map(async (ev) => {
        const links = await this.readTable<{ _id: string }>("evaluation_criterium", { evaluation_id: ev._id });
        await Promise.all(links.map((l) => this.deleteRecord("evaluation_criterium", l._id)));
        await this.deleteRecord("evaluation", ev._id);
      }),
    );
    await this.deleteRecord("category", id);
  }

  // ── Professor: Groups ─────────────────────────────────────────────────────

  async getGroupsByCategory(categoryId: string): Promise<Group[]> {
    return this.readTable<Group>("group", { category_id: categoryId });
  }

  async addGroup(group: NewGroup): Promise<void> {
    await this.insertRecord("group", group as Record<string, unknown>);
  }

  async updateGroup({ _id, ...updates }: Group): Promise<void> {
    await this.updateRecord("group", _id, updates);
  }

  async deleteGroup(groupId: string): Promise<void> {
    const ug = await this.readTable<{ _id: string }>("user_group", { group_id: groupId });
    await Promise.all(ug.map((r) => this.deleteRecord("user_group", r._id)));
    const results = await this.readTable<{ _id: string }>("result_evaluation", { group_id: groupId });
    await Promise.all(results.map((r) => this.deleteRecord("result_evaluation", r._id)));
    await this.deleteRecord("group", groupId);
  }

  // ── Professor: Group members ──────────────────────────────────────────────

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

  // ── Professor: Student enrollment ─────────────────────────────────────────

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
        return { userCourseId: uc._id, userId: uc.user_id, name: users[0].name, email: users[0].email } as StudentEnrollment;
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

  async getUserByEmail(email: string): Promise<{ userId: string; name: string; email: string } | null> {
    const rows = await this.readTable<{ user_id: string; name: string; email: string }>("user", { email });
    if (!rows[0]) return null;
    return { userId: rows[0].user_id, name: rows[0].name, email: rows[0].email };
  }

  async importGroupsCsv(courseId: string, csvContent: string): Promise<void> {
    const text = csvContent.replace(/^﻿/, "");
    const lines = text.split(/\r?\n/).filter((l: string) => l.trim());
    if (lines.length < 2) throw new Error("El CSV está vacío o no tiene datos.");

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    const col = (...keys: string[]) => headers.findIndex((h) => keys.some((k) => h.includes(k)));
    const catIdx = col("group category name", "category");
    const grpIdx = col("group name", "grupo");
    const emailIdx = col("username", "email address", "email", "correo");
    if (catIdx < 0) throw new Error("El CSV debe tener columna 'Group Category Name'.");
    if (grpIdx < 0) throw new Error("El CSV debe tener columna 'Group Name'.");

    // Load existing categories and groups into maps to avoid redundant reads
    const existingCats = await this.readTable<{ _id: string; name: string }>("category", { course_id: courseId });
    const catMap = new Map(existingCats.map((c) => [c.name.toLowerCase().trim(), c._id]));

    const groupMap = new Map<string, string>(); // "catId|groupNameKey" -> groupId
    for (const cat of existingCats) {
      const groups = await this.readTable<{ _id: string; name: string }>("group", { category_id: cat._id });
      for (const g of groups) groupMap.set(`${cat._id}|${g.name.toLowerCase().trim()}`, g._id);
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const catName = cols[catIdx]?.trim();
      const grpName = cols[grpIdx]?.trim();
      const email = emailIdx >= 0 ? cols[emailIdx]?.trim().toLowerCase() : undefined;
      if (!catName || !grpName) continue;

      // Ensure category exists
      const catKey = catName.toLowerCase().trim();
      if (!catMap.has(catKey)) {
        const created = await this.insertAndReturn<{ _id: string }>("category", { name: catName, description: "", course_id: courseId });
        if (created?._id) catMap.set(catKey, created._id);
      }
      const catId = catMap.get(catKey);
      if (!catId) continue;

      // Ensure group exists
      const grpKey = `${catId}|${grpName.toLowerCase().trim()}`;
      if (!groupMap.has(grpKey)) {
        const created = await this.insertAndReturn<{ _id: string }>("group", { name: grpName, category_id: catId });
        if (created?._id) groupMap.set(grpKey, created._id);
      }
      const groupId = groupMap.get(grpKey);
      if (!groupId || !email) continue;

      // Look up user by email and assign to course + group
      const users = await this.readTable<{ user_id: string }>("user", { email });
      const user = users[0];
      if (!user) continue;

      const enrolled = await this.readTable("user_course", { course_id: courseId, user_id: user.user_id });
      if (enrolled.length === 0) await this.insertRecord("user_course", { course_id: courseId, user_id: user.user_id });

      const inGroup = await this.readTable("user_group", { user_id: user.user_id, group_id: groupId });
      if (inGroup.length === 0) await this.insertRecord("user_group", { user_id: user.user_id, group_id: groupId });
    }
  }

  private async insertAndReturn<T>(tableName: string, record: Record<string, unknown>): Promise<T | null> {
    const response = await this.authorizedFetch(`${this.baseUrl}/insert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableName, records: [record] }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Error insertando en ${tableName}: ${body.message ?? response.status}`);
    }
    const data = await response.json();
    return data.inserted?.[0] ?? null;
  }
}
