import { faker } from "@faker-js/faker";

faker.seed(42); // deterministic data

// ─── helpers ────────────────────────────────────────────────────────────────

const id = () => faker.string.uuid();

// ─── users ───────────────────────────────────────────────────────────────────

export const MOCK_USER_ID = "user-logged-in";
export const MOCK_EMAIL = "estudiante@uninorte.edu.co";
export const MOCK_PASSWORD = "password123";

export const users = [
  {
    _id: MOCK_USER_ID,
    user_id: MOCK_USER_ID,
    name: "Estudiante Demo",
    email: MOCK_EMAIL,
    role: "student",
    created_at: faker.date.past().toISOString(),
  },
  ...Array.from({ length: 8 }, () => {
    const uid = id();
    return {
      _id: uid,
      user_id: uid,
      name: faker.person.fullName(),
      email: faker.internet.email({ provider: "uninorte.edu.co" }),
      role: "student",
      created_at: faker.date.past().toISOString(),
    };
  }),
];

// ─── courses ─────────────────────────────────────────────────────────────────

const course1Id = "course-sistemas";
const course2Id = "course-redes";

export const courses = [
  {
    _id: course1Id,
    course_id: course1Id,
    name: "Ingeniería de Software",
    nrc: "10234",
    description: "Diseño y desarrollo de sistemas de software de calidad.",
  },
  {
    _id: course2Id,
    course_id: course2Id,
    name: "Redes de Computadores",
    nrc: "10891",
    description: "Fundamentos de redes, protocolos y arquitecturas.",
  },
];

// ─── user_course ─────────────────────────────────────────────────────────────

export const userCourses = [
  { _id: id(), course_id: course1Id, user_id: MOCK_USER_ID, role: "student" },
  { _id: id(), course_id: course2Id, user_id: MOCK_USER_ID, role: "student" },
];

// ─── categories ──────────────────────────────────────────────────────────────

const cat1Id = "cat-proyecto-final";
const cat2Id = "cat-parcial-1";
const cat3Id = "cat-taller-redes";

export const categories = [
  {
    _id: cat1Id,
    category_id: cat1Id,
    name: "Proyecto Final",
    description: "Evaluación del proyecto semestral",
    course_id: course1Id,
  },
  {
    _id: cat2Id,
    category_id: cat2Id,
    name: "Parcial 1",
    description: "Primer parcial del curso",
    course_id: course1Id,
  },
  {
    _id: cat3Id,
    category_id: cat3Id,
    name: "Taller de Redes",
    description: "Taller práctico de configuración",
    course_id: course2Id,
  },
];

// ─── groups ──────────────────────────────────────────────────────────────────

const group1Id = "group-alpha";
const group2Id = "group-beta";
const group3Id = "group-gamma";

export const groups = [
  {
    _id: group1Id,
    group_id: group1Id,
    name: "Grupo Alpha",
    category_id: cat1Id,
    created_at: faker.date.past().toISOString(),
  },
  {
    _id: group2Id,
    group_id: group2Id,
    name: "Grupo Beta",
    category_id: cat2Id,
    created_at: faker.date.past().toISOString(),
  },
  {
    _id: group3Id,
    group_id: group3Id,
    name: "Grupo Gamma",
    category_id: cat3Id,
    created_at: faker.date.past().toISOString(),
  },
];

// ─── user_group ───────────────────────────────────────────────────────────────
// Logged-in user is in group1 (cat1/curso1) and group3 (cat3/curso2)
// group1: logged user + 3 peers
// group2: other students only (user is not in this group)
// group3: logged user + 2 peers

const group1Members = [MOCK_USER_ID, users[1].user_id, users[2].user_id, users[3].user_id];
const group2Members = [users[4].user_id, users[5].user_id, users[6].user_id];
const group3Members = [MOCK_USER_ID, users[7].user_id, users[8].user_id];

