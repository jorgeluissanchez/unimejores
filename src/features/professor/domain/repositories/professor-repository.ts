import {
  Category,
  Course,
  Criterium,
  EvaluationCriterium,
  NewCategory,
  NewCourse,
  NewCriterium,
  NewProfessorEvaluation,
  ProfessorEvaluation,
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
}
