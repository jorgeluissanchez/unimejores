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
import { CourseRepository } from "@/features/courses/domain/repositories/course-repository";

export class CourseRepositoryImpl implements CourseRepository {
  constructor(private ds: CourseDataSource) {}

  getMyEnrolledCourses(userId: string): Promise<Course[]> { return this.ds.getMyEnrolledCourses(userId); }
  getPendingEvaluations(userId: string, courses: Course[]): Promise<PendingEvalData[]> { return this.ds.getPendingEvaluations(userId, courses); }
  getGroupByCategory(categoryId: string, userId: string): Promise<Group | null> { return this.ds.getGroupByCategory(categoryId, userId); }
  getMembersByGroupIds(groupId: string): Promise<UserGroup[]> { return this.ds.getMembersByGroupIds(groupId); }
  getUserById(userId: string): Promise<CourseUser | null> { return this.ds.getUserById(userId); }

  getMyCreatedCourses(userId: string): Promise<Course[]> { return this.ds.getMyCreatedCourses(userId); }
  addCourse(course: NewCourse): Promise<void> { return this.ds.addCourse(course); }
  updateCourse(course: Course): Promise<void> { return this.ds.updateCourse(course); }
  deleteCourse(id: string): Promise<void> { return this.ds.deleteCourse(id); }

  getCategoriesByCourse(courseId: string): Promise<Category[]> { return this.ds.getCategoriesByCourse(courseId); }
  addCategory(category: NewCategory): Promise<void> { return this.ds.addCategory(category); }
  updateCategory(category: Category): Promise<void> { return this.ds.updateCategory(category); }
  deleteCategory(id: string): Promise<void> { return this.ds.deleteCategory(id); }

  getGroupsByCategory(categoryId: string): Promise<Group[]> { return this.ds.getGroupsByCategory(categoryId); }
  addGroup(group: NewGroup): Promise<void> { return this.ds.addGroup(group); }
  updateGroup(group: Group): Promise<void> { return this.ds.updateGroup(group); }
  deleteGroup(groupId: string): Promise<void> { return this.ds.deleteGroup(groupId); }

  getGroupMembersDetail(groupId: string): Promise<GroupMember[]> { return this.ds.getGroupMembersDetail(groupId); }
  addMemberToGroup(userId: string, groupId: string): Promise<void> { return this.ds.addMemberToGroup(userId, groupId); }
  removeMemberFromGroup(userGroupId: string): Promise<void> { return this.ds.removeMemberFromGroup(userGroupId); }
  getMembersByGroup(groupId: string): Promise<StudentEnrollment[]> { return this.ds.getMembersByGroup(groupId); }

  getStudentsInCourse(courseId: string): Promise<StudentEnrollment[]> { return this.ds.getStudentsInCourse(courseId); }
  getAvailableStudents(courseId: string): Promise<StudentEnrollment[]> { return this.ds.getAvailableStudents(courseId); }
  addStudentToCourse(courseId: string, userId: string): Promise<void> { return this.ds.addStudentToCourse(courseId, userId); }
  removeStudentFromCourse(userCourseId: string): Promise<void> { return this.ds.removeStudentFromCourse(userCourseId); }
  getUserByEmail(email: string): Promise<{ userId: string; name: string; email: string } | null> { return this.ds.getUserByEmail(email); }
  importGroupsCsv(courseId: string, csvContent: string): Promise<void> { return this.ds.importGroupsCsv(courseId, csvContent); }
}
