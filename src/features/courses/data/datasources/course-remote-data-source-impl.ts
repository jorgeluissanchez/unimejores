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
  private readonly authBaseUrl: string;
  private prefs: ILocalPreferences;

  constructor(
    private authService: AuthRemoteDataSourceImpl,
    projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID,
  ) {
    if (!projectId) throw new Error("Falta EXPO_PUBLIC_ROBLE_PROJECT_ID");
    const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://roble-api.openlab.uninorte.edu.co";
    this.baseUrl = `${apiBase}/database/${projectId}`;
    this.authBaseUrl = `${apiBase}/auth/${projectId}`;
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

            // Check if user has already evaluated all peers in the group
            const [groupMembers, myResults] = await Promise.all([
              this.readTable<{ user_id: string }>("user_group", { group_id: group._id }),
              this.readTable<{ evaluated_id: string }>("result_evaluation", { group_id: group._id, evaluator_id: userId }),
            ]);
            const peers = groupMembers.map((m) => m.user_id).filter((id) => id !== userId);
            const evaluatedIds = new Set(myResults.map((r) => r.evaluated_id));
            if (peers.length > 0 && peers.every((id) => evaluatedIds.has(id))) return null;

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

  async addCourse(course: NewCourse): Promise<Course> {
    const created = await this.insertAndReturn<Course>("course", course as Record<string, unknown>);
    if (!created) throw new Error("No se pudo crear el curso.");
    return created;
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

  async addCategory(category: NewCategory): Promise<Category> {
    const created = await this.insertAndReturn<Category>("category", category as Record<string, unknown>);
    if (!created) throw new Error("No se pudo crear la categoría.");
    return created;
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

  async addGroup(group: NewGroup): Promise<Group> {
    const created = await this.insertAndReturn<Group>("group", group as Record<string, unknown>);
    if (!created) throw new Error("No se pudo crear el grupo.");
    return created;
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
    const rows = await this.readTable<{ _id: string; user_id: string; course_id: string }>("user_course", { _id: userCourseId });
    const record = rows[0];
    if (record) {
      const cats = await this.readTable<{ _id: string }>("category", { course_id: record.course_id });
      await Promise.all(
        cats.map(async (cat) => {
          const groups = await this.readTable<{ _id: string }>("group", { category_id: cat._id });
          await Promise.all(
            groups.map(async (g) => {
              const ug = await this.readTable<{ _id: string }>("user_group", { group_id: g._id, user_id: record.user_id });
              await Promise.all(ug.map((r) => this.deleteRecord("user_group", r._id)));
            }),
          );
        }),
      );
    }
    await this.deleteRecord("user_course", userCourseId);
  }

  async getUserByEmail(email: string): Promise<{ userId: string; name: string; email: string } | null> {
    const rows = await this.readTable<{ user_id: string; name: string; email: string }>("user", { email });
    if (!rows[0]) return null;
    return { userId: rows[0].user_id, name: rows[0].name, email: rows[0].email };
  }

  async importGroupsCsv(courseId: string, csvContent: string, onProgress?: (completed: number, total: number) => void): Promise<void> {
    const text = csvContent.replace(/^﻿/, "");
    const lines = text.split(/\r?\n/).filter((l: string) => l.trim());
    if (lines.length < 2) throw new Error("El CSV está vacío o no tiene datos.");

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    const col = (...keys: string[]) => headers.findIndex((h) => keys.some((k) => h.includes(k)));
    const catIdx = col("group category name", "category");
    const grpIdx = col("group name", "grupo");
    const emailIdx = col("username", "email address", "email", "correo");
    const firstNameIdx = col("first name", "nombre");
    const lastNameIdx = col("last name", "apellido");
    if (catIdx < 0) throw new Error("El CSV debe tener columna 'Group Category Name'.");
    if (grpIdx < 0) throw new Error("El CSV debe tener columna 'Group Name'.");

    // ── Phase 1: Parse all rows ───────────────────────────────────────────────
    type ParsedRow = { catName: string; grpName: string; email: string; fullName: string };
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const catName = cols[catIdx]?.trim();
      const grpName = cols[grpIdx]?.trim();
      const email = emailIdx >= 0 ? cols[emailIdx]?.trim().toLowerCase() : "";
      const firstName = firstNameIdx >= 0 ? (cols[firstNameIdx]?.trim() ?? "") : "";
      const lastName = lastNameIdx >= 0 ? (cols[lastNameIdx]?.trim() ?? "") : "";
      if (!catName || !grpName) continue;
      rows.push({ catName, grpName, email: email ?? "", fullName: [firstName, lastName].filter(Boolean).join(" ") });
    }
    const total = rows.length;
    onProgress?.(0, total);

    // ── Phase 2: Ensure categories (sequential — usually very few) ────────────
    const existingCats = await this.readTable<{ _id: string; name: string }>("category", { course_id: courseId });
    const catMap = new Map(existingCats.map((c) => [c.name.toLowerCase().trim(), c._id]));
    for (const catName of [...new Set(rows.map((r) => r.catName))]) {
      const catKey = catName.toLowerCase().trim();
      if (!catMap.has(catKey)) {
        const created = await this.insertAndReturn<{ _id: string }>("category", { name: catName, description: "", course_id: courseId });
        if (created?._id) catMap.set(catKey, created._id);
      }
    }

    // ── Phase 3: Load existing groups in parallel, then create missing ones ───
    const catIds = [...catMap.values()];
    const existingGroupArrays = await Promise.all(
      catIds.map((catId) => this.readTable<{ _id: string; name: string }>("group", { category_id: catId })),
    );
    const groupMap = new Map<string, string>();
    catIds.forEach((catId, i) => {
      for (const g of existingGroupArrays[i]) groupMap.set(`${catId}|${g.name.toLowerCase().trim()}`, g._id);
    });
    const uniqueGroupKeys = [...new Set(rows.map((r) => `${r.catName}|||${r.grpName}`))];
    await Promise.all(uniqueGroupKeys.map(async (key) => {
      const [catName, grpName] = key.split("|||");
      const catId = catMap.get(catName.toLowerCase().trim());
      if (!catId) return;
      const mapKey = `${catId}|${grpName.toLowerCase().trim()}`;
      if (groupMap.has(mapKey)) return;
      const created = await this.insertAndReturn<{ _id: string }>("group", { name: grpName, category_id: catId });
      if (created?._id) groupMap.set(mapKey, created._id);
    }));

    // ── Phase 4: Pre-fetch all enrollment data in one parallel batch ──────────
    const allGroupIds = [...groupMap.values()];
    const [enrolledRecords, ...memberArrays] = await Promise.all([
      this.readTable<{ user_id: string }>("user_course", { course_id: courseId }),
      ...allGroupIds.map((gid) => this.readTable<{ user_id: string; group_id: string }>("user_group", { group_id: gid })),
    ]);
    const enrolledSet = new Set(enrolledRecords.map((r) => r.user_id));
    const memberSet = new Set(memberArrays.flat().map((r) => `${r.user_id}|${r.group_id}`));

    // ── Phase 5: Resolve unique users in parallel batches of 5 ────────────────
    const uniqueEmails = [...new Set(rows.filter((r) => r.email).map((r) => r.email))];
    const userMap = new Map<string, string>();
    const BATCH = 5;
    for (let i = 0; i < uniqueEmails.length; i += BATCH) {
      const batch = uniqueEmails.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(async (email) => {
        const fullName = rows.find((r) => r.email === email)?.fullName ?? "";
        const userId = await this.ensureStudentExists(email, fullName);
        return { email, userId };
      }));
      for (const { email, userId } of results) {
        if (userId) userMap.set(email, userId);
      }
      onProgress?.(Math.min(i + BATCH, total), total);
    }

    // ── Phase 6: Insert missing course + group assignments in parallel ─────────
    const inserts: Promise<void>[] = [];
    for (const row of rows) {
      const userId = row.email ? userMap.get(row.email) : undefined;
      if (!userId) continue;
      const catId = catMap.get(row.catName.toLowerCase().trim());
      if (!catId) continue;
      const groupId = groupMap.get(`${catId}|${row.grpName.toLowerCase().trim()}`);
      if (!groupId) continue;
      if (!enrolledSet.has(userId)) {
        enrolledSet.add(userId);
        inserts.push(this.insertRecord("user_course", { course_id: courseId, user_id: userId }));
      }
      const mk = `${userId}|${groupId}`;
      if (!memberSet.has(mk)) {
        memberSet.add(mk);
        inserts.push(this.insertRecord("user_group", { user_id: userId, group_id: groupId }));
      }
    }
    await Promise.all(inserts);
    onProgress?.(total, total);
  }

  private decodeJwtSub(token: string): string | null {
    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
      return JSON.parse(json).sub ?? null;
    } catch { return null; }
  }

  private async ensureStudentExists(email: string, name: string): Promise<string | null> {
    const existing = await this.readTable<{ user_id: string }>("user", { email });
    if (existing[0]) return existing[0].user_id;

    const password = "1" + email[0].toUpperCase() + email.slice(1);
    const signupRes = await fetch(`${this.authBaseUrl}/signup-direct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: name || email, password }),
    });
    if (!signupRes.ok) return null;

    let loginRes: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await new Promise((r) => setTimeout(r, attempt * 1000));
      loginRes = await fetch(`${this.authBaseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (loginRes.ok) break;
    }
    if (!loginRes?.ok) return null;

    const { accessToken } = await loginRes.json();
    const userId = this.decodeJwtSub(accessToken);
    if (!userId) return null;

    await this.insertRecord("user", { user_id: userId, email, name: name || email, role: "student" });
    return userId;
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
