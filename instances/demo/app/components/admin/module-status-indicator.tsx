
'use client';

import { useModules } from '@/hooks/use-modules';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings, Shield, AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';

export function ModuleStatusIndicator() {
  const { modules, loading } = useModules();

  if (loading) {
    return <Badge variant="outline">Cargando...</Badge>;
  }

  const statusCounts = modules.reduce((acc, module) => {
    acc[module.status] = (acc[module.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalModules = modules.length;
  const enabledModules = statusCounts.ENABLED || 0;
  const disabledModules = statusCounts.DISABLED || 0;
  const betaModules = statusCounts.BETA || 0;
  const maintenanceModules = statusCounts.MAINTENANCE || 0;

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {enabledModules} activos
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Módulos habilitados y funcionando</p>
          </TooltipContent>
        </Tooltip>

        {disabledModules > 0 && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                <Shield className="h-3 w-3 mr-1" />
                {disabledModules} deshabilitados
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Módulos deshabilitados por el administrador</p>
            </TooltipContent>
          </Tooltip>
        )}

        {betaModules > 0 && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="border-blue-200 text-blue-800">
                <Clock className="h-3 w-3 mr-1" />
                {betaModules} beta
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Módulos en fase de pruebas</p>
            </TooltipContent>
          </Tooltip>
        )}

        {maintenanceModules > 0 && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="bg-orange-100 text-orange-800">
                <Wrench className="h-3 w-3 mr-1" />
                {maintenanceModules} mantenimiento
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Módulos en mantenimiento</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline">
              <Settings className="h-3 w-3 mr-1" />
              {totalModules} total
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total de módulos en el sistema</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
