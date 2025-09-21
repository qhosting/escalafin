
'use client';

import { useModules } from '@/hooks/use-modules';
import { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ModuleWrapperProps {
  moduleKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  permission?: string;
  showDisabledMessage?: boolean;
}

export function ModuleWrapper({ 
  moduleKey, 
  children, 
  fallback = null, 
  permission,
  showDisabledMessage = false 
}: ModuleWrapperProps) {
  const { isModuleEnabled, hasPermission, loading } = useModules();

  if (loading) {
    return (
      <div className="animate-pulse bg-muted rounded-md h-32 flex items-center justify-center">
        <span className="text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  if (!isModuleEnabled(moduleKey)) {
    if (showDisabledMessage) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este módulo está deshabilitado actualmente.
          </AlertDescription>
        </Alert>
      );
    }
    return fallback;
  }

  if (permission && !hasPermission(moduleKey, permission)) {
    if (showDisabledMessage) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a este módulo.
          </AlertDescription>
        </Alert>
      );
    }
    return fallback;
  }

  return <>{children}</>;
}

// Hook para obtener módulos habilitados de una categoría específica
export function ModuleSection({ 
  category, 
  children, 
  title,
  description 
}: {
  category?: string;
  children: (modules: any[]) => ReactNode;
  title?: string;
  description?: string;
}) {
  const { modules, loading } = useModules();

  const filteredModules = category 
    ? modules.filter(m => m.category === category)
    : modules;

  if (loading) {
    return (
      <div className="space-y-4">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {description && <p className="text-muted-foreground">{description}</p>}
        <div className="animate-pulse bg-muted rounded-md h-32" />
      </div>
    );
  }

  if (filteredModules.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {description && <p className="text-muted-foreground">{description}</p>}
      {children(filteredModules)}
    </div>
  );
}
