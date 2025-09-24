
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Shield,
  Users,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Save,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface PWAModule {
  id: string;
  moduleKey: string;
  name: string;
  description?: string;
  category: string;
  status: 'ENABLED' | 'DISABLED' | 'BETA' | 'MAINTENANCE';
  isCore: boolean;
  requiredFor: string[];
  availableFor: string[];
  icon?: string;
  route?: string;
  sortOrder: number;
  config?: any;
  version: string;
  rolePermissions: {
    id: string;
    role: 'ADMIN' | 'ASESOR' | 'CLIENTE';
    enabled: boolean;
    permissions: string[];
    config?: any;
  }[];
  updatedByUser?: {
    firstName: string;
    lastName: string;
  };
  updatedAt: string;
}

export function ModuleManagement() {
  const [modules, setModules] = useState<PWAModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<PWAModule | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/modules');
      if (!response.ok) throw new Error('Error fetching modules');
      const data = await response.json();
      setModules(data.modules);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Error al cargar módulos');
    } finally {
      setLoading(false);
    }
  };

  const updateModuleStatus = async (moduleId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/modules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating module');
      }

      await fetchModules(); // Refresh the list
      toast.success(`Módulo ${status === 'ENABLED' ? 'habilitado' : 'deshabilitado'}`);
    } catch (error) {
      console.error('Error updating module:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar módulo');
    }
  };

  const updateRolePermission = async (
    moduleId: string,
    role: 'ADMIN' | 'ASESOR' | 'CLIENTE',
    enabled: boolean,
    permissions?: string[]
  ) => {
    try {
      const response = await fetch('/api/admin/modules/role-permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          role,
          enabled,
          permissions: permissions || ['read'],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating permissions');
      }

      await fetchModules(); // Refresh the list
      toast.success('Permisos actualizados');
    } catch (error) {
      console.error('Error updating role permission:', error);
      toast.error('Error al actualizar permisos');
    }
  };

  const getStatusBadge = (status: string, isCore: boolean) => {
    const variants = {
      ENABLED: 'default',
      DISABLED: 'secondary',
      BETA: 'outline',
      MAINTENANCE: 'destructive',
    } as const;

    return (
      <div className="flex items-center gap-2">
        <Badge variant={variants[status as keyof typeof variants] || 'default'}>
          {status === 'ENABLED' ? 'Habilitado' :
           status === 'DISABLED' ? 'Deshabilitado' :
           status === 'BETA' ? 'Beta' : 'Mantenimiento'}
        </Badge>
        {isCore && (
          <Badge variant="outline" className="text-xs">
            Core
          </Badge>
        )}
      </div>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      DASHBOARD: '📊',
      LOANS: '💰',
      PAYMENTS: '💳',
      CLIENTS: '👥',
      REPORTS: '📄',
      NOTIFICATIONS: '🔔',
      INTEGRATIONS: '🔗',
      TOOLS: '🛠️',
      ANALYTICS: '📈',
    } as const;
    
    return icons[category as keyof typeof icons] || '📦';
  };

  const groupedModules = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, PWAModule[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando módulos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Módulos PWA</h2>
          <p className="text-muted-foreground">
            Controla qué módulos están disponibles para cada rol de usuario
          </p>
        </div>
        <Button onClick={fetchModules} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="permissions">Permisos por Rol</TabsTrigger>
          <TabsTrigger value="logs">Registro de Cambios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {Object.entries(groupedModules).map(([category, categoryModules]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(category)}</span>
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                  <Badge variant="outline">{categoryModules.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryModules.map((module) => (
                    <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{module.name}</h4>
                          {getStatusBadge(module.status, module.isCore)}
                        </div>
                        {module.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {module.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Versión: {module.version}</span>
                          <span>Disponible para: {module.availableFor.join(', ')}</span>
                          {module.route && <span>Ruta: {module.route}</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!module.isCore && (
                          <Select
                            value={module.status}
                            onValueChange={(value) => updateModuleStatus(module.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ENABLED">Habilitado</SelectItem>
                              <SelectItem value="DISABLED">Deshabilitado</SelectItem>
                              <SelectItem value="BETA">Beta</SelectItem>
                              <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Configurar {module.name}</DialogTitle>
                              <DialogDescription>
                                Ajusta los permisos y configuración para este módulo
                              </DialogDescription>
                            </DialogHeader>
                            <ModuleConfigDialog 
                              module={module} 
                              onUpdate={() => fetchModules()}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permisos por Rol</CardTitle>
              <CardDescription>
                Controla qué módulos puede acceder cada rol de usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead className="text-center">Admin</TableHead>
                    <TableHead className="text-center">Asesor</TableHead>
                    <TableHead className="text-center">Cliente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(module.category)}</span>
                          <div>
                            <div className="font-medium">{module.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {module.category}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {(['ADMIN', 'ASESOR', 'CLIENTE'] as const).map((role) => (
                        <TableCell key={role} className="text-center">
                          <RolePermissionToggle
                            module={module}
                            role={role}
                            onUpdate={updateRolePermission}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Cambios</CardTitle>
              <CardDescription>
                Historial de modificaciones en los módulos (próximamente)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Esta funcionalidad estará disponible pronto
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for role permission toggle
function RolePermissionToggle({
  module,
  role,
  onUpdate,
}: {
  module: PWAModule;
  role: 'ADMIN' | 'ASESOR' | 'CLIENTE';
  onUpdate: (moduleId: string, role: 'ADMIN' | 'ASESOR' | 'CLIENTE', enabled: boolean) => void;
}) {
  const permission = module.rolePermissions.find(p => p.role === role);
  const isAvailable = module.availableFor.includes(role);
  const isEnabled = permission?.enabled ?? false;

  if (!isAvailable) {
    return <span className="text-xs text-muted-foreground">N/A</span>;
  }

  return (
    <Switch
      checked={isEnabled}
      onCheckedChange={(checked) => onUpdate(module.id, role, checked)}
      disabled={module.status !== 'ENABLED'}
    />
  );
}

// Dialog component for module configuration
function ModuleConfigDialog({ 
  module, 
  onUpdate 
}: { 
  module: PWAModule; 
  onUpdate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nombre del Módulo</Label>
          <Input value={module.name} disabled />
        </div>
        <div>
          <Label>Versión</Label>
          <Input value={module.version} disabled />
        </div>
      </div>
      
      <div>
        <Label>Descripción</Label>
        <Textarea value={module.description || ''} disabled />
      </div>

      <Separator />

      <div>
        <Label className="text-base font-medium">Permisos por Rol</Label>
        <div className="space-y-3 mt-2">
          {(['ADMIN', 'ASESOR', 'CLIENTE'] as const).map((role) => {
            const permission = module.rolePermissions.find(p => p.role === role);
            const isAvailable = module.availableFor.includes(role);
            
            if (!isAvailable) return null;
            
            return (
              <div key={role} className="flex items-center justify-between p-2 border rounded">
                <span className="font-medium">{role}</span>
                <Switch
                  checked={permission?.enabled ?? false}
                  onCheckedChange={(checked) => {
                    // This would call the API to update permissions
                    // Implementation depends on the parent component
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
