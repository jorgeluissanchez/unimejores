import { ILocalPreferences } from "@/core/storage/i-local-preferences";
import { LocalPreferencesAsyncStorage } from "@/core/storage/local-preferences-async-storage";
import { AuthRemoteDataSource } from "./auth-remote-data-source";

export class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  private readonly projectId: string;
  private readonly baseUrl: string;

  private prefs: ILocalPreferences;

  constructor(projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID) {
    if (!projectId) {
      throw new Error("Falta la variable de entorno EXPO_PUBLIC_ROBLE_PROJECT_ID");
    }
    this.projectId = projectId;
    this.baseUrl = `https://roble-api.openlab.uninorte.edu.co/auth/${this.projectId}`;
    this.prefs = LocalPreferencesAsyncStorage.getInstance();
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data["accessToken"];
        const refreshToken = data["refreshToken"];
        await this.prefs.storeData("token", token);
        await this.prefs.storeData("refreshToken", refreshToken);
        return Promise.resolve();
      } else {
        const body = await response.json();
        throw new Error(`Error al iniciar sesión: ${body.message}`);
      }
    } catch (e: any) {
      throw e;
    }
  }

  async signUp(email: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({
          email: email,
          name: email.split("@")[0],
          password: password,
        }),
      });

      if (response.ok) {
        return Promise.resolve();
      } else {
        const body = await response.json();
        const message = Array.isArray(body.message)
          ? body.message.join(" ")
          : body.message ?? "Error de registro desconocido";
        throw new Error(`Error al registrar la cuenta: ${message}`);
      }
    } catch (e: any) {
      console.error("Falló el registro", e);
      throw e;
    }
  }

  async logOut(): Promise<void> {
    try {
      const token = await this.prefs.retrieveData<string>("token");
      if (!token) throw new Error("No se encontró el token");

      const response = await fetch(`${this.baseUrl}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await this.prefs.removeData("token");
        await this.prefs.removeData("refreshToken");
        console.log("Sesión cerrada correctamente");
        return Promise.resolve();
      } else {
        const body = await response.json();
        throw new Error(`Error al cerrar sesión: ${body.message}`);
      }
    } catch (e: any) {
      throw e;
    }
  }

  async validate(email: string, validationCode: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({ email, code: validationCode }),
      });

      if (response.ok) {
        return Promise.resolve();
      } else {
        const body = await response.json();
        throw new Error(`Error de validación: ${body.message ?? "Error de validación desconocido"}`);
      }
    } catch (e: any) {
      console.error("Falló la validación", e);
      throw e;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await this.prefs.retrieveData<string>("refreshToken");
      if (!refreshToken) {
        console.warn("Falló la renovación del token", "No se encontró el refresh token");
        return false;
      }
      const response = await fetch(`${this.baseUrl}/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data["accessToken"];
        await this.prefs.storeData("token", newToken);
        console.log("Token renovado correctamente");
        return true;
      } else {
        const body = await response.json();
        throw new Error(`Error al renovar el token: ${body.message}`);
      }
    } catch (e: any) {
      console.error("Falló la renovación del token", e);
      throw e;
    }
  }

  forgotPassword(email: string): Promise<void> {
    throw new Error("Método no implementado.");
  }

  resetPassword(
    email: string,
    newPassword: string,
    validationCode: string,
  ): Promise<boolean> {
    throw new Error("Método no implementado.");
  }

  async verifyToken(): Promise<boolean> {
    try {
      const token = await this.prefs.retrieveData<string>("token");
      if (!token) return false;

      const response = await fetch(`${this.baseUrl}/verify-token`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        console.log("El token es válido");
        return true;
      } else {
        const body = await response.json();
        console.error(`Error de verificación del token: ${body.message}`);
        return false;
      }
    } catch (e: any) {
      console.error("Falló la verificación del token", e);
      return false;
    }
  }
}