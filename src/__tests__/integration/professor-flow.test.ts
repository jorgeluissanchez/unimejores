/**
 * Professor flow integration test.
 * Tests the full data path: login → course CRUD → evaluation CRUD via MSW.
 */
import { MOCK_PROF_EMAIL, MOCK_PROF_PASSWORD, MOCK_PROF_ID } from '@/mocks/db';

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

// ─── setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(store).forEach((k) => delete store[k]);
  mockPrefs.retrieveData.mockImplementation(async (key: string) => store[key] ?? null);
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('Professor flow: authentication', () => {
  it('logs in and stores userId = MOCK_PROF_ID', async () => {
    await buildAuthDS().login(MOCK_PROF_EMAIL, MOCK_PROF_PASSWORD);
    expect(store['userId']).toBe(MOCK_PROF_ID);
    expect(store['token']).toBeTruthy();
  });
});

describe('Professor flow: course CRUD', () => {
  beforeEach(async () => {
    await buildAuthDS().login(MOCK_PROF_EMAIL, MOCK_PROF_PASSWORD);
  });

  it('creates a course and returns it with _id', async () => {
    const created = await buildCourseDS(buildAuthDS()).addCourse({
      name: 'Nuevo Curso Prof',
      nrc: '88888',
      description: 'Test',
      created_by: MOCK_PROF_ID,
    });
    expect(created._id).toBeTruthy();
    expect(created.name).toBe('Nuevo Curso Prof');
  });

  it('updates a course without throwing', async () => {
    const created = await buildCourseDS(buildAuthDS()).addCourse({
      name: 'Curso para Editar',
      nrc: '77777',
      description: '',
      created_by: MOCK_PROF_ID,
    });
    await expect(
      buildCourseDS(buildAuthDS()).updateCourse({ ...created, name: 'Curso Editado' })
    ).resolves.not.toThrow();
  });

  it('deletes a course without throwing', async () => {
    const created = await buildCourseDS(buildAuthDS()).addCourse({
      name: 'Curso para Eliminar',
      nrc: '66666',
      description: '',
      created_by: MOCK_PROF_ID,
    });
    await expect(
      buildCourseDS(buildAuthDS()).deleteCourse(created._id)
    ).resolves.not.toThrow();
  });
});

describe('Professor flow: category and group management', () => {
  beforeEach(async () => {
    await buildAuthDS().login(MOCK_PROF_EMAIL, MOCK_PROF_PASSWORD);
  });

  it('adds a category to a course and returns it', async () => {
    const cat = await buildCourseDS(buildAuthDS()).addCategory({
      name: 'Cat Prof Test',
      description: 'Desc',
      course_id: 'course-sistemas',
    });
    expect(cat._id).toBeTruthy();
    expect(cat.name).toBe('Cat Prof Test');
  });

  it('adds a group to a category and returns it', async () => {
    const group = await buildCourseDS(buildAuthDS()).addGroup({
      name: 'Grupo Prof Test',
      category_id: 'cat-proyecto-final',
    });
    expect(group._id).toBeTruthy();
    expect(group.name).toBe('Grupo Prof Test');
  });
});

describe('Professor flow: evaluation CRUD', () => {
  beforeEach(async () => {
    await buildAuthDS().login(MOCK_PROF_EMAIL, MOCK_PROF_PASSWORD);
  });

  it('creates an evaluation and returns it', async () => {
    // NewEvaluation = Omit<Evaluation, '_id'> — no created_by field
    const evalResult = await buildEvalDS(buildAuthDS()).createEvaluation({
      title: 'Evaluación Prof Test',
      description: 'Test',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      category_id: 'cat-parcial-1',
    });
    expect(evalResult._id).toBeTruthy();
    expect(evalResult.title).toBe('Evaluación Prof Test');
  });

  it('adds a criterium without throwing', async () => {
    // NewCriterium = Omit<Criterium, '_id'> — has name, description, created_by (no max_score)
    await expect(
      buildEvalDS(buildAuthDS()).addCriterium({
        name: 'Criterio Prof Test',
        description: 'Desc',
        created_by: MOCK_PROF_ID,
      })
    ).resolves.not.toThrow();
  });
});
