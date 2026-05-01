import { AuthUser } from "@/features/auth/domain/entities/auth-user";

export interface IAuthDataSource {
  login(email: string, password: string): Promise<AuthUser>;
  signup(email: string, password: string): Promise<AuthUser>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  forgotPassword(email: string): Promise<void>;
  validate(email: string, validationCode: string): Promise<string | null>;
}