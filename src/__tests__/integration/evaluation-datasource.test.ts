/**
 * Integration tests for EvaluationRemoteDataSourceImpl.
 *
 * Network calls are intercepted via MSW (msw/node) — the global server is
 * started in src/__tests__/setup/msw-server.ts and runs lifecycle hooks
 * (beforeAll/afterEach/afterAll) automatically.
 */

import { MOCK_USER_ID } from '@/mocks/db';

// ─── mock AsyncStorage & LocalPreferences ────────────────────────────────────

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

// ─── tests ───────────────────────────────────────────────────────────────────

describe('EvaluationRemoteDataSourceImpl.getEvaluationByGroup', () => {
  it('returns an evaluation for group-alpha (category has an evaluation)', async () => {
    const ds = buildEvalDS();
    const result = await ds.getEvaluationByGroup('group-alpha');
    expect(result).not.toBeNull();
    expect(result?.title).toMatch(/Proyecto Final/i);
  });

  it('returns null for group-beta (category has no evaluation)', async () => {
    const ds = buildEvalDS();
    const result = await ds.getEvaluationByGroup('group-beta');
    expect(result).toBeNull();
  });
});

describe('EvaluationRemoteDataSourceImpl.getCriteriaByEvaluation', () => {
  it('returns 4 criteria for eval-proyecto-final, each with name and max_score', async () => {
    const ds = buildEvalDS();
    const result = await ds.getCriteriaByEvaluation('eval-proyecto-final');
    expect(result).toHaveLength(4);
    result.forEach((c: any) => {
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('max_score');
    });
  });
});

describe('EvaluationRemoteDataSourceImpl.getMyCriteria', () => {
  it('returns at least 4 criteria created by MOCK_USER_ID', async () => {
    const ds = buildEvalDS();
    const result = await ds.getMyCriteria(MOCK_USER_ID);
    expect(result.length).toBeGreaterThanOrEqual(4);
  });
});

describe('EvaluationRemoteDataSourceImpl.submitEvaluation', () => {
  it('resolves without throwing when submitting scores for group-alpha', async () => {
    const ds = buildEvalDS();
    await expect(
      ds.submitEvaluation('group-alpha', MOCK_USER_ID, 'some-peer-id', {
        'crit-participacion': 4,
        'crit-comunicacion': 3,
        'crit-calidad': 5,
        'crit-puntualidad': 4,
      })
    ).resolves.toBeUndefined();
  });
});

describe('EvaluationRemoteDataSourceImpl.createEvaluation', () => {
  it('returns an object with _id and the correct title', async () => {
    const ds = buildEvalDS();
    const result = await ds.createEvaluation({
      title: 'Nueva Evaluación',
      description: 'Evaluación de prueba',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      category_id: 'cat-parcial-1',
    });
    expect(result).toHaveProperty('_id');
    expect(result.title).toBe('Nueva Evaluación');
  });
});
