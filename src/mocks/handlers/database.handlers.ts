import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";
import {
  categories,
  courses,
  criteria,
  evaluationCriteria,
  evaluations,
  groups,
  products,
  resultCriteria,
  resultEvaluations,
  userCourses,
  userGroups,
  users,
} from "../db";

const PROJECT_ID = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID;
const BASE = `${process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://roble-api.openlab.uninorte.edu.co"}/database/${PROJECT_ID}`;

// ─── table registry ──────────────────────────────────────────────────────────

const TABLES: Record<string, any[]> = {
  user: users,
  course: courses,
  user_course: userCourses,
  category: categories,
  group: groups,
  user_group: userGroups,
  criterium: criteria,
  evaluation: evaluations,
  evaluation_criterium: evaluationCriteria,
  resultEvaluation: resultEvaluations,
  result_criterium: resultCriteria,
  Product: products,
};

// ─── generic filter ───────────────────────────────────────────────────────────

function applyFilters(rows: any[], filters: Record<string, string>): any[] {
  return rows.filter((row) =>
    Object.entries(filters).every(([key, val]) => String(row[key]) === String(val))
  );
}

// ─── GET /database/:projectId/read ───────────────────────────────────────────

export const databaseHandlers = [
  http.get(`${BASE}/read`, ({ request }) => {
    const url = new URL(request.url);
    const tableName = url.searchParams.get("tableName");

    if (!tableName || !TABLES[tableName]) {
      return HttpResponse.json({ message: `Tabla '${tableName}' no encontrada` }, { status: 404 });
    }

    // Build filters from all query params except tableName
    const filters: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      if (key !== "tableName") filters[key] = value;
    });

    const rows = TABLES[tableName];
    const result = Object.keys(filters).length > 0 ? applyFilters(rows, filters) : rows;

    return HttpResponse.json(result);
  }),

  // ─── POST /database/:projectId/insert ────────────────────────────────────

  http.post(`${BASE}/insert`, async ({ request }) => {
    const body = await request.json() as { tableName: string; records: any[] };
    const { tableName, records } = body;

    if (!tableName || !TABLES[tableName]) {
      return HttpResponse.json({ message: `Tabla '${tableName}' no encontrada` }, { status: 404 });
    }

    const table = TABLES[tableName];
    const inserted: any[] = [];

    for (const record of records) {
      const newId = record._id ?? faker.string.alphanumeric(12);
      let row: any;

      if (tableName === "resultEvaluation") {
        row = { _id: newId, resultEvaluation_id: newId, evaluation_id: record.evaluation_id, evaluator_id: record.evaluator_id, evaluated_id: record.evaluated_id };
      } else if (tableName === "result_criterium") {
        row = { _id: newId, result_id: record.result_id, criterium_id: record.criterium_id, score: record.score };
      } else {
        row = { _id: newId, ...record };
      }
      table.push(row);
      inserted.push(row);
    }

    return HttpResponse.json({ inserted, skipped: [] }, { status: 201 });
  }),

  // ─── PUT /database/:projectId/update ─────────────────────────────────────

  http.put(`${BASE}/update`, async ({ request }) => {
    const body = await request.json() as {
      tableName: string;
      idColumn: string;
      idValue: string;
      updates: Record<string, any>;
    };
    const { tableName, idColumn, idValue, updates } = body;

    if (!tableName || !TABLES[tableName]) {
      return HttpResponse.json({ message: `Tabla '${tableName}' no encontrada` }, { status: 404 });
    }

    const table = TABLES[tableName];
    const idx = table.findIndex((row) => String(row[idColumn]) === String(idValue));

    if (idx === -1) {
      return HttpResponse.json({ message: "Registro no encontrado" }, { status: 404 });
    }

    table[idx] = { ...table[idx], ...updates };
    return HttpResponse.json(table[idx]);
  }),

  // ─── DELETE /database/:projectId/delete ──────────────────────────────────

  http.delete(`${BASE}/delete`, async ({ request }) => {
    const body = await request.json() as {
      tableName: string;
      idColumn: string;
      idValue: string;
    };
    const { tableName, idColumn, idValue } = body;

    if (!tableName || !TABLES[tableName]) {
      return HttpResponse.json({ message: `Tabla '${tableName}' no encontrada` }, { status: 404 });
    }

    const table = TABLES[tableName];
    const idx = table.findIndex((row) => String(row[idColumn]) === String(idValue));

    if (idx === -1) {
      return HttpResponse.json({ message: "Registro no encontrado" }, { status: 404 });
    }

    table.splice(idx, 1);
    return HttpResponse.json({ message: "Eliminado correctamente" });
  }),
];
