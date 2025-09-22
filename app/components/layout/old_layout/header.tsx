
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Bell, Settings, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { useModules } from '@/hooks/use-modules';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export function Header() {
  const { data: session } = useSession() || {};
  const { modules } = useModules();

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
    toast.success('Sesión cerrada');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'ASESOR': return 'Asesor';
      case 'CLIENTE': return 'Cliente';
      default: return role;
    }
  };

  const userRole = (session as any)?.user?.role;
  const enabledModulesCount = modules.length;

  const getInitials = (name: string, email: string) => {
    if (name && name.length > 0) {
      const names = name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return name[0].toUpperCase();
    }
    return email[0].toUpperCase();
  };

  return (
    <header className="hidden md:flex bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between w-full">
        {/* Información de contexto */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {userRole === 'ADMIN' ? 'Panel de Administración' : 
               userRole === 'ASESOR' ? 'Panel de Asesor' : 
               'Mi Cuenta'}
            </h1>
            <p className="text-sm text-gray-500">
              Sistema de Gestión de Créditos • {enabledModulesCount} módulos activos
            </p>
          </div>
        </div>

        {/* Acciones del header */}
        <div className="flex items-center space-x-3">
          {/* Toggle de tema */}
          <ThemeToggle />

          {/* Notificaciones */}
          <ModuleWrapper moduleKey="notifications_inapp">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </Button>
          </ModuleWrapper>

          {/* Menú de usuario */}
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(session.user.name || '', session.user.email || '')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name || 'Usuario'}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {getRoleDisplayName(userRole || 'USER')}
                      </Badge>
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </DropdownMenuItem>
                
                {userRole === 'ADMIN' && (
                  <ModuleWrapper moduleKey="system_settings">
                    <Link href="/admin/modules">
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Gestionar Módulos</span>
                      </DropdownMenuItem>
                    </Link>
                  </ModuleWrapper>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 dark:text-red-400"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
