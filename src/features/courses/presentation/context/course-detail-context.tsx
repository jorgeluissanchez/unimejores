import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Category, CourseUser, Group } from "@/features/courses/domain/entities/course";
import { CourseRepository } from "@/features/courses/domain/repositories/course-repository";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CategoryState = {
  category: Category;
  group: Group | null;
  members: CourseUser[];
};

type CourseDetailContextType = {
  courseId: string;
  categoryStates: CategoryState[];
  activeCategoryId: string | null;
  setActiveCategoryId: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const CourseDetailContext = createContext<CourseDetailContextType | undefined>(undefined);

export function CourseDetailProvider({ courseId, children }: { courseId: string; children: React.ReactNode }) {
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<CourseRepository>(TOKENS.CourseRepo), [di]);

  const [categoryStates, setCategoryStates] = useState<CategoryState[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!courseId || !loggedUser?.userId) return;
    try {
      setIsLoading(true);
      setError(null);
      const categories = await repo.getCategoriesByCourse(courseId);

      const states = await Promise.all(
        categories.map(async (cat) => {
          const group = await repo.getGroupByCategory(cat.category_id, loggedUser.userId);
          let members: CourseUser[] = [];
          if (group) {
            const userGroups = await repo.getMembersByGroup(group.group_id);
            const memberDetails = await Promise.all(
              userGroups.map((ug) => repo.getUserById(ug.user_id))
            );
            members = memberDetails.filter(Boolean) as CourseUser[];
          }
          return { category: cat, group, members };
        })
      );

      setCategoryStates(states);
      setActiveCategoryId((current) => current ?? states[0]?.category._id ?? null);
    } catch (e) {
      if (isSessionExpiredError(e)) {
        await expireSession();
        setError(null);
        return;
      }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [courseId, loggedUser?.userId]);

  const value = useMemo(
    () => ({ courseId, categoryStates, activeCategoryId, setActiveCategoryId, isLoading, error, reload }),
    [courseId, categoryStates, activeCategoryId, isLoading, error]
  );

  return <CourseDetailContext.Provider value={value}>{children}</CourseDetailContext.Provider>;
}

export function useCourseDetail() {
  const ctx = useContext(CourseDetailContext);
  if (!ctx) throw new Error("useCourseDetail debe usarse dentro de CourseDetailProvider");
  return ctx;
}
