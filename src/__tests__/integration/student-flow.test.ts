/**
 * Student flow integration test.
 * Tests the full data path: AuthDS → CourseDS → EvalDS, all via MSW.
 */
import { MOCK_EMAIL, MOCK_PASSWORD, MOCK_USER_ID } from '@/mocks/db';

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

describe('Student flow: authentication', () => {
  it('logs in and stores userId = MOCK_USER_ID', async () => {
    await buildAuthDS().login(MOCK_EMAIL, MOCK_PASSWORD);
    expect(store['userId']).toBe(MOCK_USER_ID);
    expect(store['token']).toBeTruthy();
  });

  it('fails login with wrong credentials', async () => {
    await expect(
      buildAuthDS().login('wrong@test.com', 'wrongpassword')
    ).rejects.toThrow(/Error al iniciar sesión/);
  });
});

describe('Student flow: enrolled courses', () => {
  beforeEach(async () => {
    // Login first to get token in storage
    await buildAuthDS().login(MOCK_EMAIL, MOCK_PASSWORD);
  });

  it('loads enrolled courses (at least 2)', async () => {
    const courses = await buildCourseDS(buildAuthDS()).getMyEnrolledCourses(MOCK_USER_ID);
    expect(courses.length).toBeGreaterThanOrEqual(2);
    expect(courses[0]).toHaveProperty('name');
    expect(courses[0]).toHaveProperty('nrc');
  });

  it('loads categories for Ingeniería de Software course', async () => {
    const categories = await buildCourseDS(buildAuthDS()).getCategoriesByCourse('course-sistemas');
    expect(categories.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Student flow: evaluation', () => {
  beforeEach(async () => {
    await buildAuthDS().login(MOCK_EMAIL, MOCK_PASSWORD);
  });

  it('finds student group in a category', async () => {
    const group = await buildCourseDS(buildAuthDS()).getGroupByCategory('cat-proyecto-final', MOCK_USER_ID);
    expect(group).not.toBeNull();
    expect(group?._id).toBe('group-alpha');
  });

  it('loads evaluation for the student group', async () => {
    const evaluation = await buildEvalDS(buildAuthDS()).getEvaluationByGroup('group-alpha');
    expect(evaluation).not.toBeNull();
    expect(evaluation?.title).toMatch(/Proyecto Final/i);
  });

  it('loads criteria for the evaluation', async () => {
    const evaluation = await buildEvalDS(buildAuthDS()).getEvaluationByGroup('group-alpha');
    const criteria = await buildEvalDS(buildAuthDS()).getCriteriaByEvaluation(evaluation!._id);
    expect(criteria.length).toBe(4);
  });

  it('submits scores for a peer without throwing', async () => {
    await expect(
      buildEvalDS(buildAuthDS()).submitEvaluation(
        'group-alpha',
        MOCK_USER_ID,
        'some-peer-id',
        { 'crit-participacion': 4, 'crit-comunicacion': 5, 'crit-calidad': 3, 'crit-puntualidad': 4 }
      )
    ).resolves.not.toThrow();
  });
});
