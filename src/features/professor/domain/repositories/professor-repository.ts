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
} from "../entities/professor";

export interface ProfessorRepository {
  // Courses
  getMyCourses(userId: string): Promise<Course[]>;
  addCourse(course: NewCourse): Promise<void>;
  updateCourse(course: Course): Promise<void>;
  deleteCourse(id: string): Promise<void>;

  // Criteria
  getMyCriteria(userId: string): Promise<Criterium[]>;
  addCriterium(criterium: NewCriterium): Promise<void>;
  updateCriterium(criterium: Criterium): Promise<void>;
  deleteCriterium(id: string): Promise<void>;

  // Categories
  getCategoriesByCourse(courseId: string): Promise<Category[]>;
  addCategory(category: NewCategory): Promise<void>;
  updateCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  // Students
  getStudentsInCourse(courseId: string): Promise<StudentEnrollment[]>;
  getAvailableStudents(courseId: string): Promise<StudentEnrollment[]>;
  addStudentToCourse(courseId: string, userId: string): Promise<void>;
  removeStudentFromCourse(userCourseId: string): Promise<void>;

  // Evaluation (one per category)
  getEvaluationByCategory(categoryId: string): Promise<ProfessorEvaluation | null>;
  createEvaluation(evaluation: NewProfessorEvaluation): Promise<void>;
  updateEvaluation(evaluation: ProfessorEvaluation): Promise<void>;

  // Evaluation criteria
  getCriteriaForEvaluation(evaluationId: string): Promise<Criterium[]>;
  getEvaluationCriteria(evaluationId: string): Promise<EvaluationCriterium[]>;
  addCriteriumToEvaluation(evaluationId: string, criteriumId: string): Promise<void>;
  removeCriteriumFromEvaluation(evaluationCriteriumId: string): Promise<void>;

  // Groups management
  addGroup(group: NewGroup): Promise<void>;
  deleteGroup(groupId: string): Promise<void>;
  updateGroup(group: Group): Promise<void>;
  getGroupMembersDetail(groupId: string): Promise<GroupMember[]>;
  addMemberToGroup(userId: string, groupId: string): Promise<void>;
  removeMemberFromGroup(userGroupId: string): Promise<void>;
  getUserByEmail(email: string): Promise<{ userId: string; name: string; email: string } | null>;

  // Reports
  getGroupsByCategory(categoryId: string): Promise<Group[]>;
  getMembersByGroup(groupId: string): Promise<StudentEnrollment[]>;
  getResultsByGroup(groupId: string): Promise<ResultEvaluation[]>;
}
