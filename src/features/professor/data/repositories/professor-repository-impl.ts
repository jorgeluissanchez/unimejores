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
} from "../../domain/entities/professor";
import { ProfessorRepository } from "../../domain/repositories/professor-repository";
import { ProfessorDataSource } from "../datasources/professor-data-source";

export class ProfessorRepositoryImpl implements ProfessorRepository {
  constructor(private ds: ProfessorDataSource) {}

  getMyCourses(userId: string): Promise<Course[]> { return this.ds.getMyCourses(userId); }
  addCourse(course: NewCourse): Promise<void> { return this.ds.addCourse(course); }
  updateCourse(course: Course): Promise<void> { return this.ds.updateCourse(course); }
  deleteCourse(id: string): Promise<void> { return this.ds.deleteCourse(id); }

  getMyCriteria(userId: string): Promise<Criterium[]> { return this.ds.getMyCriteria(userId); }
  addCriterium(criterium: NewCriterium): Promise<void> { return this.ds.addCriterium(criterium); }
  updateCriterium(criterium: Criterium): Promise<void> { return this.ds.updateCriterium(criterium); }
  deleteCriterium(id: string): Promise<void> { return this.ds.deleteCriterium(id); }

  getCategoriesByCourse(courseId: string): Promise<Category[]> { return this.ds.getCategoriesByCourse(courseId); }
  addCategory(category: NewCategory): Promise<void> { return this.ds.addCategory(category); }
  updateCategory(category: Category): Promise<void> { return this.ds.updateCategory(category); }
  deleteCategory(id: string): Promise<void> { return this.ds.deleteCategory(id); }

  getStudentsInCourse(courseId: string): Promise<StudentEnrollment[]> { return this.ds.getStudentsInCourse(courseId); }
  getAvailableStudents(courseId: string): Promise<StudentEnrollment[]> { return this.ds.getAvailableStudents(courseId); }
  addStudentToCourse(courseId: string, userId: string): Promise<void> { return this.ds.addStudentToCourse(courseId, userId); }
  removeStudentFromCourse(userCourseId: string): Promise<void> { return this.ds.removeStudentFromCourse(userCourseId); }

  getEvaluationByCategory(categoryId: string): Promise<ProfessorEvaluation | null> { return this.ds.getEvaluationByCategory(categoryId); }
  createEvaluation(evaluation: NewProfessorEvaluation): Promise<void> { return this.ds.createEvaluation(evaluation); }
  updateEvaluation(evaluation: ProfessorEvaluation): Promise<void> { return this.ds.updateEvaluation(evaluation); }

  getCriteriaForEvaluation(evaluationId: string): Promise<Criterium[]> { return this.ds.getCriteriaForEvaluation(evaluationId); }
  getEvaluationCriteria(evaluationId: string): Promise<EvaluationCriterium[]> { return this.ds.getEvaluationCriteria(evaluationId); }
  addCriteriumToEvaluation(evaluationId: string, criteriumId: string): Promise<void> { return this.ds.addCriteriumToEvaluation(evaluationId, criteriumId); }
  removeCriteriumFromEvaluation(evaluationCriteriumId: string): Promise<void> { return this.ds.removeCriteriumFromEvaluation(evaluationCriteriumId); }

  addGroup(group: NewGroup): Promise<void> { return this.ds.addGroup(group); }
  deleteGroup(groupId: string): Promise<void> { return this.ds.deleteGroup(groupId); }
  updateGroup(group: Group): Promise<void> { return this.ds.updateGroup(group); }
  getGroupMembersDetail(groupId: string): Promise<GroupMember[]> { return this.ds.getGroupMembersDetail(groupId); }
  addMemberToGroup(userId: string, groupId: string): Promise<void> { return this.ds.addMemberToGroup(userId, groupId); }
  removeMemberFromGroup(userGroupId: string): Promise<void> { return this.ds.removeMemberFromGroup(userGroupId); }
  getUserByEmail(email: string): Promise<{ userId: string; name: string; email: string } | null> { return this.ds.getUserByEmail(email); }

  getGroupsByCategory(categoryId: string): Promise<Group[]> { return this.ds.getGroupsByCategory(categoryId); }
  getMembersByGroup(groupId: string): Promise<StudentEnrollment[]> { return this.ds.getMembersByGroup(groupId); }
  getResultsByGroup(groupId: string): Promise<ResultEvaluation[]> { return this.ds.getResultsByGroup(groupId); }
}
