'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Definición ligera del Tenant para el frontend
export interface TenantInfo {
    id: string;
    name: string;
    slug: string;
    domain?: string | null;
    status?: string;
    logo?: string | null;
    primaryColor?: string | null;
    timezone?: string;
    createdAt?: string | Date;
}

interface TenantContextType {
    tenant: TenantInfo | null;
    isLoading: boolean;
}

const TenantContext = createContext<TenantContextType>({
    tenant: null,
    isLoading: true,
});

export const useTenant = () => useContext(TenantContext);

interface TenantProviderProps {
    children: ReactNode;
    tenant: TenantInfo | null;
}

export function TenantProvider({ children, tenant }: TenantProviderProps) {
    return (
        <TenantContext.Provider value={{ tenant, isLoading: false }}>
            {children}
        </TenantContext.Provider>
    );
}
