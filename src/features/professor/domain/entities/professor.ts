import { Category, Course, Group } from "@/features/courses/domain/entities/course";

export type { Course, Category, Group };

export type NewCourse = Omit<Course, "_id">;
export type NewCategory = Omit<Category, "_id">;

export type Criterium = {
  _id: string;
  name: string;
  description: string;
  created_by: string;
};

export type NewCriterium = Omit<Criterium, "_id">;

export type ProfessorEvaluation = {
  _id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  category_id: string;
};

export type NewProfessorEvaluation = Omit<ProfessorEvaluation, "_id">;

export type EvaluationCriterium = {
  _id: string;
  evaluation_id: string;
  criterium_id: string;
};

export type StudentEnrollment = {
  userCourseId: string;
  userId: string;
  name: string;
  email: string;
};

export type ResultEvaluation = {
  _id: string;
  evaluator_id: string;
  evaluated_id: string;
  score: string;
  group_id: string;
  criterium_id: string;
};

export type NewGroup = { name: string; category_id: string };

export type GroupMember = {
  userGroupId: string;
  userId: string;
  name: string;
  email: string;
};
