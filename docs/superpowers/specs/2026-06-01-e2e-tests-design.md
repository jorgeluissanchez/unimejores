# Test Suite Design — UniMejores

**Date:** 2026-06-01  
**Project:** UniMejores (Expo + React Native, peer-evaluation platform)  
**Scope:** Full test suite covering unit, component, integration, and E2E layers

---

## Context

UniMejores is a React Native (Expo managed workflow) app for university peer evaluation. It has two roles:

- **Student**: enrols in courses, views categories/groups, submits peer evaluations
- **Professor**: creates courses, manages categories/groups/students, creates evaluations and criteria

The app uses a clean architecture (feature modules with domain/data/presentation layers), MSW v2 for API mocking, Jest + RNTL for unit/integration tests, and Playwright for web E2E (already in place and not in scope here).

**What is missing:** professor flow, full student flow, E2E on a real device/emulator, and MSW properly wired into Jest.

---

## Goals

1. All four test layers present and passing: unit, component, integration, E2E
2. MSW `msw/node` used in Jest (fix current ESM workaround)
3. E2E runs on iOS/Android emulator via **Maestro** using the existing `msw/native` setup
4. Full coverage of both student and professor flows, including auth and CRUD
5. Minimum Jest coverage threshold: **70%** statements across `src/features/**`

---

## Architecture

### Test layers

| Layer | Tool | Environment | MSW |
|---|---|---|---|
| Unit | Jest | Node (CI) | Optional (pure logic) |
| Component | Jest + RNTL | Node (CI) | `msw/node` |
| Integration | Jest + RNTL | Node (CI) | `msw/node` |
| E2E | Maestro | iOS/Android emulator | `msw/native` (already exists) |

The Playwright web E2E (already working) is kept as-is and not modified.

---

## Changes to mock data (`src/mocks/db.ts`)

**This is a prerequisite step.** The following constants and data do not yet exist and must be added to `src/mocks/db.ts` before any other work:

```ts
export const MOCK_PROF_ID       = 'user-professor';
export const MOCK_PROF_EMAIL    = 'profesor@uninorte.edu.co';
export const MOCK_PROF_PASSWORD = 'password123';
```

- Add the professor to `users[]` with `role: "professor"` and `user_id: MOCK_PROF_ID`
- Add `userCourses` entries linking the professor to existing courses with `role: "professor"`

The auth handler update in `auth.handlers.ts` imports `MOCK_PROF_ID`, `MOCK_PROF_EMAIL`, and `MOCK_PROF_PASSWORD` from `db.ts` — this will fail at import time if those exports don't exist first.

---

## Fix: MSW in Jest

**Problem:** Current integration tests use `jest.fn()` on `global.fetch` because MSW's ESM caused resolution errors in the Jest/CJS environment.

**Two files involved — keep them separate:**
- `src/mocks/server.ts` uses `msw/native` for the running app. **Do not touch this file.**
- `src/__tests__/setup/msw-server.ts` is **new**, uses `msw/node` exclusively for Jest.

### Step 1 — Fix `transformIgnorePatterns` in `jest.config.js`

MSW v2 and its dependency chain require transpilation. Add `msw`, `@mswjs/interceptors`, and `@bundled-es-modules/statuses` to the existing allow-list inside `transformIgnorePatterns`:

```js
transformIgnorePatterns: [
  "/node_modules/(?!(.pnpm|react-native|@react-native(-community)?|@rn-primitives|expo(nent)?|@expo(nent)?|@expo-google-fonts|react-navigation|@react-navigation|nativewind|lucide-react-native|@shopify|msw|@mswjs/interceptors|@bundled-es-modules))",
  "/node_modules/react-native-reanimated/plugin/",
  "/node_modules/@react-native/babel-preset/",
],
```

### Step 2 — Create `src/__tests__/setup/msw-server.ts`

```ts
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';
export const server = setupServer(...handlers);
```

### Step 3 — Register in `jest.config.js`

Add to jest config (note: the correct key is `setupFilesAfterEnv`, not `setupFilesAfterFramework`):

```js
setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/msw-server.ts'],
```

### Step 4 — Usage pattern in each test file

