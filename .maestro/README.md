# Maestro E2E Flows

## Prerequisites

### 1. Install Maestro CLI
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### 2. Start the app with mock mode
The app must run with `EXPO_PUBLIC_USE_MOCK=true` so MSW native intercepts all API calls.

```bash
# Android emulator
EXPO_PUBLIC_USE_MOCK=true pnpm android

# iOS simulator
EXPO_PUBLIC_USE_MOCK=true pnpm ios
```

### 3. Verify app bundle ID
The flows use `appId: com.anonymous.unimejores`. If your app has a different bundle ID (check `app.json`), update all flow files.

---

## Running flows

```bash
# Single flow
maestro test .maestro/01-auth-student.yaml

# All student flows
maestro test .maestro/01-auth-student.yaml .maestro/02-student-course.yaml .maestro/03-student-evaluation.yaml

# All professor flows
maestro test .maestro/04-auth-professor.yaml .maestro/05-professor-course-crud.yaml .maestro/06-professor-category-group.yaml .maestro/07-professor-evaluation-crud.yaml

# All flows
maestro test .maestro/
```

---

## Flows

| File | Role | Description |
|---|---|---|
| `helpers/login-student.yaml` | Helper | Login as student (reused by other flows) |
| `helpers/login-professor.yaml` | Helper | Login as professor (reused by other flows) |
| `01-auth-student.yaml` | Student | Login, logout, form validation errors |
| `02-student-course.yaml` | Student | View enrolled courses and categories |
| `03-student-evaluation.yaml` | Student | Navigate to peer evaluation form |
| `04-auth-professor.yaml` | Professor | Login and logout |
| `05-professor-course-crud.yaml` | Professor | Create, edit, delete a course |
| `06-professor-category-group.yaml` | Professor | Add category and group to a course |
| `07-professor-evaluation-crud.yaml` | Professor | Create an evaluation |

---

## Mock credentials

| Role | Email | Password |
|---|---|---|
| Student | `estudiante@uninorte.edu.co` | `password123` |
| Professor | `profesor@uninorte.edu.co` | `password123` |

These credentials are handled by the MSW auth handler (`src/mocks/handlers/auth.handlers.ts`).
