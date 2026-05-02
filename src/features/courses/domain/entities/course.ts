export type Course = {
  _id: string;
  course_id: string;
  name: string;
  nrc: string;
  description: string;
};

export type UserCourse = {
  _id: string;
  course_id: string;
  user_id: string;
  role: string;
};

export type Category = {
  _id: string;
  category_id: string;
  name: string;
  description: string;
  course_id: string;
};

export type Group = {
  _id: string;
  group_id: string;
  name: string;
  category_id: string;
  created_at: string;
};

export type UserGroup = {
  _id: string;
  user_id: string;
  group_id: string;
};

export type CourseUser = {
  _id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};
