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
| Mocking HTTP en desarrollo | MSW 2 (Mock Service Worker) |
| Testing E2E | Playwright 1.60 |
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
├── e2e/                              # Tests End-to-End (Playwright)
│   ├── login.spec.ts                 #   Flujo de autenticación
│   └── evaluation.spec.ts            #   Flujo de evaluación de pares
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
│   └── __tests__/                    # Suite de tests
│       ├── setup/
│       │   ├── env.ts                #   Variables de entorno para Jest
│       │   └── msw.ts                #   (reservado)
│       ├── unit/                     #   Tests unitarios (funciones puras)
│       │   ├── utils.test.ts
│       │   ├── container.test.ts
│       │   └── local-preferences-async-storage.test.ts
│       ├── components/               #   Tests de componentes React Native
│       │   ├── button.test.tsx
│       │   ├── login-form.test.tsx
│       │   ├── logout-button.test.tsx
│       │   └── course-card.test.tsx
│       └── integration/              #   Tests de integración (contextos + fetch mock)
│           ├── auth-datasource.test.ts
│           ├── auth-context.test.tsx
│           ├── course-context.test.tsx
│           └── evaluation-context.test.tsx
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

> En desarrollo, la app carga automáticamente los mocks de MSW para no depender de la API real. Credenciales de prueba:
>
> | Campo | Valor |
> |---|---|
> | Correo | `estudiante@uninorte.edu.co` |
> | Contraseña | `password123` |

---

## Testing

El proyecto tiene cuatro capas de pruebas:

### Unitarias — funciones puras

```bash
pnpm test:unit
```

Cubre: `cn()`, `isSessionExpiredError()`, `parseCsvLine()`, `Container` (DI), `LocalPreferencesAsyncStorage`.

### Componentes — React Native Testing Library

```bash
pnpm test:components
```

Cubre: `Button`, `LoginForm`, `LogoutButton`, `CourseCard` — render, interacciones, validaciones.

### Integración — contextos + fetch mock

```bash
pnpm test:integration
```

Cubre: `AuthContext`, `CourseContext`, `EvaluationContext`, `AuthRemoteDataSourceImpl` — todos los flujos (login, logout, sesión expirada, carga de cursos, submit de evaluación…).

### Todos los tests

```bash
pnpm test              # todos sin cobertura
pnpm test:coverage     # con reporte de cobertura
pnpm test:watch        # modo interactivo
```

### End-to-End — Playwright

Requiere que la app esté corriendo en web (`pnpm web`):

```bash
pnpm test:e2e          # headless
pnpm test:e2e:ui       # con interfaz visual de Playwright
```

Cubre: flujo completo de login, validaciones de formulario, sesión persistente, logout, navegación a cursos y envío de evaluación de pares.

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
| Usuarios | 9 (1 logueado + 8 compañeros) |
| Cursos | 2 (Ingeniería de Software, Redes) |
| Categorías | 3 (Proyecto Final, Parcial 1, Taller Redes) |
| Grupos | 3 (Alpha, Beta, Gamma) |
| Criterios | 4 (Participación, Comunicación, Calidad, Puntualidad) |
| Evaluaciones | 2 activas |

### Endpoints mockeados

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/:id/login` | Valida `estudiante@uninorte.edu.co` / `password123` |
| `POST` | `/auth/:id/signup` | Registro de usuario |
| `POST` | `/auth/:id/logout` | Cierre de sesión |
| `GET` | `/database/:id/read` | Lectura de cualquier tabla con filtros |
| `POST` | `/database/:id/insert` | Inserción de registros |
| `PUT` | `/database/:id/update` | Actualización por ID |
| `DELETE` | `/database/:id/delete` | Eliminación por ID |

> Los datos de `resultEvaluation` y `result_criterium` comienzan vacíos y se llenan al enviar evaluaciones durante la sesión.