export const userGroups = [
  ...group1Members.map((uid) => ({ _id: id(), user_id: uid, group_id: group1Id })),
  ...group2Members.map((uid) => ({ _id: id(), user_id: uid, group_id: group2Id })),
  ...group3Members.map((uid) => ({ _id: id(), user_id: uid, group_id: group3Id })),
];

// ─── criteria ────────────────────────────────────────────────────────────────

const crit1Id = "crit-participacion";
const crit2Id = "crit-comunicacion";
const crit3Id = "crit-calidad";
const crit4Id = "crit-puntualidad";

export const criteria = [
  {
    _id: crit1Id,
    criterium_id: crit1Id,
    name: "Participación activa",
    description: "¿El compañero participó activamente durante el desarrollo del proyecto?",
    max_score: 5,
  },
  {
    _id: crit2Id,
    criterium_id: crit2Id,
    name: "Comunicación efectiva",
    description: "¿El compañero se comunicó de forma clara y oportuna con el equipo?",
    max_score: 5,
  },
  {
    _id: crit3Id,
    criterium_id: crit3Id,
    name: "Calidad del trabajo",
    description: "¿El compañero entregó trabajo de buena calidad?",
    max_score: 5,
  },
  {
    _id: crit4Id,
    criterium_id: crit4Id,
    name: "Puntualidad",
    description: "¿El compañero cumplió con los tiempos acordados?",
    max_score: 5,
  },
];

// ─── evaluations ─────────────────────────────────────────────────────────────

const eval1Id = "eval-proyecto-final";
const eval3Id = "eval-taller-redes";

export const evaluations = [
  {
    _id: eval1Id,
    evaluation_id: eval1Id,
    title: "Evaluación de pares - Proyecto Final",
    description: "Califica a tus compañeros de grupo",
    start_date: faker.date.recent().toISOString(),
    end_date: faker.date.soon({ days: 7 }).toISOString(),
    category_id: cat1Id,
    created_by: "profesor-001",
  },
  {
    _id: eval3Id,
    evaluation_id: eval3Id,
    title: "Evaluación de pares - Taller Redes",
    description: "Evaluación del taller de redes",
    start_date: faker.date.recent().toISOString(),
    end_date: faker.date.soon({ days: 5 }).toISOString(),
    category_id: cat3Id,
    created_by: "profesor-002",
  },
  // cat2 (Parcial 1) has NO evaluation — to test the empty case
];

// ─── evaluation_criterium ─────────────────────────────────────────────────────

export const evaluationCriteria = [
  { _id: id(), evaluation_id: eval1Id, criterium_id: crit1Id },
  { _id: id(), evaluation_id: eval1Id, criterium_id: crit2Id },
  { _id: id(), evaluation_id: eval1Id, criterium_id: crit3Id },
  { _id: id(), evaluation_id: eval1Id, criterium_id: crit4Id },
  { _id: id(), evaluation_id: eval3Id, criterium_id: crit1Id },
  { _id: id(), evaluation_id: eval3Id, criterium_id: crit2Id },
];

// ─── resultEvaluation (mutable — starts empty) ───────────────────────────────

export type ResultEvaluationRow = {
  _id: string;
  resultEvaluation_id: string;
  evaluation_id: string;
  evaluator_id: string;
  evaluated_id: string;
};

export const resultEvaluations: ResultEvaluationRow[] = [];

// ─── result_criterium (mutable — starts empty) ───────────────────────────────

export type ResultCriteriumRow = {
  _id: string;
  result_id: string;
  criterium_id: string;
  score: number;
};

export const resultCriteria: ResultCriteriumRow[] = [];

// ─── products (mutable) ───────────────────────────────────────────────────────

export type ProductRow = {
  _id: string;
  name: string;
  description: string;
  quantity: number;
};

export const products: ProductRow[] = Array.from({ length: 4 }, () => ({
  _id: id(),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  quantity: faker.number.int({ min: 1, max: 100 }),
}));
