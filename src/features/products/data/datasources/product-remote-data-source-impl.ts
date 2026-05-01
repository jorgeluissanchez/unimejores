import { ILocalPreferences } from "@/core/storage/i-local-preferences";
import { LocalPreferencesAsyncStorage } from "@/core/storage/local-preferences-async-storage";
import { AuthRemoteDataSourceImpl } from "@/features/auth/data/datasources/auth-remote-data-source-impl";
import { ProductDataSource } from "@/features/products/data/datasources/product-data-source";
import { NewProduct, Product } from "@/features/products/domain/entities/product";

export class ProductRemoteDataSourceImpl implements ProductDataSource {
  private readonly projectId: string;
  private readonly baseUrl: string;
  private readonly table = "Product";

  private prefs: ILocalPreferences;

  constructor(
    private authService: AuthRemoteDataSourceImpl,
    projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID,
  ) {
    if (!projectId) {
      throw new Error("Falta la variable de entorno EXPO_PUBLIC_ROBLE_PROJECT_ID");
    }
    this.prefs = LocalPreferencesAsyncStorage.getInstance();
    this.projectId = projectId;
    this.baseUrl = `https://roble-api.openlab.uninorte.edu.co/database/${this.projectId}`;
  }

  private async authorizedFetch(
    url: string,
    options: RequestInit,
    retry = true,
  ): Promise<Response> {
    const token = await this.prefs.retrieveData<string>("token");
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && retry) {
      console.warn("Se detectó 401, intentando renovar el token…");
      try {
        const refreshed = await this.authService.refreshToken();
        if (refreshed) {
          const newToken = await this.prefs.retrieveData<string>("token");
          const retryHeaders = {
            ...(options.headers || {}),
            Authorization: `Bearer ${newToken}`,
          };
          return await fetch(url, { ...options, headers: retryHeaders });
        }
      } catch (e) {
        console.error("Falló la renovación del token, cerrando sesión", e);
      }
    }

    return response;
  }

  async getProducts(): Promise<Product[]> {
    const url = `${this.baseUrl}/read?tableName=${this.table}`;

    const response = await this.authorizedFetch(url, { method: "GET" });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("No autorizado (problema con el token)");
      }
      throw new Error(`Error al obtener productos: ${response.status}`);
    }

    const data = await response.json();

    return data as Product[];
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const url = `${this.baseUrl}/read?tableName=${this.table}&_id=${id}`;

    const response = await this.authorizedFetch(url, { method: "GET" });

    if (response.status === 200) {
      const data: Product[] = await response.json();
      return data.length > 0 ? data[0] : undefined;
    } else if (response.status === 401) {
      throw new Error("No autorizado (problema con el token)");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Error al obtener el producto por id: ${response.status} - ${
          errorBody.message ?? "Error desconocido"
        }`,
      );
    }
  }

  async addProduct(product: NewProduct): Promise<void> {
    const url = `${this.baseUrl}/insert`;

    const body = JSON.stringify({
      tableName: this.table,
      records: [product],
    });

    const response = await this.authorizedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 201) {
      return Promise.resolve();
    } else if (response.status === 401) {
      throw new Error("No autorizado (problema con el token)");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Error al agregar el producto: ${response.status} - ${
          errorBody.message ?? "Error desconocido"
        }`,
      );
    }
  }

  async updateProduct(product: Product): Promise<void> {
    const url = `${this.baseUrl}/update`;

    const { _id, ...updates } = product;

    const body = JSON.stringify({
      tableName: this.table,
      idColumn: "_id",
      idValue: _id,
      updates,
    });

    const response = await this.authorizedFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 200) {
      return Promise.resolve();
    } else if (response.status === 401) {
      throw new Error("No autorizado (problema con el token)");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Error al actualizar el producto: ${response.status} - ${
          errorBody.message ?? "Error desconocido"
        }`,
      );
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const url = `${this.baseUrl}/delete`;

    const body = JSON.stringify({
      tableName: this.table,
      idColumn: "_id",
      idValue: id,
    });

    const response = await this.authorizedFetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 200) {
      return Promise.resolve();
    } else if (response.status === 401) {
      throw new Error("No autorizado (problema con el token)");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Error al eliminar el producto: ${response.status} - ${
          errorBody.message ?? "Error desconocido"
        }`,
      );
    }
  }
}