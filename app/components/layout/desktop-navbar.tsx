
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  FileText,
  BarChart3,
  MessageSquare,
  Settings,
  UserPlus,
  ClipboardList,
  Phone,
  Bell,
  Building2,
  TrendingUp,
  Globe,
  Wrench,
  LogOut,
  User,
  ChevronDown,
  Home,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { useModules } from '@/hooks/use-modules';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface NavigationItem {
  title: string;
  icon: any;
  href: string;
  moduleKey?: string;
  roles?: string[];
  badge?: string;
  children?: NavigationItem[];
}

export function DesktopNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const { modules, loading, isModuleEnabled } = useModules();
  
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

  // Configuración de navegación principal
  const mainNavItems: NavigationItem[] = [
    {
      title: 'Inicio',
      icon: Home,
      href: '/',
    },
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: userRole === 'ADMIN' ? '/admin/dashboard' : 
            userRole === 'ASESOR' ? '/asesor/dashboard' : 
            '/cliente/dashboard',
    },
    {
      title: 'Soporte',
      icon: HelpCircle,
      href: '/soporte',
    }
  ];

  // Menús desplegables
  const dropdownMenus: { [key: string]: NavigationItem[] } = {
    'Clientes': [
      {
        title: 'Lista de Clientes',
        icon: Users,
        href: '/admin/clients',
        moduleKey: 'client_list',
        roles: ['ADMIN', 'ASESOR']
      },
      {
        title: 'Nuevo Cliente',
        icon: UserPlus,
        href: '/admin/clients/new',
        moduleKey: 'client_list',
        roles: ['ADMIN', 'ASESOR']
      }
    ],
    'Préstamos': [
      {
        title: userRole === 'CLIENTE' ? 'Mis Préstamos' : 'Lista de Préstamos',
        icon: CreditCard,
        href: userRole === 'CLIENTE' ? '/cliente/loans' : 
              userRole === 'ADMIN' ? '/admin/loans' : '/loans',
        moduleKey: 'loan_list'
      },
      {
        title: 'Solicitudes de Crédito',
        icon: ClipboardList,
        href: userRole === 'CLIENTE' ? '/cliente/credit-applications' : 
              userRole === 'ADMIN' ? '/admin/credit-applications' : '/credit-applications',
        moduleKey: 'credit_workflow'
      }
    ],
    'Pagos': [
      {
        title: userRole === 'CLIENTE' ? 'Mis Pagos' : 'Historial de Pagos',
        icon: DollarSign,
        href: userRole === 'CLIENTE' ? '/cliente/payments' : 
              userRole === 'ADMIN' ? '/admin/payments' : '/payments',
        moduleKey: 'payment_history'
      }
    ],
    'Reportes': [
      {
        title: 'Reportes',
        icon: FileText,
        href: userRole === 'ADMIN' ? '/admin/reports' : '/reports',
        moduleKey: 'report_portfolio',
        roles: ['ADMIN', 'ASESOR']
      },
      {
        title: 'Analíticos',
        icon: BarChart3,
        href: '/admin/analytics',
        moduleKey: 'analytics_dashboard',
        roles: ['ADMIN']
      },
      {
        title: 'Archivos',
        icon: FileText,
        href: '/admin/files',
        moduleKey: 'file_management',
        roles: ['ADMIN', 'ASESOR']
      }
    ],
    'Comunicación': [
      {
        title: 'WhatsApp',
        icon: MessageSquare,
        href: '/admin/whatsapp/messages',
        moduleKey: 'whatsapp_notifications',
        roles: ['ADMIN', 'ASESOR']
      },
      {
        title: 'Chat (Chatwoot)',
        icon: MessageSquare,
        href: '/admin/chatwoot',
        moduleKey: 'chatwoot_chat',
        roles: ['ADMIN']
      },
      {
        title: 'Notificaciones',
        icon: Bell,
        href: '/notifications',
        moduleKey: 'notifications_inapp'
      }
    ],
    'Administración': [
      {
        title: 'Usuarios',
        icon: UserPlus,
        href: '/admin/users',
        moduleKey: 'user_management',
        roles: ['ADMIN']
      },
      {
        title: 'Configuración',
        icon: Settings,
        href: '/admin/config',
        moduleKey: 'system_settings',
        roles: ['ADMIN']
      },
      {
        title: 'Módulos PWA',
        icon: Settings,
        href: '/admin/modules',
        moduleKey: 'system_settings',
        roles: ['ADMIN']
      },
      {
        title: 'Sistema',
        icon: Wrench,
        href: '/admin/settings',
        moduleKey: 'system_settings',
        roles: ['ADMIN']
      },
      {
        title: 'API Externa',
        icon: Globe,
        href: '/admin/api-config',
        moduleKey: 'api_integration',
        roles: ['ADMIN']
      }
    ]
  };

  // Filtrar items por rol y módulos habilitados
  const getFilteredItems = (items: NavigationItem[]) => {
    return items.filter(item => {
      // Verificar rol
      if (item.roles && !item.roles.includes(userRole)) {
        return false;
      }
      
      // Verificar módulo habilitado (si aplica)
      if (item.moduleKey) {
        return isModuleEnabled(item.moduleKey);
      }
      
      return true;
    });
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const enabledModulesCount = modules.length;

  // Si no hay sesión, no mostrar navegación
  if (!session) {
    return null;
  }

  return (
    <nav className="hidden md:flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto w-full px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Brand */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
              <div className="relative h-10 w-48">
                <Image 
                  src="/logoescalafin.png" 
                  alt="EscalaFin Logo" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <Badge variant="outline" className="text-xs">
                {loading ? 'Cargando...' : `${enabledModulesCount} módulos`}
              </Badge>
            </Link>

            {/* Navegación principal */}
            <div className="flex items-center space-x-1">
              {mainNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? 'default' : 'ghost'}
                    className="flex items-center space-x-2"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Button>
                </Link>
              ))}

              {/* Menús desplegables */}
              {Object.entries(dropdownMenus).map(([menuTitle, items]) => {
                const filteredItems = getFilteredItems(items);
                
                if (filteredItems.length === 0) return null;

                const hasActiveItem = filteredItems.some(item => isActive(item.href));

                return (
                  <DropdownMenu key={menuTitle}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={hasActiveItem ? 'default' : 'ghost'}
                        className="flex items-center space-x-1"
                      >
                        <span>{menuTitle}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent className="w-56" align="start">
                      {filteredItems.map((item) => {
                        const ItemWrapper = item.moduleKey ? 
                          ({ children }: { children: React.ReactNode }) => (
                            <ModuleWrapper moduleKey={item.moduleKey!}>
                              {children}
                            </ModuleWrapper>
                          ) : 
                          ({ children }: { children: React.ReactNode }) => <>{children}</>;

                        return (
                          <ItemWrapper key={item.href}>
                            <Link href={item.href}>
                              <DropdownMenuItem className={cn(
                                "cursor-pointer",
                                isActive(item.href) && "bg-primary/10 text-primary"
                              )}>
                                <item.icon className="mr-2 h-4 w-4" />
                                <span>{item.title}</span>
                                {item.badge && (
                                  <Badge variant="secondary" className="ml-auto text-xs">
                                    {item.badge}
                                  </Badge>
                                )}
                              </DropdownMenuItem>
                            </Link>
                          </ItemWrapper>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </div>
          </div>

          {/* Acciones del usuario */}
          <div className="flex items-center space-x-4">
            {/* Toggle de tema */}
            <ThemeToggle />

            {/* Notificaciones */}
            <ModuleWrapper moduleKey="notifications_inapp">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
            </ModuleWrapper>

            {/* Menú de usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(session?.user?.name || '', session?.user?.email || '')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">
                        {session?.user?.name || 'Usuario'}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {getRoleDisplayName(userRole || 'USER')}
                      </Badge>
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </DropdownMenuItem>
                
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
          </div>
        </div>
      </div>
    </nav>
  );
}
