import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { NewProduct, Product } from "@/features/products/domain/entities/product";
import { ProductRepository } from "@/features/products/domain/repositories/product-repository";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ProductContextType = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  addProduct: (product: NewProduct) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Promise<Product | undefined>;
  refreshProducts: () => Promise<void>;
};

export const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const di = useDI();
  const { expireSession } = useAuth();

  // ✅ Directly resolve the repository, no use cases
  const productRepo = useMemo(() => di.resolve<ProductRepository>(TOKENS.ProductRepo), [di]);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    refreshProducts();
  }, []);

  const refreshProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await productRepo.getProducts();
      setProducts(list);
    } catch (e) {
      if (isSessionExpiredError(e)) {
        await expireSession();
        setProducts([]);
        return;
      }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (product: NewProduct) => {
    try {
      setIsLoading(true);
      setError(null);
      await productRepo.addProduct(product);
      await refreshProducts();
    } catch (e) {
      if (isSessionExpiredError(e)) {
        await expireSession();
        return;
      }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      setIsLoading(true);
      setError(null);
      await productRepo.updateProduct(product);
      await refreshProducts();
    } catch (e) {
      if (isSessionExpiredError(e)) {
        await expireSession();
        return;
      }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const removeProduct = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await productRepo.deleteProduct(id);
      await refreshProducts();
    } catch (e) {
      if (isSessionExpiredError(e)) {
        await expireSession();
        return;
      }
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getProduct = async (id: string) => {
    if (__DEV__) console.log("Obteniendo producto con id:", id);
    try {
      setIsLoading(true);
      setError(null);
      return await productRepo.getProductById(id);
    } catch (e) {
      if (isSessionExpiredError(e)) {
        await expireSession();
        return undefined;
      }
      setError((e as Error).message);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      products,
      isLoading,
      error,
      clearError,
      addProduct,
      updateProduct,
      removeProduct,
      getProduct,
      refreshProducts,
    }),
    [products, isLoading, error]
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts debe usarse dentro de ProductProvider");
  return ctx;
}