/**
 * Integration tests for AuthRemoteDataSourceImpl.
 *
 * Network calls are intercepted via jest.fn() on global.fetch so we avoid
 * any ESM-resolver issues with MSW in the CJS Jest environment.
 * MSW continues to work in the actual app (browser + native).
 */

import { MOCK_EMAIL, MOCK_PASSWORD, MOCK_USER_ID } from '@/mocks/db';

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

// ─── fetch mock helpers ───────────────────────────────────────────────────────

function ok(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => body,
  } as Response);
}

function fail(status: number, body: unknown) {
  return Promise.resolve({
    ok: false,
    status,
    json: async () => body,
  } as Response);
}

function makeJwt(sub: string) {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub, email: MOCK_EMAIL, exp: Date.now() + 3600_000 }));
  return `${header}.${payload}.mock-sig`;
}

const ACCESS_TOKEN = makeJwt(MOCK_USER_ID);

function freshDS() { return new AuthRemoteDataSourceImpl(); }

// ─── tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(store).forEach((k) => delete store[k]);
  global.fetch = jest.fn();
});

afterEach(() => {
  (global.fetch as jest.Mock).mockRestore?.();
});

describe('AuthRemoteDataSourceImpl.login', () => {
  function mockLoginSuccess() {
    (global.fetch as jest.Mock)
      // POST /login
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ accessToken: ACCESS_TOKEN, refreshToken: 'refresh-token' }) } as Response)
      // GET /database/read?tableName=user (fetch user role/name)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [{ role: 'student', name: 'Test User' }] } as Response);
  }

  it('stores the access token on successful login', async () => {
    mockLoginSuccess();
    await freshDS().login(MOCK_EMAIL, MOCK_PASSWORD);
    expect(mockPrefs.storeData).toHaveBeenCalledWith('token', ACCESS_TOKEN);
  });

  it('stores the refresh token on successful login', async () => {
    mockLoginSuccess();
    await freshDS().login(MOCK_EMAIL, MOCK_PASSWORD);
    expect(mockPrefs.storeData).toHaveBeenCalledWith('refreshToken', 'refresh-token');
  });

  it('stores the userId decoded from the JWT', async () => {
    mockLoginSuccess();
    await freshDS().login(MOCK_EMAIL, MOCK_PASSWORD);
    expect(mockPrefs.storeData).toHaveBeenCalledWith('userId', MOCK_USER_ID);
  });

  it('stores the email used for login', async () => {
    mockLoginSuccess();
    await freshDS().login(MOCK_EMAIL, MOCK_PASSWORD);
    expect(mockPrefs.storeData).toHaveBeenCalledWith('email', MOCK_EMAIL);
  });

  it('throws with "Error al iniciar sesión" on 401', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      fail(401, { message: 'Credenciales inválidas' })
    );
    await expect(freshDS().login('wrong@email.com', 'bad')).rejects.toThrow(
      /Error al iniciar sesión/
    );
  });

  it('throws when response is missing tokens', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      ok({ accessToken: null, refreshToken: null })
    );
    await expect(freshDS().login(MOCK_EMAIL, MOCK_PASSWORD)).rejects.toThrow(
      /faltan tokens/
    );
  });

  it('throws when the JWT has no sub claim', async () => {
    const invalidJwt = btoa('{}') + '.' + btoa('{}') + '.sig';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      ok({ accessToken: invalidJwt, refreshToken: 'r' })
    );
    await expect(freshDS().login(MOCK_EMAIL, MOCK_PASSWORD)).rejects.toThrow(
      /Token inválido/
    );
  });
});

describe('AuthRemoteDataSourceImpl.logOut', () => {
  beforeEach(() => {
    store['token'] = ACCESS_TOKEN;
    mockPrefs.retrieveData.mockImplementation(async (key: string) => store[key] ?? null);
  });

  it('calls the logout endpoint once', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    await freshDS().logOut();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/logout');
  });

  it('removes the token from storage', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200 } as Response);
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
    mockPrefs.retrieveData.mockResolvedValueOnce(ACCESS_TOKEN);
    (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 200 } as Response);
    const result = await freshDS().verifyToken();
    expect(result).toBe(true);
  });

  it('returns false when the server responds with non-200', async () => {
    mockPrefs.retrieveData.mockResolvedValueOnce(ACCESS_TOKEN);
    (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 401, json: async () => ({ message: 'invalid' }) } as Response);
    const result = await freshDS().verifyToken();
    expect(result).toBe(false);
  });
});

describe('AuthRemoteDataSourceImpl.refreshToken', () => {
  it('returns false when no refresh token is stored', async () => {
    mockPrefs.retrieveData.mockResolvedValueOnce(null);
    const result = await freshDS().refreshToken();
    expect(result).toBe(false);
  });

  it('stores the new access token and returns true on success', async () => {
    mockPrefs.retrieveData.mockResolvedValueOnce('old-refresh-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce(ok({ accessToken: ACCESS_TOKEN }));
    const result = await freshDS().refreshToken();
    expect(result).toBe(true);
    expect(mockPrefs.storeData).toHaveBeenCalledWith('token', ACCESS_TOKEN);
  });

  it('throws when the server rejects the refresh token', async () => {
    mockPrefs.retrieveData.mockResolvedValueOnce('expired-refresh');
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      fail(401, { message: 'Token expirado' })
    );
    await expect(freshDS().refreshToken()).rejects.toThrow(/Error al renovar el token/);
  });
});
