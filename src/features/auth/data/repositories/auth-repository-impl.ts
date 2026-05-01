import { AuthRemoteDataSource } from "@/features/auth/data/datasources/auth-remote-data-source";
import { AuthUser } from "@/features/auth/domain/entities/auth-user";
import { AuthRepository } from "@/features/auth/domain/repositories/auth-repository";

export class AuthRepositoryImpl implements AuthRepository {
  private dataSource: AuthRemoteDataSource;

  constructor(dataSource: AuthRemoteDataSource) {
    this.dataSource = dataSource;
  }

  async login(email: string, password: string): Promise<void> {
    return this.dataSource.login(email, password);
  }

  async signup(email: string, password: string): Promise<void> {
    return this.dataSource.signUp(email, password);
  }

  async logout(): Promise<void> {
    return this.dataSource.logOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // return this.dataSource.getCurrentUser();
    return null;
  }

  async forgotPassword(email: string): Promise<void> {
    return this.dataSource.forgotPassword(email);
  }

  async validate(email: string, validationCode: string): Promise<void> {
    return this.dataSource.validate(email, validationCode);
  }
}