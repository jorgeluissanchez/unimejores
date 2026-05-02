import { CourseDataSource } from "@/features/courses/data/datasources/course-data-source";
import { Category, Course, CourseUser, Group, UserGroup } from "@/features/courses/domain/entities/course";
import { CourseRepository } from "@/features/courses/domain/repositories/course-repository";

export class CourseRepositoryImpl implements CourseRepository {
  constructor(private ds: CourseDataSource) {}

  getMyCourses(userId: string): Promise<Course[]> {
    return this.ds.getMyCourses(userId);
  }

  getCategoriesByCourse(courseId: string): Promise<Category[]> {
    return this.ds.getCategoriesByCourse(courseId);
  }

  getGroupByCategory(categoryId: string, userId: string): Promise<Group | null> {
    return this.ds.getGroupByCategory(categoryId, userId);
  }

  getMembersByGroup(groupId: string): Promise<UserGroup[]> {
    return this.ds.getMembersByGroup(groupId);
  }

  getUserById(userId: string): Promise<CourseUser | null> {
    return this.ds.getUserById(userId);
  }
}
