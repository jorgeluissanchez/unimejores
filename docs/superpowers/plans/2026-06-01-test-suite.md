# Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete 4-layer test suite (unit, component, integration, E2E) for UniMejores covering the full student and professor flows using MSW for mocking.

**Architecture:** Jest + RNTL for unit/component/integration layers with `msw/node` intercepting HTTP calls through the real datasource implementations; Maestro for E2E flows on iOS/Android emulator using the existing `msw/native` setup activated via `EXPO_PUBLIC_USE_MOCK=true`.

**Tech Stack:** Jest 29, jest-expo, @testing-library/react-native 13, MSW v2 (`msw/node` in Jest, `msw/native` in app), Maestro CLI, TypeScript

---

## Codebase orientation

Key paths to know before touching anything:

| Path | What it is |
|---|---|
| `src/mocks/db.ts` | In-memory mock database — deterministic seeded data |
| `src/mocks/handlers/auth.handlers.ts` | MSW handlers for login/logout/signup/verify |
| `src/mocks/handlers/database.handlers.ts` | MSW handlers for CRUD (read/insert/update/delete) |
| `src/mocks/server.ts` | App server using `msw/native` — **do not modify** |
| `src/__tests__/setup/env.ts` | Sets env vars before Jest (already exists) |
| `jest.config.js` | Jest config with jest-expo preset |
| `src/core/di/di-provider.tsx` | DI container used by all contexts |
| `src/core/constants/tokens.ts` | DI tokens: `TOKENS.AuthRepo`, `TOKENS.CourseRepo`, `TOKENS.EvaluationRepo` |
| `src/features/auth/presentation/context/auth-context.tsx` | AuthProvider + useAuth |
| `src/features/courses/presentation/context/course-context.tsx` | CourseProvider + useCourses |
| `src/features/evaluation/presentation/context/evaluation-context.tsx` | EvaluationProvider + useEvaluation |
| `src/features/auth/data/datasources/auth-remote-data-source-impl.ts` | Makes real HTTP calls for auth |
| `src/features/courses/data/datasources/course-remote-data-source-impl.ts` | Makes real HTTP calls for courses |
| `src/features/evaluation/data/datasources/evaluation-remote-data-source-impl.ts` | Makes real HTTP calls for evaluations |

**How the DI + contexts work in tests:**
- Integration context tests: mock `useDI` via `jest.mock('@/core/di/di-provider', () => ({ useDI: jest.fn(() => ({ resolve: jest.fn(() => mockRepo) })) }))` — no real HTTP calls
- Integration datasource tests: instantiate `CourseRemoteDataSourceImpl` directly — MSW intercepts the real `fetch` calls
- Component tests: mock all hooks (`useAuth`, `useCourses`, `useEvaluation`, `useRouter`) directly

---

## Task 1: Add professor to mock DB (prerequisite)

**Files:**
- Modify: `src/mocks/db.ts`
- Modify: `src/mocks/handlers/auth.handlers.ts`

- [ ] **Step 1.1: Add professor constants and user to db.ts**

Open `src/mocks/db.ts`. After the existing student constants, add:

```ts
export const MOCK_PROF_ID       = 'user-professor';
export const MOCK_PROF_EMAIL    = 'profesor@uninorte.edu.co';
export const MOCK_PROF_PASSWORD = 'password123';
```

In the `users` array, add the professor as the first element (before the spread):
```ts
export const users = [
  {
    _id: MOCK_USER_ID,
    user_id: MOCK_USER_ID,
    name: "Estudiante Demo",
    email: MOCK_EMAIL,
    role: "student",
    created_at: faker.date.past().toISOString(),
  },
  {
    _id: MOCK_PROF_ID,
    user_id: MOCK_PROF_ID,
    name: "Profesor Demo",
    email: MOCK_PROF_EMAIL,
    role: "professor",
    created_at: faker.date.past().toISOString(),
  },
  ...Array.from({ length: 8 }, () => { /* unchanged */ }),
];
```

In the `userCourses` array, add:
```ts
export const userCourses = [
  { _id: id(), course_id: course1Id, user_id: MOCK_USER_ID, role: "student" },
  { _id: id(), course_id: course2Id, user_id: MOCK_USER_ID, role: "student" },
  { _id: id(), course_id: course1Id, user_id: MOCK_PROF_ID, role: "professor" },
  { _id: id(), course_id: course2Id, user_id: MOCK_PROF_ID, role: "professor" },
];
```

- [ ] **Step 1.2: Update auth handler to support professor login**

Open `src/mocks/handlers/auth.handlers.ts`. Import the new constants:

```ts
import {
  MOCK_EMAIL, MOCK_PASSWORD, MOCK_USER_ID,
  MOCK_PROF_EMAIL, MOCK_PROF_PASSWORD, MOCK_PROF_ID,
} from "../db";
```

Update `makeToken` to accept an `email` parameter:

```ts
function makeToken(sub: string, email: string): string {
  const header  = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({ sub, email, iat: Date.now(), exp: Date.now() + 3600 * 1000 })
  );
  const sig = btoa("mock-signature");
  return `${header}.${payload}.${sig}`;
}
```

Update the login handler to branch on credentials:

```ts
http.post(`${BASE}/login`, async ({ request }) => {
  const body = await request.json() as { email: string; password: string };

  if (body.email === MOCK_EMAIL && body.password === MOCK_PASSWORD) {
    const token = makeToken(MOCK_USER_ID, MOCK_EMAIL);
    return HttpResponse.json({ accessToken: token, refreshToken: refreshTokenValue });
  }

  if (body.email === MOCK_PROF_EMAIL && body.password === MOCK_PROF_PASSWORD) {
    const token = makeToken(MOCK_PROF_ID, MOCK_PROF_EMAIL);
    return HttpResponse.json({ accessToken: token, refreshToken: refreshTokenValue });
  }

  return HttpResponse.json({ message: "Credenciales inválidas" }, { status: 401 });
}),
```

Remove the now-unused top-level `const accessToken = makeToken(MOCK_USER_ID)` line (or keep it if used elsewhere in the file — check usages).

- [ ] **Step 1.3: Verify existing tests still pass**

```bash
pnpm test --no-coverage
```

Expected: all existing tests pass (auth-context, auth-datasource, course-context, evaluation-context, unit tests).

- [ ] **Step 1.4: Commit**

```bash
git add src/mocks/db.ts src/mocks/handlers/auth.handlers.ts
git commit -m "feat(mocks): add professor user and multi-credential auth handler"
```

---

## Task 2: Wire MSW into Jest

**Files:**
- Create: `src/__tests__/setup/msw-server.ts`
- Modify: `jest.config.js`

- [ ] **Step 2.1: Create the MSW node server for tests**

Create `src/__tests__/setup/msw-server.ts`:

```ts
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';

export const server = setupServer(...handlers);
```

- [ ] **Step 2.2: Update jest.config.js**

Open `jest.config.js`. Make two changes:

**a) Add `setupFilesAfterEnv`** (after `setupFiles`):
```js
setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/msw-server.ts'],
```

