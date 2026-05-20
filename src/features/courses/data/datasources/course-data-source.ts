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

export interface CourseDataSource {
  // Student
  getMyEnrolledCourses(userId: string): Promise<Course[]>;
  getPendingEvaluations(userId: string, courses: Course[]): Promise<PendingEvalData[]>;
  getGroupByCategory(categoryId: string, userId: string): Promise<Group | null>;
  getMembersByGroupIds(groupId: string): Promise<UserGroup[]>;
  getUserById(userId: string): Promise<CourseUser | null>;

  // Professor: courses
  getMyCreatedCourses(userId: string): Promise<Course[]>;
  addCourse(course: NewCourse): Promise<void>;
  updateCourse(course: Course): Promise<void>;
  deleteCourse(id: string): Promise<void>;

  // Professor: categories
  getCategoriesByCourse(courseId: string): Promise<Category[]>;
  addCategory(category: NewCategory): Promise<void>;
  updateCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  // Professor: groups
  getGroupsByCategory(categoryId: string): Promise<Group[]>;
  addGroup(group: NewGroup): Promise<void>;
  updateGroup(group: Group): Promise<void>;
  deleteGroup(groupId: string): Promise<void>;

  // Professor: group members
  getGroupMembersDetail(groupId: string): Promise<GroupMember[]>;
  addMemberToGroup(userId: string, groupId: string): Promise<void>;
  removeMemberFromGroup(userGroupId: string): Promise<void>;
  getMembersByGroup(groupId: string): Promise<StudentEnrollment[]>;

  // Professor: student enrollment
  getStudentsInCourse(courseId: string): Promise<StudentEnrollment[]>;
  getAvailableStudents(courseId: string): Promise<StudentEnrollment[]>;
  addStudentToCourse(courseId: string, userId: string): Promise<void>;
  removeStudentFromCourse(userCourseId: string): Promise<void>;
  getUserByEmail(email: string): Promise<{ userId: string; name: string; email: string } | null>;

  // CSV import (professor)
  importGroupsCsv(courseId: string, csvContent: string): Promise<void>;
}
