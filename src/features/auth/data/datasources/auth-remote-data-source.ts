export interface AuthRemoteDataSource {
  login(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, name: string): Promise<void>;
  logOut(): Promise<void>;
  refreshToken(): Promise<boolean>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(
    email: string,
    newPassword: string,
    validationCode: string,
  ): Promise<boolean>;
}