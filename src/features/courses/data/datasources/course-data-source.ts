import { Category, Course, CourseUser, Group, UserGroup } from "@/features/courses/domain/entities/course";

export interface CourseDataSource {
  getMyCourses(userId: string): Promise<Course[]>;
  getCategoriesByCourse(courseId: string): Promise<Category[]>;
  getGroupByCategory(categoryId: string, userId: string): Promise<Group | null>;
  getMembersByGroup(groupId: string): Promise<UserGroup[]>;
  getUserById(userId: string): Promise<CourseUser | null>;
}
