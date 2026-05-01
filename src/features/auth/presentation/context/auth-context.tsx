import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-Provider";
import { AuthUser } from "@/features/auth/domain/entities/auth-user";
import { AuthRepository } from "@/features/auth/domain/repositories/auth-repository";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AuthContextType = {
  loggedUser: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  validate: (email: string, validationCode: string) => Promise<string | null>;
  getLoggedUser: () => Promise<any | null>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();

  const authRepo = useMemo(() => di.resolve<AuthRepository>(TOKENS.AuthRepo), [di]);

  const [loggedUser, setLoggedUser] = useState<AuthUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    authRepo.getCurrentUser()
      .then((user) => {
        setLoggedUser(user);
        setIsLoggedIn(!!user);
      })
      .catch(() => setIsLoggedIn(false))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    clearError();
    try {
      setLoading(true);
      await authRepo.login(email, password);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError(err?.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    clearError();
    try {
      setLoading(true);
      await authRepo.signup(email, password);
      return true;
    } catch (err: any) {
      setError(err?.message ?? "Error al registrar la cuenta");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    clearError();
    try {
      setLoading(true);
      await authRepo.logout();
      setIsLoggedIn(false);
    } catch (err: any) {
      setError(err?.message ?? "Error al cerrar sesión");
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    clearError();
    try {
      setLoading(true);
      await authRepo.forgotPassword(email);
    } catch (err: any) {
      setError(err?.message ?? "No se pudo enviar el enlace de restablecimiento");
    } finally {
      setLoading(false);
    }
  };

  const validate = async (email: string, validationCode: string) => {
    clearError();
    try {
      await authRepo.validate(email, validationCode);
    } catch (err: any) {
      return err?.message ?? "Error de validación";
    }
    return null;
  }

  const getLoggedUser = async () => {
    try {
      return await authRepo.getCurrentUser();
    } catch (err) {
      return null;
    }
  }

  return (
    <AuthContext.Provider value={{ loggedUser, isLoggedIn, loading, error, clearError, login, signup, logout, forgotPassword, validate, getLoggedUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}