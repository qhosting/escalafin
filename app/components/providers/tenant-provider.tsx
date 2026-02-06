'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Definición ligera del Tenant para el frontend
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    domain?: string | null;
    status?: string;
}

interface TenantContextType {
    tenant: Tenant | null;
    isLoading: boolean;
}

const TenantContext = createContext<TenantContextType>({
    tenant: null,
    isLoading: true,
});

export const useTenant = () => useContext(TenantContext);

interface TenantProviderProps {
    children: ReactNode;
    tenant: Tenant | null;
}

export function TenantProvider({ children, tenant }: TenantProviderProps) {
    return (
        <TenantContext.Provider value={{ tenant, isLoading: false }}>
            {children}
        </TenantContext.Provider>
    );
}