```ts
import { server } from '@/src/__tests__/setup/msw-server';
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Tests that need to override a handler use `server.use(http.post(...))`.

---

## Auth handler — multi-user support

The existing `makeToken` in `src/mocks/handlers/auth.handlers.ts` hardcodes `email: MOCK_EMAIL` (student email) regardless of `sub`. This must be updated to accept an email parameter:

```ts
function makeToken(sub: string, email: string): string {
  const payload = btoa(JSON.stringify({ sub, email, iat: Date.now(), exp: Date.now() + 3600 * 1000 }));
  ...
}
```

The login handler is extended to branch on credentials:
- Student credentials (`MOCK_EMAIL` / `MOCK_PASSWORD`) → token with `sub: MOCK_USER_ID`, `email: MOCK_EMAIL`
- Professor credentials (`MOCK_PROF_EMAIL` / `MOCK_PROF_PASSWORD`) → token with `sub: MOCK_PROF_ID`, `email: MOCK_PROF_EMAIL`
- Anything else → 401

---

## File structure

```
src/__tests__/
  setup/
    env.ts                                   (exists)
    msw-server.ts                            (new — exports server from msw/node)
  unit/
    utils.test.ts                            (exists)
    container.test.ts                        (exists)
    local-preferences-async-storage.test.ts  (exists)
    course-repository.test.ts               (new — API response → entity mapping)
    evaluation-repository.test.ts           (new — score/criteria mapping)
  components/
    button.test.tsx                          (exists)
    logout-button.test.tsx                   (exists)
    course-card.test.tsx                     (exists — extend with badge and professor cases)
    login-screen.test.tsx                    (new)
    home-screen.test.tsx                     (new — student view and professor view)
    evaluation-screen.test.tsx               (new)
  integration/
    auth-context.test.tsx                    (exists — keep, no changes)
    auth-datasource.test.ts                  (exists — migrate from jest.fn() to msw/node)
    course-context.test.tsx                  (exists — extend with professor CRUD cases)
    evaluation-context.test.tsx              (exists — extend with professor management cases)
    student-flow.test.tsx                    (new — full student journey in Jest)
    professor-flow.test.tsx                  (new — full professor journey in Jest)

.maestro/
  helpers/
    login-student.yaml
    login-professor.yaml
  01-auth-student.yaml
  02-student-course.yaml
  03-student-evaluation.yaml
  04-auth-professor.yaml
  05-professor-course-crud.yaml
  06-professor-category-group.yaml
  07-professor-evaluation-crud.yaml
```

---

## Integration test flows

### Student flow (`student-flow.test.tsx`)

1. Login with student credentials → `AuthContext` sets user with `role: "student"`
2. `CourseContext` loads enrolled courses via MSW → two courses returned
3. `CourseContext` loads pending evaluations → one pending evaluation
4. `EvaluationContext` loads evaluation + criteria + peers for group → correct state
5. `EvaluationContext` submits scores for a peer → peer marked as evaluated
6. Logout → user cleared from `AuthContext`

### Professor flow (`professor-flow.test.tsx`)

1. Login with professor credentials → `AuthContext` sets user with `role: "professor"`
2. `CourseContext` loads created courses via MSW
3. Course CRUD: `addCourse` → new course in state; `updateCourse` → state updated; `deleteCourse` → removed
4. Category CRUD: `addCategory`, `updateCategory`, `deleteCategory`
5. Group CRUD: `addGroup`, `updateGroup`, `deleteGroup`
6. Student enrollment: `addStudentToCourse(courseId, userId)`; `removeStudentFromCourse(userCourseId)` — note: remove takes a single `userCourseId` string, not a `(courseId, userId)` pair
7. `EvaluationContext` — criteria CRUD: `addCriterium`, `updateCriterium`, `deleteCriterium`
8. `EvaluationContext` — evaluation CRUD: `createEvaluation`, `updateEvaluation`, `deleteEvaluation`

---

## E2E Maestro flows

The app runs on the emulator with `EXPO_PUBLIC_USE_MOCK=true`. MSW native intercepts all network traffic — no external server needed.

### Setup
```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run a single flow
maestro test .maestro/01-auth-student.yaml