**b) Add MSW packages to `transformIgnorePatterns`** — extend the first pattern's allow-list to include `msw`, `@mswjs/interceptors`, and `@bundled-es-modules`:
```js
transformIgnorePatterns: [
  "/node_modules/(?!(.pnpm|react-native|@react-native(-community)?|@rn-primitives|expo(nent)?|@expo(nent)?|@expo-google-fonts|react-navigation|@react-navigation|nativewind|lucide-react-native|@shopify|msw|@mswjs/interceptors|@bundled-es-modules))",
  "/node_modules/react-native-reanimated/plugin/",
  "/node_modules/@react-native/babel-preset/",
],
```

**c) Add coverage threshold** (after `collectCoverageFrom`):
```js
coverageThreshold: {
  './src/**': {
    statements: 70,
    branches: 60,
    functions: 70,
    lines: 70,
  },
},
```

- [ ] **Step 2.3: Run all tests to verify MSW setup doesn't break anything**

```bash
pnpm test --no-coverage 2>&1 | tail -20
```

Expected: all existing tests pass. If you see "Cannot find module 'msw/node'" it means the transform is not picking up msw yet — double-check the regex in step 2.2b.

- [ ] **Step 2.4: Commit**

```bash
git add src/__tests__/setup/msw-server.ts jest.config.js
git commit -m "feat(test): wire msw/node into Jest via setupFilesAfterEnv"
```

---

## Task 3: Migrate auth-datasource.test.ts to MSW

**Files:**
- Modify: `src/__tests__/integration/auth-datasource.test.ts`

The existing file uses `jest.fn()` on `global.fetch`. We rewrite it to use the MSW server instead, removing all `global.fetch` mocking.

- [ ] **Step 3.1: Replace the fetch mocking setup with MSW server hooks**

Open `src/__tests__/integration/auth-datasource.test.ts`. Replace the entire fetch-mock section:

```ts
// Remove these:
// function ok(body) { ... }
// function fail(status, body) { ... }
// function makeJwt(sub) { ... }
// beforeEach(() => { global.fetch = jest.fn(); })
// afterEach(() => { (global.fetch as jest.Mock).mockRestore?.(); })

// Add at the top of the file:
import { server } from '@/__tests__/setup/msw-server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

The `MOCK_EMAIL`, `MOCK_PASSWORD`, `MOCK_USER_ID` imports from `@/mocks/db` remain unchanged.

- [ ] **Step 3.2: Rewrite each describe block to use MSW overrides**

For tests that need to simulate errors (401, missing tokens), use `server.use()` overrides:

```ts
import { TOKENS } from '@/core/constants/tokens'; // not needed — just the ds

// ─── login ───────────────────────────────────────────────────────────────────
describe('AuthRemoteDataSourceImpl.login', () => {
  it('stores the access token on successful login', async () => {
    await freshDS().login(MOCK_EMAIL, MOCK_PASSWORD);
    expect(mockPrefs.storeData).toHaveBeenCalledWith('token', expect.any(String));
  });

  it('stores the userId decoded from the JWT', async () => {
    await freshDS().login(MOCK_EMAIL, MOCK_PASSWORD);
    expect(mockPrefs.storeData).toHaveBeenCalledWith('userId', MOCK_USER_ID);
  });

  it('throws on wrong credentials (MSW returns 401)', async () => {
    await expect(freshDS().login('bad@test.com', 'wrong')).rejects.toThrow(
      /Error al iniciar sesión/
    );
  });

  it('throws when MSW returns missing tokens (server.use override)', async () => {
    const BASE = `${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/${process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID}`;
    server.use(
      http.post(`${BASE}/login`, () =>
        HttpResponse.json({ accessToken: null, refreshToken: null })
      )
    );
    await expect(freshDS().login(MOCK_EMAIL, MOCK_PASSWORD)).rejects.toThrow(/faltan tokens/);
  });
});
```

Keep `mockPrefs`, `store`, and `freshDS()` as they were — only the network layer changes.

- [ ] **Step 3.3: Run the migrated test**

```bash
pnpm test:integration --testPathPattern="auth-datasource" --no-coverage
```

Expected: all tests pass.

- [ ] **Step 3.4: Commit**

```bash
git add src/__tests__/integration/auth-datasource.test.ts
git commit -m "refactor(test): migrate auth-datasource tests from jest.fn() to msw/node"
```

---

## Task 4: Course datasource integration tests

**Files:**
- Create: `src/__tests__/integration/course-datasource.test.ts`

These tests instantiate `CourseRemoteDataSourceImpl` directly and verify it calls the correct endpoints via MSW.

- [ ] **Step 4.1: Write the test file**

Create `src/__tests__/integration/course-datasource.test.ts`:

```ts
import { server } from '@/__tests__/setup/msw-server';
import { MOCK_USER_ID, MOCK_PROF_ID, courses, categories, groups } from '@/mocks/db';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── mock storage ─────────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const mockPrefs = {
  storeData: jest.fn(async (key: string, value: string) => { store[key] = value; }),
  retrieveData: jest.fn(async <T>(key: string): Promise<T | null> => (store[key] as T) ?? null),
  removeData: jest.fn(async (key: string) => { delete store[key]; }),
};

