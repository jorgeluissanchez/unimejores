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
}
