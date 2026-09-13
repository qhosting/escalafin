
'use client';

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import useSWR from 'swr';
import { UserRole } from '@prisma/client';

interface ModulePermission {
  moduleKey: string;
  enabled: boolean;
  permissions: string[];
  config?: any;
}

interface PWAModule {
  id: string;
  moduleKey: string;
  name: string;
  description?: string;
  category: string;
  status: string;
  isCore: boolean;
  requiredFor: string[];
  availableFor: string[];
  icon?: string;
  route?: string;
  sortOrder: number;
  config?: any;
  version: string;
  rolePermissions: {
    role: UserRole;
    enabled: boolean;
    permissions?: string[];
    config?: any;
  }[];
}

interface UseModulesReturn {
  modules: PWAModule[];
  loading: boolean;
  error: string | null;
  isModuleEnabled: (moduleKey: string) => boolean;
  hasPermission: (moduleKey: string, permission?: string) => boolean;
  getModuleConfig: (moduleKey: string) => any;
  refreshModules: () => Promise<void>;
}

const EMPTY_MODULES: PWAModule[] = [];

export function useModules(): UseModulesReturn {
  const { data: session, status } = useSession() || {};
  const user = session?.user;
  const { data, error: fetchError, isLoading, mutate } = useSWR<{ modules: PWAModule[] }>(
    status === 'authenticated' && user ? ['/api/modules/permissions', user.id, user.tenantId, user.role] : null,
    async ([url]: string[]) => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudieron cargar los permisos');
      return response.json();
    },
    { dedupingInterval: 5000, keepPreviousData: false }
  );
  const modules = data?.modules ?? EMPTY_MODULES;
  const loading = status === 'loading' || isLoading;
  const error = fetchError?.message ?? null;

  const isModuleEnabled = useCallback((moduleKey: string): boolean => {
    if (!session?.user?.role) return false;
    
    const module = modules.find(m => m.moduleKey === moduleKey);
    if (!module) return false;
    
    // Check if module is globally enabled
    if (module.status !== 'ENABLED') return false;
    
    // Check if user's role is in availableFor
    if (!module.availableFor.includes(session.user.role)) return false;
    
    // Check role-specific permissions
    const rolePermission = module.rolePermissions.find(p => p.role === session.user.role);
    return rolePermission?.enabled ?? false;
  }, [modules, session?.user?.role]);

  const hasPermission = (moduleKey: string, permission?: string): boolean => {
    if (!isModuleEnabled(moduleKey) || !session?.user?.role) return false;
    
    if (!permission) return true; // Just check if module is enabled
    
    const module = modules.find(m => m.moduleKey === moduleKey);
    if (!module) return false;
    
    const rolePermission = module.rolePermissions.find(p => p.role === session.user.role);
    if (!rolePermission || !rolePermission.permissions) return true; // Default allow if no specific permissions
    
    return rolePermission.permissions.includes(permission);
  };

  const getModuleConfig = (moduleKey: string): any => {
    if (!session?.user?.role) return null;
    
    const module = modules.find(m => m.moduleKey === moduleKey);
    if (!module) return null;
    
    const rolePermission = module.rolePermissions.find(p => p.role === session.user.role);
    return rolePermission?.config || module.config || {};
  };

  const refreshModules = async () => {
    await mutate();
  };

  return {
    modules,
    loading,
    error,
    isModuleEnabled,
    hasPermission,
    getModuleConfig,
    refreshModules,
  };
}

// Hook específico para obtener módulos disponibles para un dashboard
export function useDashboardModules(category?: string) {
  const { modules, loading, error, isModuleEnabled, hasPermission, getModuleConfig } = useModules();
  
  const availableModules = modules
    .filter(module => {
      if (category && module.category !== category) return false;
      return isModuleEnabled(module.moduleKey);
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    modules: availableModules,
    loading,
    error,
    isModuleEnabled,
    hasPermission,
    getModuleConfig,
  };
}
