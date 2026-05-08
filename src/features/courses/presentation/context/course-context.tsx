import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Course, PendingEvalData } from "@/features/courses/domain/entities/course";
import { CourseRepository } from "@/features/courses/domain/repositories/course-repository";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type CourseContextType = {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  refreshCourses: () => Promise<void>;
  pendingEvaluations: PendingEvalData[];
  pendingLoading: boolean;
};

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<CourseRepository>(TOKENS.CourseRepo), [di]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEvaluations, setPendingEvaluations] = useState<PendingEvalData[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const refreshCourses = async () => {
    if (!loggedUser?.userId) return;
    try {
      setIsLoading(true);
      setError(null);
      const list = await repo.getMyCourses(loggedUser.userId);
      setCourses(list);
      loadPendingEvaluations(list, loggedUser.userId);
    } catch (e) {
      if (isSessionExpiredError(e)) {
        await expireSession();
        setCourses([]);
        return;
      }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingEvaluations = async (courseList: Course[], userId: string) => {
    if (courseList.length === 0) return;
    try {
      setPendingLoading(true);
      const result = await repo.getPendingEvaluations(userId, courseList);
      setPendingEvaluations(result);
    } catch {
      // non-critical, silently fail
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    refreshCourses();
  }, [loggedUser?.userId]);

  const value = useMemo(
    () => ({ courses, isLoading, error, refreshCourses, pendingEvaluations, pendingLoading }),
    [courses, isLoading, error, pendingEvaluations, pendingLoading]
  );

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourses() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error("useCourses debe usarse dentro de CourseProvider");
  return ctx;
}
