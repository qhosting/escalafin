
'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useModules } from '@/hooks/use-modules';
import { 
  Settings, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickModuleToggleProps {
  compact?: boolean;
  showCategories?: string[];
}

export function QuickModuleToggle({ 
  compact = false, 
  showCategories = ['DASHBOARD', 'TOOLS', 'NOTIFICATIONS']
}: QuickModuleToggleProps) {
  const { modules, loading, refreshModules } = useModules();
  const [updating, setUpdating] = useState<string | null>(null);

  const toggleModuleStatus = async (moduleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    
    try {
      setUpdating(moduleId);
      
      const response = await fetch('/api/admin/modules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating module');
      }

      await refreshModules();
      toast.success(`Módulo ${newStatus === 'ENABLED' ? 'habilitado' : 'deshabilitado'}`);
    } catch (error) {
      console.error('Error updating module:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar módulo');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredModules = modules.filter(module => 
    showCategories.includes(module.category) && !module.isCore
  );

  if (compact) {
    return (
      <div className="space-y-2">
        {filteredModules.slice(0, 5).map((module) => (
          <div key={module.id} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{module.name}</span>
              {module.isCore && (
                <Badge variant="outline">Core</Badge>
              )}
            </div>
            <Switch
              checked={module.status === 'ENABLED'}
              onCheckedChange={() => toggleModuleStatus(module.id, module.status)}
              disabled={module.isCore || updating === module.id}
            />
          </div>
        ))}
        {filteredModules.length > 5 && (
          <div className="text-center text-xs text-muted-foreground">
            Y {filteredModules.length - 5} módulos más...
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Control Rápido de Módulos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredModules.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No hay módulos configurables disponibles en las categorías seleccionadas.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {filteredModules.map((module) => (
              <div key={module.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium">{module.name}</h4>
                    <Badge variant="outline">
                      {module.category.toLowerCase()}
                    </Badge>
                    {module.isCore && (
                      <Badge variant="secondary">
                        Core
                      </Badge>
                    )}
                  </div>
                  {module.description && (
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <span>Disponible para: {module.availableFor.join(', ')}</span>
                    <span>v{module.version}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <Badge 
                      variant={module.status === 'ENABLED' ? 'default' : 'secondary'}
                      className={
                        module.status === 'ENABLED' ? 'bg-green-100 text-green-800' : 
                        module.status === 'DISABLED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {module.status === 'ENABLED' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <EyeOff className="h-3 w-3 mr-1" />
                      )}
                      {module.status === 'ENABLED' ? 'Activo' :
                       module.status === 'DISABLED' ? 'Inactivo' :
                       module.status === 'BETA' ? 'Beta' : 'Mantenimiento'}
                    </Badge>
                  </div>
                  
                  <Switch
                    checked={module.status === 'ENABLED'}
                    onCheckedChange={() => toggleModuleStatus(module.id, module.status)}
                    disabled={module.isCore || updating === module.id}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
