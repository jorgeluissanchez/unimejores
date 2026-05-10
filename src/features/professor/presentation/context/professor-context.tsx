import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import {
    Course,
    Criterium,
    NewCourse,
    NewCriterium,
} from "@/features/professor/domain/entities/professor";
import { ProfessorRepository } from "@/features/professor/domain/repositories/professor-repository";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ProfessorContextType = {
  myCourses: Course[];
  myCriteria: Criterium[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  addCourse: (course: NewCourse) => Promise<void>;
  updateCourse: (course: Course) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  addCriterium: (c: NewCriterium) => Promise<void>;
  updateCriterium: (c: Criterium) => Promise<void>;
  deleteCriterium: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
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

  const addCourse = (course: NewCourse) => wrap(() => repo.addCourse(course))();
  const updateCourse = (course: Course) => wrap(() => repo.updateCourse(course))();
  const deleteCourse = (id: string) => wrap(() => repo.deleteCourse(id))();

  const addCriterium = (c: NewCriterium) => wrap(() => repo.addCriterium(c))();
  const updateCriterium = (c: Criterium) => wrap(() => repo.updateCriterium(c))();
  const deleteCriterium = (id: string) => wrap(() => repo.deleteCriterium(id))();

  const value = useMemo(
    () => ({ myCourses, myCriteria, isLoading, error, clearError, addCourse, updateCourse, deleteCourse, addCriterium, updateCriterium, deleteCriterium, refresh }),
    [myCourses, myCriteria, isLoading, error],
  );

  return <ProfessorContext.Provider value={value}>{children}</ProfessorContext.Provider>;
}

export function useProfessor() {
  const ctx = useContext(ProfessorContext);
  if (!ctx) throw new Error("useProfessor debe usarse dentro de ProfessorProvider");
  return ctx;
}