# Run all flows
maestro test .maestro/
```

### Flow descriptions

| File | Description |
|---|---|
| `helpers/login-student.yaml` | Reusable: fill login form with student credentials and submit |
| `helpers/login-professor.yaml` | Reusable: fill login form with professor credentials and submit |
| `01-auth-student.yaml` | Student login → home visible; logout → login screen; form validation errors (empty, wrong credentials) |
| `02-student-course.yaml` | Student sees enrolled courses; taps course → categories visible |
| `03-student-evaluation.yaml` | Navigate to peer evaluation form → score all criteria → submit → redirect |
| `04-auth-professor.yaml` | Professor login → professor home visible; logout |
| `05-professor-course-crud.yaml` | Create course → visible in list; edit name → updated; delete → removed |
| `06-professor-category-group.yaml` | Add category → visible; add group → visible; delete group |
| `07-professor-evaluation-crud.yaml` | Create evaluation → visible; edit → updated; delete → removed |

---

## `testID` inventory

Maestro finds elements by `testID` (preferred). The following `testID` props already exist and must not be changed:

| testID | Location |
|---|---|
| `email-input` | `login-form.tsx` |
| `password-input` | `login-form.tsx` |
| `login-button` | `login-form.tsx` |
| `create-account-button` | `login-screen.tsx`, `signup-screen.tsx` |
| `signup-name-input` | `signup-form.tsx` |
| `signup-email-input` | `signup-form.tsx` |
| `signup-password-input` | `signup-form.tsx` |
| `signup-confirm-password-input` | `signup-form.tsx` |
| `signup-button` | `signup-form.tsx` |
| `logout-button` | `logout-button.tsx` |

The following `testID` props **do not exist yet** and must be added during implementation:

| testID | Component/Screen | Used by |
|---|---|---|
| `course-card` | `CourseCard` | `02-student-course.yaml`, `05-professor-course-crud.yaml` |
| `pending-eval-badge` | `PendingEvalCard` / `CourseCard` | `02-student-course.yaml` |
| `add-course-button` | `HomeScreen` (professor) | `05-professor-course-crud.yaml` |
| `course-name-input` | Add/Edit Course form | `05-professor-course-crud.yaml` |
| `course-nrc-input` | Add/Edit Course form | `05-professor-course-crud.yaml` |
| `save-course-button` | Add/Edit Course form | `05-professor-course-crud.yaml` |
| `delete-course-button` | Course card / detail | `05-professor-course-crud.yaml` |
| `category-item` | Category list | `06-professor-category-group.yaml` |
| `add-category-button` | Course detail (professor) | `06-professor-category-group.yaml` |
| `category-name-input` | Add Category form | `06-professor-category-group.yaml` |
| `add-group-button` | Category detail | `06-professor-category-group.yaml` |
| `group-name-input` | Add Group form | `06-professor-category-group.yaml` |
| `group-item` | Group list | `06-professor-category-group.yaml` |
| `add-evaluation-button` | Course detail (professor) | `07-professor-evaluation-crud.yaml` |
| `evaluation-title-input` | Create Evaluation form | `07-professor-evaluation-crud.yaml` |
| `peer-card` | Peer list (student) | `03-student-evaluation.yaml` |
| `criterium-score-card` | Evaluation form (student) | `03-student-evaluation.yaml` |
| `submit-evaluation-button` | Evaluation form (student) | `03-student-evaluation.yaml` |

---

## Component tests scope

| Component | What is tested |
|---|---|
| `LoginScreen` | Renders email/password fields; shows validation errors on empty submit; shows error banner on MSW 401 |
| `HomeScreen` (student) | Renders course list from MSW; renders pending evaluation badge |
| `HomeScreen` (professor) | Renders professor course list; renders add-course button |
| `CourseCard` (extend existing) | Add: shows pending count badge when > 0; renders correctly for professor |
| `EvaluationScreen` | Renders criteria list; score inputs interactive; submit button present |

---

## Unit test scope (additions)

| File | What is tested |
|---|---|
| `course-repository.test.ts` | `getMyEnrolledCourses` maps API rows to `Course[]`; `getPendingEvaluations` filters by group membership |
| `evaluation-repository.test.ts` | `submitEvaluation` sends correct records; `getCriteriaByEvaluation` maps to `Criterium[]` |

---

## Error handling coverage

- MSW `server.use()` overrides tested for: 401 → session expired, 404 → empty state, 500 → error banner in UI
- Maestro flows include at least one unhappy path per major flow (wrong credentials → error visible)

---

## Coverage threshold

Add to `jest.config.js`. The threshold uses `'./src/**'` to match the existing `collectCoverageFrom` pattern (`src/**/*.{ts,tsx}`):

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

---

## CI compatibility

- Jest tests: run via `pnpm test` — no emulator needed
- Maestro tests: require a running emulator or device; run via `maestro test .maestro/`
- `EXPO_PUBLIC_USE_MOCK=true` must be set when building/starting the app for Maestro

---

## Non-goals

- Playwright web E2E is already working and is not modified
- No Detox configuration
- No testing of push notifications, file export, or CSV import flows
