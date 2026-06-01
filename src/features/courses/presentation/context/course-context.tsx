import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
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
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type CourseContextType = {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;

  // Student-only state
  pendingEvaluations: PendingEvalData[];
  pendingLoading: boolean;

  // Read (both roles)
  getCategoriesByCourse: (courseId: string) => Promise<Category[]>;
  getGroupsByCategory: (categoryId: string) => Promise<Group[]>;
  getGroupMembersDetail: (groupId: string) => Promise<GroupMember[]>;
  getMembersByGroup: (groupId: string) => Promise<StudentEnrollment[]>;

  // Student course detail
  getGroupByCategory: (categoryId: string, userId: string) => Promise<Group | null>;
  getMembersByGroupIds: (groupId: string) => Promise<UserGroup[]>;
  getUserById: (userId: string) => Promise<CourseUser | null>;

  // Professor: course CRUD
  addCourse: (course: NewCourse) => Promise<Course>;
  updateCourse: (course: Course) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  // Professor: category CRUD
  addCategory: (category: NewCategory) => Promise<Category>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Professor: group CRUD
  addGroup: (group: NewGroup) => Promise<Group>;
  updateGroup: (group: Group) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  addMemberToGroup: (userId: string, groupId: string) => Promise<void>;
  removeMemberFromGroup: (userGroupId: string) => Promise<void>;

  // Professor: student enrollment
  getStudentsInCourse: (courseId: string) => Promise<StudentEnrollment[]>;
  getAvailableStudents: (courseId: string) => Promise<StudentEnrollment[]>;
  addStudentToCourse: (courseId: string, userId: string) => Promise<void>;
  removeStudentFromCourse: (userCourseId: string) => Promise<void>;
  getUserByEmail: (email: string) => Promise<{ userId: string; name: string; email: string } | null>;
  importGroupsCsv: (courseId: string, csvContent: string, onProgress?: (completed: number, total: number) => void) => Promise<void>;
};

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<CourseRepository>(TOKENS.CourseRepo), [di]);

  const isProfessor = loggedUser?.role === "professor";

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEvaluations, setPendingEvaluations] = useState<PendingEvalData[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const loadPendingEvaluations = useCallback(async (courseList: Course[], userId: string) => {
    if (courseList.length === 0) return;
    try {
      setPendingLoading(true);
      const result = await repo.getPendingEvaluations(userId, courseList);
      setPendingEvaluations(result);
    } catch {
      // non-critical
    } finally {
      setPendingLoading(false);
    }
  }, [repo]);

  const refresh = useCallback(async () => {
    if (!loggedUser?.userId) return;
    try {
      setIsLoading(true);
      clearError();
      if (isProfessor) {
        const list = await repo.getMyCreatedCourses(loggedUser.userId);
        setCourses(list);
      } else {
        const list = await repo.getMyEnrolledCourses(loggedUser.userId);
        setCourses(list);
        loadPendingEvaluations(list, loggedUser.userId);
      }
    } catch (e) {
      if (isSessionExpiredError(e)) { await expireSession(); setCourses([]); return; }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [loggedUser?.userId, loggedUser?.role, repo]);

  useEffect(() => { refresh(); }, [loggedUser?.userId]);

  const wrap = useCallback((fn: () => Promise<void>) => async () => {
    try {
      setIsLoading(true);
      clearError();
      await fn();
      await refresh();
    } catch (e) {
      if (isSessionExpiredError(e)) { await expireSession(); return; }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const value = useMemo<CourseContextType>(() => ({
    courses,
    isLoading,
    error,
    clearError,
    refresh,
    pendingEvaluations,
    pendingLoading,

    getCategoriesByCourse: (courseId) => repo.getCategoriesByCourse(courseId),
    getGroupsByCategory: (categoryId) => repo.getGroupsByCategory(categoryId),
    getGroupMembersDetail: (groupId) => repo.getGroupMembersDetail(groupId),
    getMembersByGroup: (groupId) => repo.getMembersByGroup(groupId),

    getGroupByCategory: (categoryId, userId) => repo.getGroupByCategory(categoryId, userId),
    getMembersByGroupIds: (groupId) => repo.getMembersByGroupIds(groupId),
    getUserById: (userId) => repo.getUserById(userId),

    addCourse: async (course) => {
      const created = await repo.addCourse(course);
      setCourses((prev) => [...prev, created]);
      return created;
    },
    updateCourse: (course) => wrap(() => repo.updateCourse(course))(),
    deleteCourse: (id) => wrap(() => repo.deleteCourse(id))(),

    addCategory: (category) => repo.addCategory(category),
    updateCategory: (category) => repo.updateCategory(category),
    deleteCategory: (id) => repo.deleteCategory(id),

    addGroup: (group) => repo.addGroup(group),
    updateGroup: (group) => repo.updateGroup(group),
    deleteGroup: (groupId) => repo.deleteGroup(groupId),
    addMemberToGroup: (userId, groupId) => repo.addMemberToGroup(userId, groupId),
    removeMemberFromGroup: (userGroupId) => repo.removeMemberFromGroup(userGroupId),

    getStudentsInCourse: (courseId) => repo.getStudentsInCourse(courseId),
    getAvailableStudents: (courseId) => repo.getAvailableStudents(courseId),
    addStudentToCourse: (courseId, userId) => repo.addStudentToCourse(courseId, userId),
    removeStudentFromCourse: (userCourseId) => repo.removeStudentFromCourse(userCourseId),
    getUserByEmail: (email) => repo.getUserByEmail(email),
    importGroupsCsv: (courseId, csvContent, onProgress) => repo.importGroupsCsv(courseId, csvContent, onProgress),
  }), [courses, isLoading, error, pendingEvaluations, pendingLoading, repo, wrap]);

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourses() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error("useCourses debe usarse dentro de CourseProvider");
  return ctx;
}
