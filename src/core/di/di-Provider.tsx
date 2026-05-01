import React, { createContext, useContext, useMemo } from "react";

import { TOKENS } from "@/core/constants/tokens";
import { Container } from "@/core/di/container";
import { AuthRemoteDataSourceImpl } from "@/features/auth/data/datasources/auth-remote-data-source-impl";
import { AuthRepositoryImpl } from "@/features/auth/data/repositories/auth-repository-impl";
import { ProductRemoteDataSourceImpl } from "@/features/products/data/datasources/product-remote-data-source-impl";
import { ProductRepositoryImpl } from "@/features/products/data/repositories/product-repository-impl";

const DIContext = createContext<Container | null>(null);

export function DIProvider({ children }: { children: React.ReactNode }) {
    //useMemo is a React Hook that lets you cache the result of a calculation between re-renders.
    const container = useMemo(() => {
        const c = new Container();

        const authDS = new AuthRemoteDataSourceImpl();
        const authRepo = new AuthRepositoryImpl(authDS);

        c.register(TOKENS.AuthRemoteDS, authDS)
            .register(TOKENS.AuthRepo, authRepo);


        const remoteDS = new ProductRemoteDataSourceImpl(authDS);
        const productRepo = new ProductRepositoryImpl(remoteDS);

        c.register(TOKENS.ProductRemoteDS, remoteDS)
            .register(TOKENS.ProductRepo, productRepo);



        return c;
    }, []);

    return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
}

export function useDI() {
    const c = useContext(DIContext);
    if (!c) throw new Error("Falta DIProvider");
    return c;
}