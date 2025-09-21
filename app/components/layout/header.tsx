
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Building2, Bell, Settings, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { useModules } from '@/hooks/use-modules';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export function Header() {
  const { data: session } = useSession() || {};
  const { modules } = useModules();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const enabledModulesCount = modules.length;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EscalaFin</h1>
              <p className="text-sm text-gray-500">
                Sistema de Gestión de Créditos
              </p>
            </div>
          </Link>
          
          {/* Module Count Indicator */}
          <div className="hidden lg:flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {enabledModulesCount} módulos activos
            </Badge>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {session?.user && (
            <>
              {/* Notifications */}
              <ModuleWrapper moduleKey="notifications_inapp">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Notificaciones
                </Button>
              </ModuleWrapper>

              {/* Admin Settings */}
              {session.user.role === 'ADMIN' && (
                <ModuleWrapper moduleKey="system_settings">
                  <Link href="/admin/modules">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Módulos
                    </Button>
                  </Link>
                </ModuleWrapper>
              )}

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <Badge variant="secondary">
                  {getRoleDisplayName(session.user.role || '')}
                </Badge>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.user.email}
                  </p>
                </div>
              </div>

              {/* Sign Out */}
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 border-t pt-4">
          <div className="space-y-3">
            {session?.user && (
              <>
                {/* User Info */}
                <div className="flex items-center space-x-3 pb-3 border-b">
                  <Badge variant="secondary">
                    {getRoleDisplayName(session.user.role || '')}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                {/* Module Count */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Módulos activos:</span>
                  <Badge variant="outline">{enabledModulesCount}</Badge>
                </div>

                {/* Mobile Actions */}
                <div className="space-y-2">
                  <ModuleWrapper moduleKey="notifications_inapp">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Bell className="h-4 w-4 mr-2" />
                      Notificaciones
                    </Button>
                  </ModuleWrapper>

                  {session.user.role === 'ADMIN' && (
                    <ModuleWrapper moduleKey="system_settings">
                      <Link href="/admin/modules" className="block">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Settings className="h-4 w-4 mr-2" />
                          Gestionar Módulos
                        </Button>
                      </Link>
                    </ModuleWrapper>
                  )}

                  <Button 
                    onClick={handleSignOut} 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
