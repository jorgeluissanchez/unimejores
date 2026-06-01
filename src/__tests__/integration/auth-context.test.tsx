/**
 * Integration tests for AuthProvider + useAuth.
 * The AuthRepository is injected via a mock DIProvider so we control every
 * repository response without involving the network layer.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/features/auth/presentation/context/auth-context';
import { AuthUser } from '@/features/auth/domain/entities/auth-user';

// ─── mock DI ─────────────────────────────────────────────────────────────────

const mockAuthRepo = {
  login: jest.fn(),
  signup: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  refreshUserProfile: jest.fn(),
  forgotPassword: jest.fn(),
};

jest.mock('@/core/di/di-provider', () => ({
  useDI: jest.fn(() => ({
    resolve: jest.fn(() => mockAuthRepo),
  })),
}));

// ─── mock LocalPreferences ───────────────────────────────────────────────────

const mockRemoveData = jest.fn();

jest.mock('@/core/storage/local-preferences-async-storage', () => ({
  LocalPreferencesAsyncStorage: {
    getInstance: jest.fn(() => ({
      removeData: mockRemoveData,
      storeData: jest.fn(),
      retrieveData: jest.fn(),
    })),
  },
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

const mockUser: AuthUser = {
  userId: 'user-1',
  email: 'test@test.com',
  role: 'student',
  name: 'Test User',
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('AuthProvider — initial state', () => {
  it('starts with loading = true and no user', async () => {
    mockAuthRepo.getCurrentUser.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // loading is true synchronously on mount
    expect(result.current.loading).toBe(true);
    expect(result.current.loggedUser).toBeNull();
  });

  it('resolves to isLoggedIn = false when no session exists', async () => {
    mockAuthRepo.getCurrentUser.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('sets the user when an existing session is found', async () => {
    mockAuthRepo.getCurrentUser.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

    expect(result.current.loggedUser).toEqual(mockUser);
    expect(result.current.isLoggedIn).toBe(true);
  });
});

describe('AuthProvider — login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthRepo.getCurrentUser.mockResolvedValue(null); // default: no session
  });

  it('sets the user after a successful login', async () => {
    mockAuthRepo.login.mockResolvedValueOnce(undefined);
    mockAuthRepo.getCurrentUser
      .mockResolvedValueOnce(null)   // initial mount
      .mockResolvedValueOnce(mockUser); // after login

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.login('test@test.com', 'password');
    });

    expect(result.current.loggedUser).toEqual(mockUser);
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('sets an error message on failed login', async () => {
    mockAuthRepo.login.mockRejectedValueOnce(new Error('Credenciales inválidas'));
    mockAuthRepo.getCurrentUser.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.login('bad@test.com', 'wrong');
    });

    expect(result.current.error).toBe('Credenciales inválidas');
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('always sets loading = false after login, even on error', async () => {
    mockAuthRepo.login.mockRejectedValueOnce(new Error('fail'));
    mockAuthRepo.getCurrentUser.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.login('x@x.com', 'xxx');
    });

    expect(result.current.loading).toBe(false);
  });
});

describe('AuthProvider — logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears the user and session after logout', async () => {
    mockAuthRepo.getCurrentUser.mockResolvedValueOnce(mockUser);
    mockAuthRepo.logout.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    expect(result.current.isLoggedIn).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.loggedUser).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('clears storage keys on logout', async () => {
    mockAuthRepo.getCurrentUser.mockResolvedValueOnce(mockUser);
    mockAuthRepo.logout.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.logout();
    });

    expect(mockRemoveData).toHaveBeenCalledWith('token');
    expect(mockRemoveData).toHaveBeenCalledWith('refreshToken');
  });
});

describe('AuthProvider — clearError', () => {
  it('resets error to null', async () => {
    mockAuthRepo.login.mockRejectedValueOnce(new Error('oops'));
    mockAuthRepo.getCurrentUser.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.login('x@x.com', 'x');
    });

    expect(result.current.error).not.toBeNull();

    act(() => { result.current.clearError(); });

    expect(result.current.error).toBeNull();
  });
});

describe('AuthProvider — expireSession', () => {
  it('clears user and marks session as expired', async () => {
    mockAuthRepo.getCurrentUser.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.expireSession();
    });

    expect(result.current.loggedUser).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.loading).toBe(false);
  });
});

describe('useAuth guard', () => {
  it('throws when used outside AuthProvider', () => {
    // Suppress React's error boundary output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth debe usarse dentro de AuthProvider'
    );
    consoleSpy.mockRestore();
  });
});
