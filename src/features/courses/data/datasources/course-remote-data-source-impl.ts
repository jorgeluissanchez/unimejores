import { ILocalPreferences } from "@/core/storage/i-local-preferences";
import { LocalPreferencesAsyncStorage } from "@/core/storage/local-preferences-async-storage";
import { AuthRemoteDataSourceImpl } from "@/features/auth/data/datasources/auth-remote-data-source-impl";
import { CourseDataSource } from "@/features/courses/data/datasources/course-data-source";
import { Category, Course, CourseUser, Group, PendingEvalData, UserGroup } from "@/features/courses/domain/entities/course";

export class CourseRemoteDataSourceImpl implements CourseDataSource {
  private readonly projectId: string;
  private readonly baseUrl: string;
  private prefs: ILocalPreferences;

  constructor(
    private authService: AuthRemoteDataSourceImpl,
    projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID,
  ) {
    if (!projectId) throw new Error("Falta EXPO_PUBLIC_ROBLE_PROJECT_ID");
    this.projectId = projectId;
    this.baseUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://roble-api.openlab.uninorte.edu.co"}/database/${this.projectId}`;
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

  async getMyCourses(userId: string): Promise<Course[]> {
    const userCourses = await this.readTable<{ course_id: string }>("user_course", { user_id: userId });
    if (userCourses.length === 0) return [];
    const courses = await Promise.all(
      userCourses.map(async (uc) => {
        const rows = await this.readTable<Course>("course", { _id: uc.course_id });
        return rows[0] ?? null;
      })
    );
    return courses.filter(Boolean) as Course[];
  }

  async getCategoriesByCourse(courseId: string): Promise<Category[]> {
    return this.readTable<Category>("category", { course_id: courseId });
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

  async getMembersByGroup(groupId: string): Promise<UserGroup[]> {
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
          })
        );
        return perCategory.filter(Boolean) as PendingEvalData[];
      })
    );
    return perCourse.flat().sort(
      (a, b) => new Date(a.evaluationEndDate).getTime() - new Date(b.evaluationEndDate).getTime()
    );
  }
}
