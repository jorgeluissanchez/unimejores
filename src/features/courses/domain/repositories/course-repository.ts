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

export interface CourseRepository {
  // Student: enrolled courses
  getMyEnrolledCourses(userId: string): Promise<Course[]>;
  getPendingEvaluations(userId: string, courses: Course[]): Promise<PendingEvalData[]>;

  // Professor: created courses
  getMyCreatedCourses(userId: string): Promise<Course[]>;
  addCourse(course: NewCourse): Promise<Course>;
  updateCourse(course: Course): Promise<void>;
  deleteCourse(id: string): Promise<void>;

  // Categories (professor)
  getCategoriesByCourse(courseId: string): Promise<Category[]>;
  addCategory(category: NewCategory): Promise<Category>;
  updateCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  // Groups (professor)
  getGroupsByCategory(categoryId: string): Promise<Group[]>;
  addGroup(group: NewGroup): Promise<Group>;
  updateGroup(group: Group): Promise<void>;
  deleteGroup(groupId: string): Promise<void>;

  // Group members (professor)
  getGroupMembersDetail(groupId: string): Promise<GroupMember[]>;
  addMemberToGroup(userId: string, groupId: string): Promise<void>;
  removeMemberFromGroup(userGroupId: string): Promise<void>;
  getMembersByGroup(groupId: string): Promise<StudentEnrollment[]>;

  // Students enrollment (professor)
  getStudentsInCourse(courseId: string): Promise<StudentEnrollment[]>;
  getAvailableStudents(courseId: string): Promise<StudentEnrollment[]>;
  addStudentToCourse(courseId: string, userId: string): Promise<void>;
  removeStudentFromCourse(userCourseId: string): Promise<void>;
  getUserByEmail(email: string): Promise<{ userId: string; name: string; email: string } | null>;
  importGroupsCsv(courseId: string, csvContent: string, onProgress?: (completed: number, total: number) => void): Promise<void>;

  // Student course detail
  getGroupByCategory(categoryId: string, userId: string): Promise<Group | null>;
  getMembersByGroupIds(groupId: string): Promise<UserGroup[]>;
  getUserById(userId: string): Promise<CourseUser | null>;
}
