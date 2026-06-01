# Unimejores — Evaluación de Pares

> **Demo en video:** [https://youtu.be/LlB-8COr6YY?si=kEIsA385H7AokzJw](https://youtu.be/LlB-8COr6YY?si=kEIsA385H7AokzJw)

Aplicación móvil multiplataforma (iOS · Android · Web) desarrollada con **Expo / React Native** que permite a estudiantes y profesores gestionar **evaluaciones de pares** en proyectos grupales universitarios.

---

## Tabla de contenidos

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Variables de entorno](#variables-de-entorno)
- [Instalación](#instalación)
- [Ejecutar la aplicación](#ejecutar-la-aplicación)
- [Testing](#testing)
- [Storybook](#storybook)
- [Mocks de desarrollo](#mocks-de-desarrollo)

---

## Descripción

Unimejores conecta estudiantes y profesores a través de un sistema de evaluación entre pares:

| Rol | Capacidades |
|---|---|
| **Estudiante** | Ver cursos inscritos, evaluar compañeros de grupo según criterios definidos, consultar resultados |
| **Profesor** | Crear y gestionar cursos, categorías y grupos, definir criterios de evaluación, revisar reportes |

Flujo principal:

1. El profesor crea un curso → categorías → grupos → criterios → evaluación
2. Los estudiantes ingresan, ven su grupo asignado y califican a cada compañero
3. El sistema consolida las puntuaciones y genera reportes exportables

---

## Tecnologías

| Área | Herramienta |
|---|---|
| Framework | Expo 55 + React Native 0.83 + React 19 |
| Navegación | Expo Router (file-based routing) |
| Estilos | NativeWind 4 + Tailwind CSS 3 |
| UI primitivos | @rn-primitives (Radix-UI para RN) |
| Iconos | Lucide React Native |
| Animaciones | React Native Reanimated 4 |
| Fuentes | Cal Sans · ABeeZee (Expo Google Fonts) |
| HTTP / API | Fetch nativo → Roble API (Uninorte) |
| Persistencia local | AsyncStorage |
| Testing (unitario / componente / integración) | Jest 29 + @testing-library/react-native |
| Mocking HTTP en tests y desarrollo | MSW 2 (Mock Service Worker — `msw/node` en Jest, `msw/native` en app) |
| Testing E2E web | Playwright 1.60 |
| Testing E2E emulador | Maestro CLI |
| Documentación de componentes | Storybook 8 (react-vite) |
| Package manager | pnpm |
| TypeScript | 5.9 strict mode |

---

## Arquitectura

El proyecto sigue **Clean Architecture** organizada por features, con tres capas bien separadas:

```
Domain  ──▶  Data  ──▶  Presentation
(contratos)   (HTTP)      (UI + contextos)
```

### Inyección de dependencias

Se usa un contenedor DI casero (`src/core/di/`) con tokens simbólicos:

```
TOKENS.AuthRepo          → AuthRepositoryImpl
TOKENS.CourseRepo        → CourseRepositoryImpl
TOKENS.EvaluationRepo    → EvaluationRepositoryImpl
```

El `DIProvider` instancia todo el árbol de dependencias una sola vez al arrancar la app.

---

## Estructura del proyecto

```
unimejores/
│
├── app.json                          # Configuración Expo
├── jest.config.js                    # Configuración Jest
├── playwright.config.ts              # Configuración Playwright E2E
├── tailwind.config.js                # Configuración Tailwind/NativeWind
│
├── assets/                           # Fuentes, imágenes, iconos
│
├── e2e/                              # Tests E2E web (Playwright)
│   ├── login.spec.ts                 #   Flujo de autenticación
│   └── evaluation.spec.ts            #   Flujo de evaluación de pares
│
├── .maestro/                         # Tests E2E emulador (Maestro)
│   ├── README.md                     #   Instrucciones de ejecución
│   ├── helpers/
│   │   ├── login-student.yaml        #   Helper reutilizable: login estudiante
│   │   └── login-professor.yaml      #   Helper reutilizable: login profesor
│   ├── 01-auth-student.yaml          #   Login, logout, validaciones
│   ├── 02-student-course.yaml        #   Ver cursos y categorías
│   ├── 03-student-evaluation.yaml    #   Navegar al formulario de evaluación
│   ├── 04-auth-professor.yaml        #   Login/logout como profesor
│   ├── 05-professor-course-crud.yaml #   Crear, editar y eliminar curso
│   ├── 06-professor-category-group.yaml #  Agregar categoría y grupo
│   └── 07-professor-evaluation-crud.yaml # Crear evaluación
│
├── src/
│   │
│   ├── app/                          # Rutas Expo Router (file-based)
│   │   ├── _layout.tsx               #   Layout raíz (DIProvider + AuthProvider)
│   │   ├── index.tsx                 #   Redirección inicial
│   │   │
│   │   ├── (auth)/                   # Rutas públicas (sin sesión)
│   │   │   ├── landing.tsx
│   │   │   ├── login.tsx
│   │   │   ├── signup.tsx
│   │   │   └── forgot-password.tsx
│   │   │
│   │   └── (app)/                    # Rutas protegidas (con sesión)
│   │       ├── welcome.tsx
│   │       ├── (tabs)/               #   Navegación por pestañas
│   │       │   ├── home.tsx          #     Pantalla principal
│   │       │   ├── reports.tsx       #     Reportes
│   │       │   └── settings.tsx      #     Ajustes
│   │       │
│   │       ├── course/[courseId]/    #   Detalle de curso (estudiante)
│   │       │   ├── index.tsx
│   │       │   └── group/[groupId]/evaluatee/[evaluateeId].tsx
│   │       │
│   │       └── professor-course/[courseId]/   # Gestión de curso (profesor)
│   │           ├── index.tsx
│   │           └── category/[categoryId]/
│   │               ├── index.tsx
│   │               └── group/[groupId].tsx
│   │
│   ├── core/                         # Código compartido entre features
│   │   ├── components/ui/            #   30+ componentes UI (Button, Input, Card…)
│   │   ├── constants/                #   Tokens DI, temas de color
│   │   ├── di/                       #   Contenedor DI + DIProvider
│   │   ├── hooks/                    #   useTheme, useColorScheme
│   │   ├── lib/                      #   Utilidades (cn, parseCsvLine…)
│   │   └── storage/                  #   LocalPreferencesAsyncStorage (singleton)
│   │
│   ├── features/
│   │   │
│   │   ├── auth/                     # Feature: Autenticación
│   │   │   ├── domain/
│   │   │   │   ├── entities/auth-user.ts
│   │   │   │   └── repositories/auth-repository.ts   (interfaz)
│   │   │   ├── data/
│   │   │   │   ├── datasources/auth-remote-data-source-impl.ts
│   │   │   │   └── repositories/auth-repository-impl.ts
│   │   │   └── presentation/
│   │   │       ├── context/auth-context.tsx           (AuthProvider + useAuth)
│   │   │       ├── components/  (LoginForm, SignupForm, LogoutButton…)
│   │   │       └── screens/     (LoginScreen, SignupScreen…)
│   │   │
│   │   ├── courses/                  # Feature: Gestión de cursos
│   │   │   ├── domain/
│   │   │   │   ├── entities/course.ts  (Course, Category, Group, Member…)
│   │   │   │   └── repositories/course-repository.ts
│   │   │   ├── data/
│   │   │   └── presentation/
│   │   │       ├── context/course-context.tsx         (CourseProvider + useCourses)
│   │   │       ├── context/course-detail-context.tsx
│   │   │       ├── components/  (CourseCard, PeerCard, CategoryTab…)
│   │   │       └── screens/     (HomeScreen, CourseDetailScreen…)
│   │   │
│   │   ├── evaluation/               # Feature: Evaluación de pares
│   │   │   ├── domain/
│   │   │   │   ├── entities/evaluation.ts  (Evaluation, Criterium, Result…)
│   │   │   │   └── repositories/evaluation-repository.ts
│   │   │   ├── data/
│   │   │   └── presentation/
│   │   │       ├── context/evaluation-context.tsx     (EvaluationProvider + useEvaluation)
│   │   │       ├── components/  (CriteriumScoreCard, CriteriaDrawer…)
│   │   │       └── screens/     (EvaluationScreen)
│   │   │
│   │   ├── reports/                  # Feature: Reportes
│   │   │   └── presentation/screens/reports-screen.tsx
│   │   │
│   │   └── settings/                 # Feature: Ajustes
│   │       └── presentation/screens/settings-screen.tsx
│   │
│   ├── mocks/                        # MSW — servidor HTTP en memoria (dev)
│   │   ├── db.ts                     #   Datos de prueba con Faker (seed 42)
│   │   ├── server.ts                 #   setupServer (React Native)
│   │   ├── handlers/
│   │   │   ├── auth.handlers.ts      #   POST /auth/login, signup, logout…
│   │   │   └── database.handlers.ts  #   GET/POST/PUT/DELETE /database/read…
│   │   ├── index.ts                  #   Auto-detecta web vs native
│   │   ├── index.web.ts              #   Service Worker (browser)
│   │   └── index.native.ts           #   Interceptor nativo
│   │
│   └── __tests__/                    # Suite de tests Jest (181 tests)
│       ├── setup/
│       │   ├── env.ts                #   Variables de entorno para Jest
│       │   └── msw-server.ts         #   Servidor MSW/node global (beforeAll/afterEach/afterAll)
│       ├── unit/                     #   Tests unitarios — funciones puras
│       │   ├── utils.test.ts
│       │   ├── container.test.ts
│       │   └── local-preferences-async-storage.test.ts
│       ├── components/               #   Tests de componentes React Native
│       │   ├── button.test.tsx
│       │   ├── logout-button.test.tsx
│       │   ├── course-card.test.tsx
│       │   ├── login-screen.test.tsx
│       │   ├── home-screen.test.tsx
│       │   └── evaluation-screen.test.tsx
│       └── integration/              #   Tests de integración — DataSource + Context vía MSW
│           ├── auth-datasource.test.ts     #   AuthRemoteDataSourceImpl con MSW/node
│           ├── auth-context.test.tsx       #   AuthProvider + useAuth
│           ├── course-datasource.test.ts   #   CourseRemoteDataSourceImpl con MSW/node
│           ├── course-context.test.tsx     #   CourseProvider + useCourses (student + professor)
│           ├── evaluation-datasource.test.ts  # EvaluationRemoteDataSourceImpl con MSW/node
│           ├── evaluation-context.test.tsx    # EvaluationProvider + useEvaluation
│           ├── student-flow.test.ts        #   Flujo completo estudiante (login → eval)
│           └── professor-flow.test.ts      #   Flujo completo profesor (login → CRUD)
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
# ID del proyecto en la plataforma Roble (Uninorte)
EXPO_PUBLIC_ROBLE_PROJECT_ID=tu_project_id

# URL base de la API (opcional — ya tiene un valor por defecto)
EXPO_PUBLIC_API_BASE_URL=https://roble-api.openlab.uninorte.edu.co
```

> Las variables con prefijo `EXPO_PUBLIC_` son accesibles en el código del cliente.
> Si no defines `EXPO_PUBLIC_API_BASE_URL`, la app apunta a la URL de producción.

---

## Instalación

### Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18+ |
| pnpm | 9+ |
| Expo CLI | incluido vía `pnpm expo` |
| iOS Simulator | Xcode 15+ (solo macOS) |
| Android Emulator | Android Studio + SDK 34+ |

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd unimejores

# 2. Instalar dependencias
pnpm install

# 3. Crear el archivo de variables de entorno
cp .env.example .env     # luego editar con tus valores
```

---

## Ejecutar la aplicación

```bash
# Abrir el menú interactivo de Expo (presiona a/i/w para elegir plataforma)
pnpm start

# iOS (requiere macOS + Xcode)
pnpm ios

# Android (requiere Android Studio + emulador corriendo)
pnpm android

# Web (navegador)
pnpm web
```

> Con `EXPO_PUBLIC_USE_MOCK=true`, la app usa MSW en lugar de la API real. Credenciales de prueba:
>
> | Rol | Correo | Contraseña |
> |---|---|---|
> | Estudiante | `estudiante@uninorte.edu.co` | `password123` |
> | Profesor | `profesor@uninorte.edu.co` | `password123` |

---

## Testing

El proyecto tiene **cuatro capas de pruebas Jest** (sin emulador) más **dos capas E2E** (web y emulador).

### Resumen rápido

| Capa | Comando | Requiere |
|---|---|---|
| Unitarios | `pnpm test:unit` | Nada |
| Integración | `pnpm test:integration` | Nada (MSW intercepta) |
| Componentes | `pnpm test:components` | Nada |
| Todos (Jest) | `pnpm test` | Nada |
| E2E web (Playwright) | `pnpm test:e2e` | App corriendo en web |
| E2E emulador (Maestro) | `maestro test .maestro/` | Emulador + app con mocks |

---

### 1. Unitarios — funciones puras

```bash
pnpm test:unit
```

Cubre: `cn()`, `isSessionExpiredError()`, `parseCsvLine()`, `Container` (DI), `LocalPreferencesAsyncStorage`.

---

### 2. Integración — DataSources + Contexts vía MSW

```bash
pnpm test:integration
```

MSW (`msw/node`) intercepta todas las llamadas HTTP reales. No se necesita servidor externo.

Cubre:
- `AuthRemoteDataSourceImpl` — login, logout, refresh, verify token
- `CourseRemoteDataSourceImpl` — cursos inscritos, categorías, grupos, CRUD
- `EvaluationRemoteDataSourceImpl` — evaluaciones, criterios, submit, CRUD
- `AuthContext` / `CourseContext` / `EvaluationContext` — flujos completos estudiante y profesor
- `student-flow` — flujo encadenado: login → cursos → grupo → evaluación → submit
- `professor-flow` — flujo encadenado: login → crear curso → categoría → grupo → evaluación

---

### 3. Componentes — React Native Testing Library

```bash
pnpm test:components
```

Cubre: `LoginScreen` (validaciones, error banner, submit), `HomeScreen` (vista estudiante y profesor), `EvaluationScreen` (criterios, peer, botón enviar), `CourseCard` (badge pendientes, texto de estado), `Button`, `LogoutButton`.

---

### 4. Todos los tests Jest

```bash
pnpm test              # 181 tests, sin cobertura
pnpm test:coverage     # con reporte de cobertura
pnpm test:watch        # modo interactivo
```

---

### 5. E2E web — Playwright

Requiere que la app esté corriendo en web (`pnpm web`). MSW actúa como Service Worker en el navegador.

```bash
pnpm test:e2e          # headless (Chrome)
pnpm test:e2e:ui       # con interfaz visual de Playwright
```

Cubre: login con credenciales de estudiante, validaciones de formulario, sesión persistente, logout, navegación a cursos y envío de evaluación de pares.

---

### 6. E2E emulador — Maestro

Requiere Maestro CLI instalado y el emulador corriendo. La app debe iniciarse con `EXPO_PUBLIC_USE_MOCK=true` para activar MSW nativo.

#### Instalación de Maestro

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

#### Iniciar la app con mocks

```bash
# Android
EXPO_PUBLIC_USE_MOCK=true pnpm android

# iOS
EXPO_PUBLIC_USE_MOCK=true pnpm ios
```

#### Correr los flows

```bash
# Un flow específico
maestro test .maestro/01-auth-student.yaml

# Todos los flows de estudiante
maestro test .maestro/01-auth-student.yaml \
             .maestro/02-student-course.yaml \
             .maestro/03-student-evaluation.yaml

# Todos los flows de profesor
maestro test .maestro/04-auth-professor.yaml \
             .maestro/05-professor-course-crud.yaml \
             .maestro/06-professor-category-group.yaml \
             .maestro/07-professor-evaluation-crud.yaml

# Todos los flows
maestro test .maestro/
```

#### Ver resultados y grabar

Maestro graba automáticamente cuando un test falla. Para ver el emulador en tiempo real y correr flows paso a paso:

```bash
maestro studio
```

Abre una interfaz en el navegador con preview del emulador, inspector de elementos y grabador de flows.

Los screenshots y videos de cada ejecución quedan en `~/.maestro/tests/`.

#### Flows disponibles

| Flow | Rol | Descripción |
|---|---|---|
| `01-auth-student.yaml` | Estudiante | Login exitoso, logout, errores de validación y credenciales |
| `02-student-course.yaml` | Estudiante | Ver cursos inscritos y categorías |
| `03-student-evaluation.yaml` | Estudiante | Navegar hasta formulario de evaluación de pares |
| `04-auth-professor.yaml` | Profesor | Login y logout como profesor |
| `05-professor-course-crud.yaml` | Profesor | Crear, editar y eliminar un curso |
| `06-professor-category-group.yaml` | Profesor | Agregar categoría y grupo a un curso |
| `07-professor-evaluation-crud.yaml` | Profesor | Crear una evaluación |

---

## Storybook

Catálogo visual de todos los componentes de la librería UI:

```bash
pnpm storybook         # inicia en http://localhost:6006
pnpm storybook:build   # genera build estático
pnpm storybook:test    # ejecuta las play functions (interaction tests)
```

Componentes documentados con stories: `Button`, `Text`, `Input`, `Textarea`, `Card`, `Badge`, `Separator`, `Skeleton`, `Accordion`, `Alert`, `AlertDialog`, `AspectRatio`, `Avatar`, `Checkbox`, `Collapsible`, `Combobox`, `Dialog`, `Drawer`, `Icon`, `Label`, `OTPInput`, `Popover`, `Progress`, `RadioGroup`, `Select`, `Switch`, `Tabs`, `Toast`, `Toggle`, `ToggleGroup`, `Tooltip`, y los componentes de features (`LoginForm`).

Las stories marcadas con 🧪 incluyen **interaction tests** (`play` functions) que verifican comportamiento directamente en el navegador de Storybook.

---

## Mocks de desarrollo

En modo desarrollo/test, la app usa **MSW** (Mock Service Worker) que intercepta todas las llamadas HTTP y responde con datos en memoria definidos en `src/mocks/db.ts`.

### Datos disponibles

| Entidad | Cantidad |
|---|---|
| Usuarios | 10 (1 estudiante logueado + 1 profesor + 8 compañeros) |
| Cursos | 2 (Ingeniería de Software, Redes de Computadores) |
| Categorías | 3 (Proyecto Final, Parcial 1, Taller Redes) |
| Grupos | 3 (Alpha, Beta, Gamma) |
| Criterios | 4 (Participación, Comunicación, Calidad, Puntualidad) |
| Evaluaciones | 2 activas (cat. Proyecto Final y Taller Redes; Parcial 1 sin evaluación) |

### Endpoints mockeados

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/:id/login` | Estudiante o profesor — tokens separados por rol |
| `POST` | `/auth/:id/signup` | Registro de usuario |
| `POST` | `/auth/:id/logout` | Cierre de sesión |
| `POST` | `/auth/:id/refresh-token` | Renueva el access token según el refresh token del rol |
| `GET`  | `/auth/:id/verify-token` | Valida que el token siga activo |
| `GET` | `/database/:id/read` | Lectura de cualquier tabla con filtros |
| `POST` | `/database/:id/insert` | Inserción de registros |
| `PUT` | `/database/:id/update` | Actualización por ID |
| `DELETE` | `/database/:id/delete` | Eliminación por ID |

> Los datos de `resultEvaluation` y `result_criterium` comienzan vacíos y se llenan al enviar evaluaciones durante la sesión.
