import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
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
} from "@/features/professor/domain/entities/professor";
import { ProfessorRepository } from "@/features/professor/domain/repositories/professor-repository";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ProfessorContextType = {
  myCourses: Course[];
  myCriteria: Criterium[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;

  addCourse: (course: NewCourse) => Promise<void>;
  updateCourse: (course: Course) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  addCriterium: (c: NewCriterium) => Promise<void>;
  updateCriterium: (c: Criterium) => Promise<void>;
  deleteCriterium: (id: string) => Promise<void>;

  getCategoriesByCourse: (courseId: string) => Promise<Category[]>;
  addCategory: (category: NewCategory) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  getStudentsInCourse: (courseId: string) => Promise<StudentEnrollment[]>;
  getAvailableStudents: (courseId: string) => Promise<StudentEnrollment[]>;
  addStudentToCourse: (courseId: string, userId: string) => Promise<void>;
  removeStudentFromCourse: (userCourseId: string) => Promise<void>;

  getEvaluationByCategory: (categoryId: string) => Promise<ProfessorEvaluation | null>;
  createEvaluation: (evaluation: NewProfessorEvaluation) => Promise<void>;
  updateEvaluation: (evaluation: ProfessorEvaluation) => Promise<void>;
  getCriteriaForEvaluation: (evaluationId: string) => Promise<Criterium[]>;
  getEvaluationCriteria: (evaluationId: string) => Promise<EvaluationCriterium[]>;
  addCriteriumToEvaluation: (evaluationId: string, criteriumId: string) => Promise<void>;
  removeCriteriumFromEvaluation: (evaluationCriteriumId: string) => Promise<void>;

  addGroup: (group: NewGroup) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  getGroupMembersDetail: (groupId: string) => Promise<GroupMember[]>;
  addMemberToGroup: (userId: string, groupId: string) => Promise<void>;
  removeMemberFromGroup: (userGroupId: string) => Promise<void>;
  getUserByEmail: (email: string) => Promise<{ userId: string; name: string; email: string } | null>;
  getGroupsByCategory: (categoryId: string) => Promise<Group[]>;
  getMembersByGroup: (groupId: string) => Promise<StudentEnrollment[]>;
  getResultsByGroup: (groupId: string) => Promise<ResultEvaluation[]>;
};

const ProfessorContext = createContext<ProfessorContextType | undefined>(undefined);

export function ProfessorProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();

  const repo = useMemo(() => di.resolve<ProfessorRepository>(TOKENS.ProfessorRepo), [di]);

  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [myCriteria, setMyCriteria] = useState<Criterium[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const refresh = async () => {
    if (!loggedUser) return;
    try {
      setIsLoading(true);
      const [courses, criteria] = await Promise.all([
        repo.getMyCourses(loggedUser.userId),
        repo.getMyCriteria(loggedUser.userId),
      ]);
      setMyCourses(courses);
      setMyCriteria(criteria);
    } catch (e: any) {
      if (e?.message?.includes("401")) { await expireSession(); return; }
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const wrap = (fn: () => Promise<void>) => async () => {
    try {
      setIsLoading(true);
      clearError();
      await fn();
      await refresh();
    } catch (e: any) {
      if (e?.message?.includes("401")) { await expireSession(); return; }
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo<ProfessorContextType>(
    () => ({
      myCourses,
      myCriteria,
      isLoading,
      error,
      clearError,
      refresh,

      addCourse: (course) => wrap(() => repo.addCourse(course))(),
      updateCourse: (course) => wrap(() => repo.updateCourse(course))(),
      deleteCourse: (id) => wrap(() => repo.deleteCourse(id))(),

      addCriterium: (c) => wrap(() => repo.addCriterium(c))(),
      updateCriterium: (c) => wrap(() => repo.updateCriterium(c))(),
      deleteCriterium: (id) => wrap(() => repo.deleteCriterium(id))(),

      getCategoriesByCourse: (courseId) => repo.getCategoriesByCourse(courseId),
      addCategory: (category) => repo.addCategory(category),
      updateCategory: (category) => repo.updateCategory(category),
      deleteCategory: (id) => repo.deleteCategory(id),

      getStudentsInCourse: (courseId) => repo.getStudentsInCourse(courseId),
      getAvailableStudents: (courseId) => repo.getAvailableStudents(courseId),
      addStudentToCourse: (courseId, userId) => repo.addStudentToCourse(courseId, userId),
      removeStudentFromCourse: (userCourseId) => repo.removeStudentFromCourse(userCourseId),

      getEvaluationByCategory: (categoryId) => repo.getEvaluationByCategory(categoryId),
      createEvaluation: (evaluation) => repo.createEvaluation(evaluation),
      updateEvaluation: (evaluation) => repo.updateEvaluation(evaluation),
      getCriteriaForEvaluation: (evaluationId) => repo.getCriteriaForEvaluation(evaluationId),
      getEvaluationCriteria: (evaluationId) => repo.getEvaluationCriteria(evaluationId),
      addCriteriumToEvaluation: (evaluationId, criteriumId) => repo.addCriteriumToEvaluation(evaluationId, criteriumId),
      removeCriteriumFromEvaluation: (id) => repo.removeCriteriumFromEvaluation(id),

      addGroup: (group) => repo.addGroup(group),
      deleteGroup: (groupId) => repo.deleteGroup(groupId),
      getGroupMembersDetail: (groupId) => repo.getGroupMembersDetail(groupId),
      addMemberToGroup: (userId, groupId) => repo.addMemberToGroup(userId, groupId),
      removeMemberFromGroup: (userGroupId) => repo.removeMemberFromGroup(userGroupId),
      getUserByEmail: (email) => repo.getUserByEmail(email),
      getGroupsByCategory: (categoryId) => repo.getGroupsByCategory(categoryId),
      getMembersByGroup: (groupId) => repo.getMembersByGroup(groupId),
      getResultsByGroup: (groupId) => repo.getResultsByGroup(groupId),
    }),
    [myCourses, myCriteria, isLoading, error, repo],
  );

  return <ProfessorContext.Provider value={value}>{children}</ProfessorContext.Provider>;
}

export function useProfessor() {
  const ctx = useContext(ProfessorContext);
  if (!ctx) throw new Error("useProfessor debe usarse dentro de ProfessorProvider");
  return ctx;
}
