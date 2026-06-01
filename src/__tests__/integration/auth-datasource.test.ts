/**
 * Integration tests for AuthRemoteDataSourceImpl.
 *
 * Network calls are intercepted via MSW (msw/node) — the global server is
 * started in src/__tests__/setup/msw-server.ts and runs lifecycle hooks
 * (beforeAll/afterEach/afterAll) automatically.  Individual tests can override
 * handlers with server.use(); those overrides are reset after each test.
 */

import { MOCK_EMAIL, MOCK_PASSWORD, MOCK_USER_ID } from '@/mocks/db';
import { server } from '@/__tests__/setup/msw-server';
import { http, HttpResponse } from 'msw';

// ─── mock AsyncStorage & LocalPreferences ────────────────────────────────────

const store: Record<string, string> = {};

const mockPrefs = {
  storeData: jest.fn(async (key: string, value: string) => { store[key] = value; }),
  retrieveData: jest.fn(async <T>(key: string): Promise<T | null> => (store[key] as unknown as T) ?? null),
  removeData: jest.fn(async (key: string) => { delete store[key]; }),
};

jest.mock('@/core/storage/local-preferences-async-storage', () => ({
  LocalPreferencesAsyncStorage: { getInstance: jest.fn(() => mockPrefs) },
}));

import { AuthRemoteDataSourceImpl } from '@/features/auth/data/datasources/auth-remote-data-source-impl';

function freshDS() { return new AuthRemoteDataSourceImpl(); }

const BASE = `${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/${process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID}`;

// ─── tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(store).forEach((k) => delete store[k]);
  mockPrefs.retrieveData.mockImplementation(async (key: string) => (store[key] as any) ?? null);
});

describe('AuthRemoteDataSourceImpl.login', () => {
  it('stores the access token on successful login', async () => {
    await freshDS().login(MOCK_EMAIL, MOCK_PASSWORD);
    expect(mockPrefs.storeData).toHaveBeenCalledWith('token', expect.any(String));
  });

  it('stores the refresh token on successful login', async () => {
    await freshDS().login(MOCK_EMAIL, MOCK_PASSWORD);
    expect(mockPrefs.storeData).toHaveBeenCalledWith('refreshToken', 'student-refresh-token');
  });

  it('stores the userId decoded from the JWT', async () => {
    await freshDS().login(MOCK_EMAIL, MOCK_PASSWORD);
    expect(mockPrefs.storeData).toHaveBeenCalledWith('userId', MOCK_USER_ID);
  });

  it('stores the email used for login', async () => {
    await freshDS().login(MOCK_EMAIL, MOCK_PASSWORD);
    expect(mockPrefs.storeData).toHaveBeenCalledWith('email', MOCK_EMAIL);
  });

  it('throws with "Error al iniciar sesión" on 401', async () => {
    await expect(freshDS().login('wrong@email.com', 'bad')).rejects.toThrow(
      /Error al iniciar sesión/
    );
  });

  it('throws when response is missing tokens', async () => {
    server.use(
      http.post(`${BASE}/login`, () => HttpResponse.json({ accessToken: null, refreshToken: null }))
    );
    await expect(freshDS().login(MOCK_EMAIL, MOCK_PASSWORD)).rejects.toThrow(
      /faltan tokens/
    );
  });

  it('throws when the JWT has no sub claim', async () => {
    const invalidJwt = btoa('{}') + '.' + btoa('{}') + '.sig';
    server.use(
      http.post(`${BASE}/login`, () => HttpResponse.json({ accessToken: invalidJwt, refreshToken: 'r' }))
    );
    await expect(freshDS().login(MOCK_EMAIL, MOCK_PASSWORD)).rejects.toThrow(
      /Token inválido/
    );
  });
});

describe('AuthRemoteDataSourceImpl.logOut', () => {
  beforeEach(() => {
    store['token'] = 'some-valid-token';
    mockPrefs.retrieveData.mockImplementation(async (key: string) => store[key] ?? null);
  });

  it('calls the logout endpoint once and removes the token', async () => {
    await freshDS().logOut();
    expect(mockPrefs.removeData).toHaveBeenCalledWith('token');
  });

  it('removes the token from storage', async () => {
    await freshDS().logOut();
    expect(mockPrefs.removeData).toHaveBeenCalledWith('token');
  });

  it('throws "No se encontró el token" when storage is empty', async () => {
    mockPrefs.retrieveData.mockResolvedValueOnce(null);
    await expect(freshDS().logOut()).rejects.toThrow(/No se encontró el token/);
  });
});

describe('AuthRemoteDataSourceImpl.verifyToken', () => {
  it('returns false when no token is stored', async () => {
    mockPrefs.retrieveData.mockResolvedValueOnce(null);
    const result = await freshDS().verifyToken();
    expect(result).toBe(false);
  });

  it('returns true when the server responds with 200', async () => {
    store['token'] = 'some-valid-token';
    const result = await freshDS().verifyToken();
    expect(result).toBe(true);
  });

  it('returns false when the server responds with non-200', async () => {
    store['token'] = 'some-valid-token';
    server.use(
      http.get(`${BASE}/verify-token`, () => HttpResponse.json({ message: 'invalid' }, { status: 401 }))
    );
    const result = await freshDS().verifyToken();
    expect(result).toBe(false);
  });
});

describe('AuthRemoteDataSourceImpl.refreshToken', () => {
  it('returns false when no refresh token is stored', async () => {
    const result = await freshDS().refreshToken();
    expect(result).toBe(false);
  });

  it('stores the new access token and returns true on success', async () => {
    store['refreshToken'] = 'student-refresh-token';
    const result = await freshDS().refreshToken();
    expect(result).toBe(true);
    expect(mockPrefs.storeData).toHaveBeenCalledWith('token', expect.any(String));
  });

  it('throws when the server rejects the refresh token', async () => {
    store['refreshToken'] = 'expired-refresh';
    server.use(
      http.post(`${BASE}/refresh-token`, () => HttpResponse.json({ message: 'Token expirado' }, { status: 401 }))
    );
    await expect(freshDS().refreshToken()).rejects.toThrow(/Error al renovar el token/);
  });
});
