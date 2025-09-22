
'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  Bell, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Users,
  CreditCard,
  DollarSign,
  FileText,
  BarChart3,
  MessageSquare,
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  Phone,
  Smartphone,
  Globe,
  TrendingUp,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { useModules } from '@/hooks/use-modules';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function HeaderMobile() {
  const { data: session } = useSession() || {};
  const { modules } = useModules();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const userRole = (session as any)?.user?.role;

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

  // Items de navegación móvil (similar al sidebar pero simplificado)
  const mobileNavigationItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: userRole === 'ADMIN' ? '/admin/dashboard' : 
            userRole === 'ASESOR' ? '/asesor/dashboard' : 
            '/cliente/dashboard',
    },
    {
      title: 'Clientes',
      icon: Users,
      href: '/clients',
      moduleKey: 'client_list',
      roles: ['ADMIN', 'ASESOR']
    },
    {
      title: 'Préstamos',
      icon: CreditCard,
      href: userRole === 'CLIENTE' ? '/cliente/loans' : '/loans',
      moduleKey: 'loan_list',
    },
    {
      title: 'Pagos',
      icon: DollarSign,
      href: userRole === 'CLIENTE' ? '/cliente/payments' : '/payments',
      moduleKey: 'payment_history',
    },
    {
      title: 'WhatsApp',
      icon: MessageSquare,
      href: '/whatsapp',
      moduleKey: 'whatsapp_notifications',
      roles: ['ADMIN', 'ASESOR']
    },
    {
      title: 'Cobranza Móvil',
      icon: Smartphone,
      href: '/mobile/cobranza',
      moduleKey: 'collection_mobile',
      roles: ['ADMIN', 'ASESOR']
    },
    {
      title: 'Reportes',
      icon: BarChart3,
      href: '/reports/portfolio',
      moduleKey: 'report_portfolio',
      roles: ['ADMIN', 'ASESOR']
    }
  ];

  // Filtrar items por rol y módulos
  const filteredMobileItems = mobileNavigationItems.filter(item => {
    if (item.roles && !item.roles.includes(userRole)) {
      return false;
    }
    if (item.moduleKey) {
      return modules.some(module => module.moduleKey === item.moduleKey);
    }
    return true;
  });

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const enabledModulesCount = modules.length;

  return (
    <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Logo y título */}
        <Link href="/" className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">EscalaFin</h1>
            <p className="text-xs text-gray-500">
              {enabledModulesCount} módulos activos
            </p>
          </div>
        </Link>

        {/* Botón de menú móvil */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col h-full">
              {/* Header del menú móvil */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <Building2 className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">EscalaFin</h2>
                  <Badge variant="outline" className="text-xs">
                    {enabledModulesCount} módulos activos
                  </Badge>
                </div>
              </div>

              {/* Info del usuario */}
              {session?.user && (
                <div className="py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {session.user.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {session.user.name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {getRoleDisplayName(userRole || '')}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Navegación móvil */}
              <nav className="flex-1 py-4">
                <div className="space-y-2">
                  {filteredMobileItems.map((item) => {
                    const ItemComponent = item.moduleKey ? 
                      ({ children }: { children: React.ReactNode }) => (
                        <ModuleWrapper moduleKey={item.moduleKey!}>
                          {children}
                        </ModuleWrapper>
                      ) : 
                      ({ children }: { children: React.ReactNode }) => <>{children}</>;

                    return (
                      <ItemComponent key={item.title}>
                        <Link 
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button
                            variant={isActive(item.href) ? 'secondary' : 'ghost'}
                            className={cn(
                              'w-full justify-start h-12 text-left',
                              isActive(item.href) && 'bg-primary/10 text-primary'
                            )}
                          >
                            <item.icon className="h-5 w-5 mr-3" />
                            <span>{item.title}</span>
                          </Button>
                        </Link>
                      </ItemComponent>
                    );
                  })}
                </div>
              </nav>

              {/* Acciones del footer */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <ModuleWrapper moduleKey="notifications_inapp">
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-3" />
                    Notificaciones
                  </Button>
                </ModuleWrapper>

                {userRole === 'ADMIN' && (
                  <ModuleWrapper moduleKey="system_settings">
                    <Link href="/admin/modules">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Configuración
                      </Button>
                    </Link>
                  </ModuleWrapper>
                )}

                <Button 
                  onClick={handleSignOut} 
                  variant="outline" 
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
