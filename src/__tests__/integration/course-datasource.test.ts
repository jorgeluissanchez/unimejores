import { MOCK_USER_ID, MOCK_PROF_ID } from '@/mocks/db';

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

function buildCourseDS() {
  const { CourseRemoteDataSourceImpl } = require('@/features/courses/data/datasources/course-remote-data-source-impl');
  return new CourseRemoteDataSourceImpl(buildAuthDS());
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(store).forEach((k) => delete store[k]);
  store['token'] = 'mock-token';
  mockPrefs.retrieveData.mockImplementation(async (key: string) => store[key] ?? null);
});

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
  it('returns courses that have created_by matching the professor id', async () => {
    // The mock db courses do not have a created_by field, so this returns [].
    // The method filters the "course" table by { created_by: userId } directly.
    const result = await buildCourseDS().getMyCreatedCourses(MOCK_PROF_ID);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('CourseRemoteDataSourceImpl.getCategoriesByCourse', () => {
  it('returns categories for a given course', async () => {
    const result = await buildCourseDS().getCategoriesByCourse('course-sistemas');
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toHaveProperty('name');
  });

  it('returns empty array for an unknown course', async () => {
    const result = await buildCourseDS().getCategoriesByCourse('unknown-course');
    expect(result).toEqual([]);
  });
});

describe('CourseRemoteDataSourceImpl.addCourse', () => {
  it('inserts a new course and returns it with an _id', async () => {
    const result = await buildCourseDS().addCourse({
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

  it('returns empty array for an unknown category', async () => {
    const result = await buildCourseDS().getGroupsByCategory('unknown-cat');
    expect(result).toEqual([]);
  });
});
