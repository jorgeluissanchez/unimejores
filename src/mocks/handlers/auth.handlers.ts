import { http, HttpResponse } from "msw";
import { MOCK_EMAIL, MOCK_PASSWORD, MOCK_USER_ID } from "../db";

const PROJECT_ID = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID;
const BASE = `${process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://roble-api.openlab.uninorte.edu.co"}/auth/${PROJECT_ID}`;

// Minimal JWT with sub = MOCK_USER_ID
function makeToken(sub: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({ sub, email: MOCK_EMAIL, iat: Date.now(), exp: Date.now() + 3600 * 1000 })
  );
  const sig = btoa("mock-signature");
  return `${header}.${payload}.${sig}`;
}

const accessToken = makeToken(MOCK_USER_ID);
const refreshTokenValue = "mock-refresh-token";

export const authHandlers = [
  // POST /auth/:projectId/login
  http.post(`${BASE}/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === MOCK_EMAIL && body.password === MOCK_PASSWORD) {
      return HttpResponse.json({ accessToken, refreshToken: refreshTokenValue });
    }

    return HttpResponse.json(
      { message: "Credenciales inválidas" },
      { status: 401 }
    );
  }),

  // POST /auth/:projectId/signup
  http.post(`${BASE}/signup`, async ({ request }) => {
    const body = await request.json() as { email: string };
    if (!body.email) {
      return HttpResponse.json({ message: "Email requerido" }, { status: 400 });
    }
    return new HttpResponse(null, { status: 201 });
  }),

  // POST /auth/:projectId/logout
  http.post(`${BASE}/logout`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // POST /auth/:projectId/verify-email
  http.post(`${BASE}/verify-email`, async ({ request }) => {
    const body = await request.json() as { email: string; code: string };
    if (body.code === "123456") {
      return new HttpResponse(null, { status: 200 });
    }
    return HttpResponse.json({ message: "Código inválido" }, { status: 400 });
  }),

  // POST /auth/:projectId/refresh-token
  http.post(`${BASE}/refresh-token`, () => {
    return HttpResponse.json({ accessToken });
  }),

  // GET /auth/:projectId/verify-token
  http.get(`${BASE}/verify-token`, () => {
    return new HttpResponse(null, { status: 200 });
  }),
];