jest.mock('@/core/storage/local-preferences-async-storage', () => ({
  LocalPreferencesAsyncStorage: { getInstance: jest.fn(() => mockPrefs) },
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildAuthDS() {
  const { AuthRemoteDataSourceImpl } = require('@/features/auth/data/datasources/auth-remote-data-source-impl');
  return new AuthRemoteDataSourceImpl();
}

function buildCourseDS() {
  const { CourseRemoteDataSourceImpl } = require('@/features/courses/data/datasources/course-remote-data-source-impl');
  return new CourseRemoteDataSourceImpl(buildAuthDS());
}

// Pre-seed a token so authorizedFetch doesn't fail
beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(store).forEach((k) => delete store[k]);
  store['token'] = 'mock-token';
  mockPrefs.retrieveData.mockImplementation(async (key: string) => store[key] ?? null);
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('CourseRemoteDataSourceImpl.getMyEnrolledCourses', () => {
  it('returns courses where user is enrolled as student', async () => {
    const result = await buildCourseDS().getMyEnrolledCourses(MOCK_USER_ID);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('nrc');
  });

  it('returns empty array for a user with no enrollments', async () => {
    const result = await buildCourseDS().getMyEnrolledCourses('unknown-user-id');
    expect(result).toEqual([]);
  });
});

describe('CourseRemoteDataSourceImpl.getMyCreatedCourses', () => {
  it('returns courses where professor is the creator', async () => {
    const result = await buildCourseDS().getMyCreatedCourses(MOCK_PROF_ID);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

describe('CourseRemoteDataSourceImpl.getCategoriesByCourse', () => {
  it('returns categories for a given course', async () => {
    const result = await buildCourseDS().getCategoriesByCourse('course-sistemas');
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toHaveProperty('name');
  });
});

describe('CourseRemoteDataSourceImpl.addCourse', () => {
  it('inserts a new course and returns it with an _id', async () => {
    const ds = buildCourseDS();
    const result = await ds.addCourse({
      name: 'Nuevo Curso',
      nrc: '99999',
      description: 'Test',
      created_by: MOCK_PROF_ID,
    });
    expect(result._id).toBeTruthy();
    expect(result.name).toBe('Nuevo Curso');
  });
});

describe('CourseRemoteDataSourceImpl.getGroupsByCategory', () => {
  it('returns groups for a category', async () => {
    const result = await buildCourseDS().getGroupsByCategory('cat-proyecto-final');
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 4.2: Run the new tests**

```bash
pnpm test:integration --testPathPattern="course-datasource" --no-coverage
```

Expected: all tests pass. If you see 401 errors, check that `store['token']` is being set in `beforeEach`.

- [ ] **Step 4.3: Commit**

```bash
git add src/__tests__/integration/course-datasource.test.ts
git commit -m "test(integration): add course datasource tests via msw/node"
```

---

## Task 5: Evaluation datasource integration tests

**Files:**
- Create: `src/__tests__/integration/evaluation-datasource.test.ts`

- [ ] **Step 5.1: Write the test file**

Create `src/__tests__/integration/evaluation-datasource.test.ts`:

```ts
import { server } from '@/__tests__/setup/msw-server';
import { MOCK_USER_ID, criteria, evaluations } from '@/mocks/db';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const store: Record<string, string> = {};
const mockPrefs = {
  storeData: jest.fn(async (key: string, value: string) => { store[key] = value; }),
  retrieveData: jest.fn(async <T>(key: string): Promise<T | null> => (store[key] as T) ?? null),
  removeData: jest.fn(async (key: string) => { delete store[key]; }),
};

jest.mock('@/core/storage/local-preferences-async-storage', () => ({
  LocalPreferencesAsyncStorage: { getInstance: jest.fn(() => mockPrefs) },
}));

function buildAuthDS() {
  const { AuthRemoteDataSourceImpl } = require('@/features/auth/data/datasources/auth-remote-data-source-impl');
  return new AuthRemoteDataSourceImpl();
}

function buildEvalDS() {
  const { EvaluationRemoteDataSourceImpl } = require('@/features/evaluation/data/datasources/evaluation-remote-data-source-impl');
  return new EvaluationRemoteDataSourceImpl(buildAuthDS());
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(store).forEach((k) => delete store[k]);
  store['token'] = 'mock-token';
  mockPrefs.retrieveData.mockImplementation(async (key: string) => store[key] ?? null);
});

describe('EvaluationRemoteDataSourceImpl.getEvaluationByGroup', () => {
  it('returns the evaluation for group-alpha (which has an active evaluation)', async () => {
    const result = await buildEvalDS().getEvaluationByGroup('group-alpha');
    expect(result).not.toBeNull();
    expect(result?.title).toContain('Proyecto Final');
  });

  it('returns null for a group with no evaluation', async () => {
    // group-beta belongs to cat-parcial-1 which has no evaluation in mock db
    const result = await buildEvalDS().getEvaluationByGroup('group-beta');
    expect(result).toBeNull();
  });
});

describe('EvaluationRemoteDataSourceImpl.getCriteriaByEvaluation', () => {
  it('returns all criteria for an evaluation', async () => {
    const result = await buildEvalDS().getCriteriaByEvaluation('eval-proyecto-final');
    expect(result.length).toBe(4); // 4 criteria linked in mock db
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('max_score');
  });
});

describe('EvaluationRemoteDataSourceImpl.getMyCriteria', () => {
  it('returns all criteria in the system', async () => {
    const result = await buildEvalDS().getMyCriteria(MOCK_USER_ID);
    expect(result.length).toBeGreaterThanOrEqual(4);
  });
});

describe('EvaluationRemoteDataSourceImpl.submitEvaluation', () => {
  it('inserts resultEvaluation and result_criterium records without throwing', async () => {
    await expect(
      buildEvalDS().submitEvaluation(
        'group-alpha',
        MOCK_USER_ID,
        'user-peer-1',
        { 'crit-participacion': 4, 'crit-comunicacion': 5, 'crit-calidad': 3, 'crit-puntualidad': 4 }
      )
    ).resolves.not.toThrow();
  });
});

describe('EvaluationRemoteDataSourceImpl.createEvaluation', () => {
  it('inserts a new evaluation and returns it', async () => {
    const result = await buildEvalDS().createEvaluation({
      title: 'Nueva Evaluación',
      description: 'Test',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      category_id: 'cat-parcial-1',
      created_by: 'user-professor',
    });
    expect(result._id).toBeTruthy();
    expect(result.title).toBe('Nueva Evaluación');
  });
});
```

- [ ] **Step 5.2: Run the new tests**

```bash
pnpm test:integration --testPathPattern="evaluation-datasource" --no-coverage
```

Expected: all tests pass.

- [ ] **Step 5.3: Commit**

```bash
git add src/__tests__/integration/evaluation-datasource.test.ts
git commit -m "test(integration): add evaluation datasource tests via msw/node"
```

---

## Task 6: Extend course-context tests with professor CRUD

**Files:**
- Modify: `src/__tests__/integration/course-context.test.tsx`

The existing file already tests student read cases. Add professor CRUD at the end.

- [ ] **Step 6.1: Add professor CRUD tests**

At the end of `src/__tests__/integration/course-context.test.tsx`, add:

```ts
describe('CourseProvider — addCourse (professor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockCourseRepo.getMyCreatedCourses.mockResolvedValue([]);
    mockCourseRepo.getPendingEvaluations.mockResolvedValue([]);
  });

  it('adds a course and returns it', async () => {
    const newCourse: Course = { _id: 'new-1', course_id: 'new-1', name: 'New Course', nrc: '00001', description: '' };
    mockCourseRepo.addCourse.mockResolvedValueOnce(newCourse);

    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});

    let returned: Course | undefined;
    await act(async () => {
      returned = await result.current.addCourse({ name: 'New Course', nrc: '00001', description: '', created_by: 'p-1' });
    });

    expect(returned).toEqual(newCourse);
    expect(mockCourseRepo.addCourse).toHaveBeenCalledTimes(1);
  });

  it('removes a course from courses list after deleteCourse', async () => {
    mockCourseRepo.getMyCreatedCourses.mockResolvedValue([mockCourse]);
    mockCourseRepo.deleteCourse.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});

    expect(result.current.courses).toHaveLength(1);

    await act(async () => {
      await result.current.deleteCourse('c-1');
    });

    expect(result.current.courses).toHaveLength(0);
  });
});

describe('CourseProvider — addCategory (professor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockCourseRepo.getMyCreatedCourses.mockResolvedValue([]);
    mockCourseRepo.getPendingEvaluations.mockResolvedValue([]);
  });

  it('calls addCategory on the repo with correct args', async () => {
    const mockCat = { _id: 'cat-1', name: 'New Cat', description: '', course_id: 'c-1' };
    mockCourseRepo.addCategory.mockResolvedValueOnce(mockCat);

    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addCategory({ name: 'New Cat', description: '', course_id: 'c-1' });
    });

    expect(mockCourseRepo.addCategory).toHaveBeenCalledWith({ name: 'New Cat', description: '', course_id: 'c-1' });
  });
});
```

(Note: `professorUser` is defined near the top of the existing file. Search for `professorUser` — if it doesn't exist yet, add this near the other user fixtures: `const professorUser = { userId: 'p-1', email: 'prof@test.com', role: 'professor', name: 'Prof' };`)

- [ ] **Step 6.2: Run the tests**

```bash
pnpm test:integration --testPathPattern="course-context" --no-coverage
```

Expected: all pass, including the new professor cases.

- [ ] **Step 6.3: Commit**

```bash
git add src/__tests__/integration/course-context.test.tsx
git commit -m "test(integration): add professor CRUD cases to course-context tests"
```

---

## Task 7: Extend evaluation-context tests with professor management

**Files:**
- Modify: `src/__tests__/integration/evaluation-context.test.tsx`

- [ ] **Step 7.1: Add professor evaluation management tests**

At the end of the file, add:

```ts
describe('EvaluationProvider — professor: createEvaluation', () => {
  const professorUser = { userId: 'p-1', role: 'professor', email: 'prof@a.com', name: 'Prof' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockEvalRepo.getMyCriteria.mockResolvedValue([]);
  });

  it('calls createEvaluation on the repo and returns the result', async () => {
    const newEval = { ...mockEvaluation, _id: 'ev-new', evaluation_id: 'ev-new' };
    mockEvalRepo.createEvaluation.mockResolvedValueOnce(newEval);

    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    let returned: typeof mockEvaluation | undefined;
    await act(async () => {
      returned = await result.current.createEvaluation({
        title: 'Nueva Evaluación',
        description: '',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        category_id: 'cat-1',
        created_by: 'p-1',
      });
    });

    expect(returned?._id).toBe('ev-new');
    expect(mockEvalRepo.createEvaluation).toHaveBeenCalledTimes(1);
  });

  it('deleteEvaluation calls the repo', async () => {
    mockEvalRepo.deleteEvaluation.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.deleteEvaluation('ev-1');
    });

    expect(mockEvalRepo.deleteEvaluation).toHaveBeenCalledWith('ev-1');
  });
});

describe('EvaluationProvider — professor: criteria CRUD', () => {
  const professorUser = { userId: 'p-1', role: 'professor', email: 'prof@a.com', name: 'Prof' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockEvalRepo.getMyCriteria.mockResolvedValue([]);
  });

  it('addCriterium calls repo and refreshes myCriteria', async () => {
    mockEvalRepo.addCriterium.mockResolvedValueOnce(undefined);
    mockEvalRepo.getMyCriteria
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ _id: 'c-new', criterium_id: 'c-new', name: 'Test', description: '', max_score: 5, created_by: 'p-1' }]);

    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addCriterium({ name: 'Test', description: '', max_score: 5, created_by: 'p-1' });
    });

    expect(result.current.myCriteria).toHaveLength(1);
  });

  it('deleteCriterium calls repo', async () => {
    mockEvalRepo.deleteCriterium.mockResolvedValueOnce(undefined);
    mockEvalRepo.getMyCriteria.mockResolvedValue([]);
    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.deleteCriterium('c-1');
    });

    expect(mockEvalRepo.deleteCriterium).toHaveBeenCalledWith('c-1');
  });
});
```

- [ ] **Step 7.2: Run the tests**

```bash
pnpm test:integration --testPathPattern="evaluation-context" --no-coverage
```

Expected: all pass.

- [ ] **Step 7.3: Commit**

```bash
git add src/__tests__/integration/evaluation-context.test.tsx
git commit -m "test(integration): add professor evaluation and criteria management tests"
```

---

## Task 8: Student end-to-end flow integration test

**Files:**
- Create: `src/__tests__/integration/student-flow.test.ts`

This test goes all the way through: DataSource (real instance) → MSW (intercepts fetch) → verify returned data. It chains login → load courses → load evaluation to simulate the student journey.

- [ ] **Step 8.1: Write the student flow test**

Create `src/__tests__/integration/student-flow.test.ts`:

```ts
/**
 * Student flow integration test.
 * Instantiates real DataSource classes. MSW intercepts all fetch calls.
 * Tests the complete path: auth → courses → evaluation.
 */
import { server } from '@/__tests__/setup/msw-server';
import {
  MOCK_EMAIL, MOCK_PASSWORD, MOCK_USER_ID,
  courses as mockCourses,
} from '@/mocks/db';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── mock storage ─────────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const mockPrefs = {
  storeData: jest.fn(async (key: string, value: string) => { store[key] = value; }),
  retrieveData: jest.fn(async <T>(key: string): Promise<T | null> => (store[key] as T) ?? null),
  removeData: jest.fn(async (key: string) => { delete store[key]; }),
};

jest.mock('@/core/storage/local-preferences-async-storage', () => ({
  LocalPreferencesAsyncStorage: { getInstance: jest.fn(() => mockPrefs) },
}));

// ─── factories ────────────────────────────────────────────────────────────────

function buildAuthDS() {
  const { AuthRemoteDataSourceImpl } = require('@/features/auth/data/datasources/auth-remote-data-source-impl');
  return new AuthRemoteDataSourceImpl();
}
function buildCourseDS(authDS: any) {
  const { CourseRemoteDataSourceImpl } = require('@/features/courses/data/datasources/course-remote-data-source-impl');
  return new CourseRemoteDataSourceImpl(authDS);
}
function buildEvalDS(authDS: any) {
  const { EvaluationRemoteDataSourceImpl } = require('@/features/evaluation/data/datasources/evaluation-remote-data-source-impl');
  return new EvaluationRemoteDataSourceImpl(authDS);
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('Student flow: login → courses → evaluation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
    mockPrefs.retrieveData.mockImplementation(async (key: string) => store[key] ?? null);
  });

  it('completes full flow: login, load courses, load evaluation, submit scores', async () => {
    const authDS = buildAuthDS();
    const courseDS = buildCourseDS(authDS);
    const evalDS = buildEvalDS(authDS);

    // Step 1: Login
    await authDS.login(MOCK_EMAIL, MOCK_PASSWORD);
    const token = store['token'];
    const userId = store['userId'];
    expect(token).toBeTruthy();
    expect(userId).toBe(MOCK_USER_ID);

    // Step 2: Load enrolled courses
    const enrolledCourses = await courseDS.getMyEnrolledCourses(userId);
    expect(enrolledCourses.length).toBeGreaterThanOrEqual(2);
    const firstCourse = enrolledCourses[0];
    expect(firstCourse.name).toBeTruthy();

    // Step 3: Load categories for a course
    const categories = await courseDS.getCategoriesByCourse('course-sistemas');
    expect(categories.length).toBeGreaterThanOrEqual(2);

    // Step 4: Get the student's group for a category
    const group = await courseDS.getGroupByCategory('cat-proyecto-final', MOCK_USER_ID);
    expect(group).not.toBeNull();
    expect(group?._id).toBe('group-alpha');

    // Step 5: Load the evaluation for that group
    const evaluation = await evalDS.getEvaluationByGroup('group-alpha');
    expect(evaluation).not.toBeNull();
    expect(evaluation?.title).toContain('Proyecto Final');

    // Step 6: Load criteria
    const criteria = await evalDS.getCriteriaByEvaluation(evaluation!._id);
    expect(criteria.length).toBe(4);

    // Step 7: Submit scores for a peer
    await expect(
      evalDS.submitEvaluation(
        'group-alpha',
        MOCK_USER_ID,
        'peer-user-id',
        Object.fromEntries(criteria.map((c) => [c._id, 4]))
      )
    ).resolves.not.toThrow();
  });

  it('login fails with wrong credentials', async () => {
    const authDS = buildAuthDS();
    await expect(
      authDS.login('wrong@test.com', 'wrongpassword')
    ).rejects.toThrow(/Error al iniciar sesión/);
    expect(store['token']).toBeUndefined();
  });
});
```

- [ ] **Step 8.2: Run the student flow test**

```bash
pnpm test:integration --testPathPattern="student-flow" --no-coverage
```

Expected: both tests pass.

- [ ] **Step 8.3: Commit**

```bash
git add src/__tests__/integration/student-flow.test.ts
git commit -m "test(integration): add student end-to-end flow test via msw/node"
```

---

## Task 9: Professor end-to-end flow integration test

**Files:**
- Create: `src/__tests__/integration/professor-flow.test.ts`

- [ ] **Step 9.1: Write the professor flow test**

Create `src/__tests__/integration/professor-flow.test.ts`:

```ts
/**
 * Professor flow integration test.
 * Covers: login → course CRUD → category/group management → evaluation CRUD.
 */
import { server } from '@/__tests__/setup/msw-server';
import { MOCK_PROF_EMAIL, MOCK_PROF_PASSWORD, MOCK_PROF_ID } from '@/mocks/db';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const store: Record<string, string> = {};
const mockPrefs = {
  storeData: jest.fn(async (key: string, value: string) => { store[key] = value; }),
  retrieveData: jest.fn(async <T>(key: string): Promise<T | null> => (store[key] as T) ?? null),
  removeData: jest.fn(async (key: string) => { delete store[key]; }),
};

jest.mock('@/core/storage/local-preferences-async-storage', () => ({
  LocalPreferencesAsyncStorage: { getInstance: jest.fn(() => mockPrefs) },
}));

function buildAuthDS() {
  const { AuthRemoteDataSourceImpl } = require('@/features/auth/data/datasources/auth-remote-data-source-impl');
  return new AuthRemoteDataSourceImpl();
}
function buildCourseDS(authDS: any) {
  const { CourseRemoteDataSourceImpl } = require('@/features/courses/data/datasources/course-remote-data-source-impl');
  return new CourseRemoteDataSourceImpl(authDS);
}
function buildEvalDS(authDS: any) {
  const { EvaluationRemoteDataSourceImpl } = require('@/features/evaluation/data/datasources/evaluation-remote-data-source-impl');
  return new EvaluationRemoteDataSourceImpl(authDS);
}

describe('Professor flow: login → course CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
    store['token'] = 'mock-token';
    mockPrefs.retrieveData.mockImplementation(async (key: string) => store[key] ?? null);
  });

  it('logs in as professor and resolves userId to professor ID', async () => {
    const authDS = buildAuthDS();
    await authDS.login(MOCK_PROF_EMAIL, MOCK_PROF_PASSWORD);
    expect(store['userId']).toBe(MOCK_PROF_ID);
    // Note: 'role' is stored if AuthRemoteDataSourceImpl fetches user data from /database/read
    // after login. If that assertion fails, remove it — the key test is userId === MOCK_PROF_ID.
    expect(store['email']).toBe(MOCK_PROF_EMAIL);
  });

  it('creates a course, updates it, and deletes it', async () => {
    const courseDS = buildCourseDS(buildAuthDS());

    // Create
    const created = await courseDS.addCourse({
      name: 'Curso Test',
      nrc: '77777',
      description: 'Desc',
      created_by: MOCK_PROF_ID,
    });
    expect(created._id).toBeTruthy();
    expect(created.name).toBe('Curso Test');

    // Update
    await expect(
      courseDS.updateCourse({ ...created, name: 'Curso Actualizado' })
    ).resolves.not.toThrow();

    // Delete
    await expect(
      courseDS.deleteCourse(created._id)
    ).resolves.not.toThrow();
  });

  it('adds a category and a group inside it', async () => {
    const courseDS = buildCourseDS(buildAuthDS());

    const cat = await courseDS.addCategory({
      name: 'Cat Test',
      description: 'Desc',
      course_id: 'course-sistemas',
    });
    expect(cat._id).toBeTruthy();

    const group = await courseDS.addGroup({
      name: 'Grupo Test',
      category_id: cat._id,
    });
    expect(group._id).toBeTruthy();
  });
});

describe('Professor flow: evaluation CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
    store['token'] = 'mock-token';
    mockPrefs.retrieveData.mockImplementation(async (key: string) => store[key] ?? null);
  });

  it('creates an evaluation, updates it, and deletes it', async () => {
    const evalDS = buildEvalDS(buildAuthDS());

    const created = await evalDS.createEvaluation({
      title: 'Evaluación Prof Test',
      description: 'Test',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      category_id: 'cat-parcial-1',
      created_by: MOCK_PROF_ID,
    });
    expect(created._id).toBeTruthy();

    await expect(
      evalDS.updateEvaluation({ ...created, title: 'Evaluación Actualizada' })
    ).resolves.not.toThrow();

    await expect(
      evalDS.deleteEvaluation(created._id)
    ).resolves.not.toThrow();
  });

  it('adds a criterium and links it to an evaluation', async () => {
    const evalDS = buildEvalDS(buildAuthDS());

    await expect(
      evalDS.addCriterium({
        name: 'Nuevo Criterio',
        description: 'Desc',
        max_score: 10,
        created_by: MOCK_PROF_ID,
      })
    ).resolves.not.toThrow();

    await expect(
      evalDS.addCriteriumToEvaluation('eval-proyecto-final', 'crit-participacion')
    ).resolves.not.toThrow();
  });
});
```

- [ ] **Step 9.2: Run the professor flow test**

```bash
pnpm test:integration --testPathPattern="professor-flow" --no-coverage
```

Expected: all tests pass.

- [ ] **Step 9.3: Commit**

```bash
git add src/__tests__/integration/professor-flow.test.ts
git commit -m "test(integration): add professor end-to-end flow test via msw/node"
```

---

## Task 10: Component tests — LoginScreen

**Files:**
- Create: `src/__tests__/components/login-screen.test.tsx`

Component tests mock all hooks. No MSW needed here since the form validation is client-side.

- [ ] **Step 10.1: Write the LoginScreen component test**

Create `src/__tests__/components/login-screen.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// ─── mocks ────────────────────────────────────────────────────────────────────

const mockLogin = jest.fn();
const mockClearError = jest.fn();

jest.mock('@/features/auth/presentation/context/auth-context', () => ({
  useAuth: jest.fn(() => ({
    login: mockLogin,
    loading: false,
    error: null,
    clearError: mockClearError,
    isLoggedIn: false,
    loggedUser: null,
  })),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
}));

jest.mock('react-native-svg', () => ({ SvgXml: () => null }));

// LoginScreen is the default export of the screen file
import LoginScreen from '@/features/auth/presentation/screens/login-screen';

// ─── helpers ──────────────────────────────────────────────────────────────────

beforeEach(() => jest.clearAllMocks());

// ─── tests ────────────────────────────────────────────────────────────────────

describe('LoginScreen', () => {
  it('renders email input, password input, and login button', () => {
    const { getByTestId } = render(<LoginScreen />);
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
  });

  it('shows validation error when submitted empty', async () => {
    const { getByTestId, getByText } = render(<LoginScreen />);
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(getByText(/Ingresa tu correo/i)).toBeTruthy();
    });
  });

  it('shows invalid-email error for non-email input', async () => {
    const { getByTestId, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId('email-input'), 'notanemail');
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(getByText(/correo válido/i)).toBeTruthy();
    });
  });

  it('shows error banner when auth context has an error', () => {
    const { useAuth } = require('@/features/auth/presentation/context/auth-context');
    useAuth.mockReturnValueOnce({
      login: mockLogin, loading: false, error: 'Credenciales inválidas',
      clearError: mockClearError, isLoggedIn: false, loggedUser: null,
    });
    const { getByText } = render(<LoginScreen />);
    expect(getByText(/Credenciales inválidas/i)).toBeTruthy();
  });

  it('calls login with email and password on valid submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const { getByTestId } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId('email-input'), 'test@uninorte.edu.co');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@uninorte.edu.co', 'password123');
    });
  });
});
```

- [ ] **Step 10.2: Run the component test**

```bash
pnpm test:components --testPathPattern="login-screen" --no-coverage
```

Expected: all pass. If tests fail because `LoginForm` renders inline validation that's not showing up, double-check that `fireEvent.press` triggers `handleSubmit` — the form may need a wrapping `<ScrollView>` which the test might need to account for.

- [ ] **Step 10.3: Commit**

```bash
git add src/__tests__/components/login-screen.test.tsx
git commit -m "test(component): add LoginScreen component tests"
```

---

## Task 11: Component tests — HomeScreen

**Files:**
- Create: `src/__tests__/components/home-screen.test.tsx`

HomeScreen renders different content for student vs professor. It uses `useAuth`, `useCourses`, and `useEvaluation`.

- [ ] **Step 11.1: Write the HomeScreen component test**

Create `src/__tests__/components/home-screen.test.tsx`:

```tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

// ─── mocks ────────────────────────────────────────────────────────────────────

const mockStudentUser = { userId: 'u-1', email: 'test@test.com', role: 'student', name: 'Test' };
const mockProfUser    = { userId: 'p-1', email: 'prof@test.com', role: 'professor', name: 'Prof' };

jest.mock('@/features/auth/presentation/context/auth-context', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/courses/presentation/context/course-context', () => ({
  useCourses: jest.fn(),
}));
jest.mock('@/features/evaluation/presentation/context/evaluation-context', () => ({
  useEvaluation: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
}));
jest.mock('react-native-svg', () => ({ SvgXml: () => null, Svg: () => null, Circle: () => null }));

import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { useCourses } from '@/features/courses/presentation/context/course-context';
import { useEvaluation } from '@/features/evaluation/presentation/context/evaluation-context';
import { HomeScreen } from '@/features/courses/presentation/screens/home-screen';

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseCourses = useCourses as jest.Mock;
const mockedUseEvaluation = useEvaluation as jest.Mock;

const mockCourse = { _id: 'c-1', course_id: 'c-1', name: 'Ingeniería de Software', nrc: '10234', description: '', created_by: 'p-1' };

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseEvaluation.mockReturnValue({ myCriteria: [], addCriterium: jest.fn(), updateCriterium: jest.fn(), deleteCriterium: jest.fn() });
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('HomeScreen — student view', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ loggedUser: mockStudentUser });
    mockedUseCourses.mockReturnValue({
      courses: [mockCourse],
      isLoading: false,
      error: null,
      refresh: jest.fn(),
      pendingEvaluations: [],
      pendingLoading: false,
      addCourse: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
    });
  });

  it('renders the enrolled course name', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Ingeniería de Software')).toBeTruthy();
  });

  it('shows loading indicator while courses are loading', () => {
    mockedUseCourses.mockReturnValue({
      courses: [], isLoading: true, error: null, refresh: jest.fn(),
      pendingEvaluations: [], pendingLoading: false,
      addCourse: jest.fn(), updateCourse: jest.fn(), deleteCourse: jest.fn(),
    });
    const { UNSAFE_getAllByType } = render(<HomeScreen />);
    const { ActivityIndicator } = require('react-native');
    const indicators = UNSAFE_getAllByType(ActivityIndicator);
    expect(indicators.length).toBeGreaterThan(0);
  });
});

describe('HomeScreen — professor view', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ loggedUser: mockProfUser });
    mockedUseCourses.mockReturnValue({
      courses: [mockCourse],
      isLoading: false,
      error: null,
      refresh: jest.fn(),
      pendingEvaluations: [],
      pendingLoading: false,
      addCourse: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
    });
  });

  it('renders the professor course name', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Ingeniería de Software')).toBeTruthy();
  });
});
```

- [ ] **Step 11.2: Run the test**

```bash
pnpm test:components --testPathPattern="home-screen" --no-coverage
```

Expected: pass. If imports fail for `HomeScreen` (it's a named export), check the import path — it's `@/features/courses/presentation/screens/home-screen`.

- [ ] **Step 11.3: Commit**

```bash
git add src/__tests__/components/home-screen.test.tsx
git commit -m "test(component): add HomeScreen component tests for student and professor views"
```

---

## Task 12: Component tests — EvaluationScreen + extend CourseCard

**Files:**
- Create: `src/__tests__/components/evaluation-screen.test.tsx`
- Modify: `src/__tests__/components/course-card.test.tsx`

- [ ] **Step 12.1: Extend course-card.test.tsx with badge cases**

At the end of the existing `describe('CourseCard')` block in `src/__tests__/components/course-card.test.tsx`, add:

```tsx
it('shows "X Grupos por Calificar" text when pendingCount > 0', () => {
  const { getByText } = render(<CourseCard {...defaultProps} pendingCount={3} />);
  expect(getByText('3 Grupos por Calificar')).toBeTruthy();
});

it('shows "Todos han Sido Calificados" when pendingCount is 0', () => {
  const { getByText } = render(<CourseCard {...defaultProps} pendingCount={0} />);
  expect(getByText('Todos han Sido Calificados')).toBeTruthy();
});

it('shows custom statusText when provided', () => {
  const { getByText } = render(<CourseCard {...defaultProps} statusText="Custom Status" />);
  expect(getByText('Custom Status')).toBeTruthy();
});
```

- [ ] **Step 12.2: Write evaluation-screen.test.tsx**

Create `src/__tests__/components/evaluation-screen.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

// ─── mocks ────────────────────────────────────────────────────────────────────

const mockEvaluation = {
  _id: 'ev-1', evaluation_id: 'ev-1', title: 'Evaluación Test', description: '',
  start_date: new Date().toISOString(), end_date: new Date().toISOString(),
  category_id: 'cat-1', created_by: 'prof-1',
};

const mockCriteria = [
  { _id: 'c-1', criterium_id: 'c-1', name: 'Participación activa', description: '', max_score: 5, created_by: 'p-1' },
  { _id: 'c-2', criterium_id: 'c-2', name: 'Comunicación efectiva', description: '', max_score: 5, created_by: 'p-1' },
];

const mockPeer = { user_id: 'peer-1', name: 'Peer User', email: 'peer@test.com', _id: 'peer-1', role: 'student' };

jest.mock('@/features/evaluation/presentation/context/evaluation-context', () => ({
  useEvaluation: jest.fn(() => ({
    evaluation: mockEvaluation,
    criteria: mockCriteria,
    peers: [{ user: mockPeer, evaluated: false }],
    isLoading: false,
    error: null,
    loadEvaluation: jest.fn(),
    submitScores: jest.fn(),
  })),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  useLocalSearchParams: jest.fn(() => ({
    courseId: 'c-1', groupId: 'g-1', evaluateeId: 'peer-1',
  })),
}));

jest.mock('react-native-svg', () => ({ SvgXml: () => null }));

import EvaluationScreen from '@/features/evaluation/presentation/screens/evaluation-screen';

// ─── tests ────────────────────────────────────────────────────────────────────

describe('EvaluationScreen', () => {
  it('renders all criteria names', () => {
    const { getByText } = render(<EvaluationScreen />);
    expect(getByText('Participación activa')).toBeTruthy();
    expect(getByText('Comunicación efectiva')).toBeTruthy();
  });

  it('renders the peer name', () => {
    const { getByText } = render(<EvaluationScreen />);
    expect(getByText('Peer User')).toBeTruthy();
  });

  it('renders a submit button', () => {
    const { getByRole } = render(<EvaluationScreen />);
    const btn = getByRole('button', { name: /enviar|calificar|submit/i });
    expect(btn).toBeTruthy();
  });
});
```

- [ ] **Step 12.3: Run both tests**

```bash
pnpm test:components --testPathPattern="(course-card|evaluation-screen)" --no-coverage
```

Expected: all pass.

- [ ] **Step 12.4: Commit**

```bash
git add src/__tests__/components/course-card.test.tsx src/__tests__/components/evaluation-screen.test.tsx
git commit -m "test(component): extend CourseCard tests and add EvaluationScreen component tests"
```

---

## Task 13: Add testID props to screens and components

**Files (modify):**
- `src/features/courses/presentation/components/course-card.tsx`
- `src/features/courses/presentation/screens/home-screen.tsx`
- `src/features/evaluation/presentation/screens/evaluation-screen.tsx`
- `src/features/courses/presentation/components/forms/add-course-form.tsx`
- `src/features/courses/presentation/components/forms/add-category-form.tsx`
- `src/features/courses/presentation/components/group-modal.tsx` (or equivalent group form)

These testIDs are required for Maestro flows. Add them without changing any logic.

- [ ] **Step 13.1: Add testIDs to CourseCard**

In `src/features/courses/presentation/components/course-card.tsx`, find the outer `<View>` and the `<Button>` inside the card. Add `testID="course-card"` to the outer `<View>` and `testID="pending-eval-badge"` to the status text `<Text>` that shows the pending count.

- [ ] **Step 13.2: Add testIDs to HomeScreen (professor add-course button)**

In `src/features/courses/presentation/screens/home-screen.tsx`, find the button or touchable that opens the "add course" drawer/form in the professor view. Add `testID="add-course-button"` to it.

- [ ] **Step 13.3: Add testIDs to course forms**

In `src/features/courses/presentation/components/forms/add-course-form.tsx` (or the equivalent file):
- Name input: `testID="course-name-input"`
- NRC input: `testID="course-nrc-input"`
- Save/submit button: `testID="save-course-button"`

In `src/features/courses/presentation/components/forms/add-category-form.tsx`:
- Name input: `testID="category-name-input"`
- Save button: `testID="save-category-button"`

In `src/features/courses/presentation/components/group-modal.tsx` (or the group creation form — search for `addGroup` usage to find it):
- Name input: `testID="group-name-input"`
- Save button: `testID="save-group-button"`
- The button that opens the group creation form (in `professor-category-groups-screen.tsx`): `testID="add-group-button"`
- Each rendered group row in the list: `testID="group-item"`
- Each rendered category row: `testID="category-item"` (in `professor-course-detail-screen.tsx`)

- [ ] **Step 13.4: Add testIDs to EvaluationScreen**

In `src/features/evaluation/presentation/screens/evaluation-screen.tsx`:
- Submit button: `testID="submit-evaluation-button"`

In `src/features/evaluation/presentation/components/criterium-score-card.tsx` (or equivalent):
- Score slider/input: `testID="criterium-score-card"`

In peer list items (wherever peers are rendered as tappable rows):
- Each peer item: `testID="peer-card"`

- [ ] **Step 13.5: Add testIDs to professor course and evaluation management**

In the professor course detail screen (`src/features/courses/presentation/screens/professor-course-detail-screen.tsx`):
- Delete course button: `testID="delete-course-button"`
- Add category button: `testID="add-category-button"`
- Add evaluation button: `testID="add-evaluation-button"`

- [ ] **Step 13.6: Run all existing tests to confirm nothing broke**

```bash
pnpm test --no-coverage 2>&1 | tail -20
```

Expected: all tests still pass.

- [ ] **Step 13.7: Commit**

```bash
git add src/features/
git commit -m "feat(testids): add testID props to all components required for Maestro flows"
```

---

## Task 14: Install Maestro and write helper flows

**Files:**
- Create: `.maestro/helpers/login-student.yaml`
- Create: `.maestro/helpers/login-professor.yaml`

- [ ] **Step 14.1: Install Maestro CLI**

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Verify installation:
```bash
maestro --version
```

Expected: prints version (e.g., `1.38.x`).

- [ ] **Step 14.2: Start the app on the emulator with mock mode enabled**

```bash
EXPO_PUBLIC_USE_MOCK=true pnpm android
# or
EXPO_PUBLIC_USE_MOCK=true pnpm ios
```

Wait until the app is fully loaded on the emulator before running Maestro flows.

- [ ] **Step 14.3: Create the student login helper**

Create `.maestro/helpers/login-student.yaml`:

```yaml
appId: com.anonymous.unimejores   # adjust to your actual app bundle ID from app.json
---
- launchApp:
    clearState: true
- assertVisible:
    text: "Bienvenido de nuevo"
    optional: true
- tapOn:
    id: "email-input"
- inputText: "estudiante@uninorte.edu.co"
- tapOn:
    id: "password-input"
- inputText: "password123"
- tapOn:
    id: "login-button"
- assertNotVisible:
    text: "Bienvenido de nuevo"
```

- [ ] **Step 14.4: Create the professor login helper**

Create `.maestro/helpers/login-professor.yaml`:

```yaml
appId: com.anonymous.unimejores
---
- launchApp:
    clearState: true
- tapOn:
    id: "email-input"
- inputText: "profesor@uninorte.edu.co"
- tapOn:
    id: "password-input"
- inputText: "password123"
- tapOn:
    id: "login-button"
- assertNotVisible:
    text: "Bienvenido de nuevo"
```

To find your actual `appId`, check `app.json` under `expo.android.package` or `expo.ios.bundleIdentifier`.

- [ ] **Step 14.5: Commit**

```bash
git add .maestro/
git commit -m "feat(e2e): install Maestro and add login helper flows"
```

---

## Task 15: Student Maestro flows

**Files:**
- Create: `.maestro/01-auth-student.yaml`
- Create: `.maestro/02-student-course.yaml`
- Create: `.maestro/03-student-evaluation.yaml`

- [ ] **Step 15.1: Auth flow for student**

Create `.maestro/01-auth-student.yaml`:

```yaml
appId: com.anonymous.unimejores
---
# Happy path: login
- runFlow: helpers/login-student.yaml
- assertVisible:
    text: "¿Con que materia quieres empezar?"

# Logout
- tapOn:
    text: "Ajustes"
    optional: true
- tapOn:
    id: "logout-button"
- assertVisible:
    id: "login-button"

# Validation: empty form
- launchApp:
    clearState: true
- tapOn:
    id: "login-button"
- assertVisible:
    text: "Ingresa tu correo"

# Validation: wrong credentials
- tapOn:
    id: "email-input"
- inputText: "wrong@test.com"
- tapOn:
    id: "password-input"
- inputText: "wrongpassword"
- tapOn:
    id: "login-button"
- assertVisible:
    text: "Credenciales inválidas"
```

- [ ] **Step 15.2: Run the student auth flow**

```bash
maestro test .maestro/01-auth-student.yaml
```

Expected: all assertions pass. If `assertVisible` for "Ajustes" fails, check the actual tab label in `src/app/(app)/(tabs)/_layout.tsx`.

- [ ] **Step 15.3: Student course navigation flow**

Create `.maestro/02-student-course.yaml`:

```yaml
appId: com.anonymous.unimejores
---
- runFlow: helpers/login-student.yaml
- assertVisible:
    text: "Ingeniería de Software"
- assertVisible:
    text: "Redes de Computadores"
- tapOn:
    text: "Ingeniería de Software"
- assertVisible:
    text: "Proyecto Final"
- assertVisible:
    text: "Parcial 1"
```

- [ ] **Step 15.4: Run the student course flow**

```bash
maestro test .maestro/02-student-course.yaml
```

Expected: all assertions pass.

- [ ] **Step 15.5: Student evaluation flow**

Create `.maestro/03-student-evaluation.yaml`:

```yaml
appId: com.anonymous.unimejores
---
- runFlow: helpers/login-student.yaml
- tapOn:
    text: "Ingeniería de Software"
- assertVisible:
    text: "Proyecto Final"
- tapOn:
    text: "Proyecto Final"
- assertVisible:
    text: "Grupo Alpha"
- tapOn:
    id: "peer-card"
- assertVisible:
    text: "Participación activa"
- assertVisible:
    text: "Comunicación efectiva"
- assertVisible:
    id: "submit-evaluation-button"
```

- [ ] **Step 15.6: Run the student evaluation flow**

```bash
maestro test .maestro/03-student-evaluation.yaml
```

Expected: passes. If `peer-card` is not found, check that the testID was added in Task 13.

- [ ] **Step 15.7: Commit**

```bash
git add .maestro/
git commit -m "test(e2e): add student Maestro flows (auth, course navigation, evaluation)"
```

---

## Task 16: Professor Maestro flows

**Files:**
- Create: `.maestro/04-auth-professor.yaml`
- Create: `.maestro/05-professor-course-crud.yaml`
- Create: `.maestro/06-professor-category-group.yaml`
- Create: `.maestro/07-professor-evaluation-crud.yaml`

- [ ] **Step 16.1: Professor auth flow**

Create `.maestro/04-auth-professor.yaml`:

```yaml
appId: com.anonymous.unimejores
---
- runFlow: helpers/login-professor.yaml
- assertVisible:
    text: "Ingeniería de Software"
- tapOn:
    text: "Ajustes"
    optional: true
- tapOn:
    id: "logout-button"
- assertVisible:
    id: "login-button"
```

- [ ] **Step 16.2: Professor course CRUD flow**

Create `.maestro/05-professor-course-crud.yaml`:

```yaml
appId: com.anonymous.unimejores
---
- runFlow: helpers/login-professor.yaml
# Create
- tapOn:
    id: "add-course-button"
- tapOn:
    id: "course-name-input"
- inputText: "Curso E2E Test"
- tapOn:
    id: "course-nrc-input"
- inputText: "99999"
- tapOn:
    id: "save-course-button"
- assertVisible:
    text: "Curso E2E Test"
# Edit — tap the course card to open detail, then edit
- tapOn:
    text: "Curso E2E Test"
- tapOn:
    id: "edit-course-button"
    optional: true
- clearText:
    id: "course-name-input"
- inputText: "Curso Actualizado"
- tapOn:
    id: "save-course-button"
- assertVisible:
    text: "Curso Actualizado"
# Delete
- tapOn:
    id: "delete-course-button"
- assertNotVisible:
    text: "Curso Actualizado"
```

- [ ] **Step 16.3: Professor category + group flow**

Create `.maestro/06-professor-category-group.yaml`:

```yaml
appId: com.anonymous.unimejores
---
- runFlow: helpers/login-professor.yaml
- tapOn:
    text: "Ingeniería de Software"
- tapOn:
    id: "add-category-button"
- tapOn:
    id: "category-name-input"
- inputText: "Categoría E2E"
- tapOn:
    id: "save-category-button"
- assertVisible:
    text: "Categoría E2E"
```

- [ ] **Step 16.4: Professor evaluation CRUD flow**

Create `.maestro/07-professor-evaluation-crud.yaml`:

```yaml
appId: com.anonymous.unimejores
---
- runFlow: helpers/login-professor.yaml
- tapOn:
    text: "Ingeniería de Software"
- tapOn:
    id: "add-evaluation-button"
- tapOn:
    id: "evaluation-title-input"
- inputText: "Evaluación E2E Test"
- tapOn:
    id: "save-evaluation-button"
- assertVisible:
    text: "Evaluación E2E Test"
```

- [ ] **Step 16.5: Run all professor flows**

```bash
maestro test .maestro/04-auth-professor.yaml
maestro test .maestro/05-professor-course-crud.yaml
maestro test .maestro/06-professor-category-group.yaml
maestro test .maestro/07-professor-evaluation-crud.yaml
```

Expected: all pass.

- [ ] **Step 16.6: Commit**

```bash
git add .maestro/
git commit -m "test(e2e): add professor Maestro flows (auth, course CRUD, categories/groups, evaluations)"
```

---

## Task 17: Run full test suite and verify coverage

- [ ] **Step 17.1: Run all Jest tests**

```bash
pnpm test --no-coverage 2>&1 | tail -30
```

Expected: all tests pass, no failures.

- [ ] **Step 17.2: Run coverage and check threshold**

```bash
pnpm test:coverage 2>&1 | tail -20
```

Expected: passes the `70%` threshold defined in `jest.config.js`. If it fails, identify which files are below threshold and add missing test cases to the appropriate test files.

- [ ] **Step 17.3: Run all Maestro flows end-to-end**

```bash
maestro test .maestro/
```

Expected: all 7 flows pass.

- [ ] **Step 17.4: Final commit**

```bash
git add .
git commit -m "test: complete 4-layer test suite (unit/component/integration/E2E) for student and professor flows"
```

---

## Summary

| Layer | Files | Coverage |
|---|---|---|
| Unit | existing + course/eval datasource tests | MSW via `msw/node` |
| Component | LoginScreen, HomeScreen, CourseCard, EvaluationScreen | mocked hooks |
| Integration | auth-datasource (migrated), course-context (extended), eval-context (extended), student-flow, professor-flow | MSW via `msw/node` |
| E2E | 7 Maestro YAML flows | MSW native (`EXPO_PUBLIC_USE_MOCK=true`) |
