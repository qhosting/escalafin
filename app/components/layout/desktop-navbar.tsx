
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
  TrendingUp,
  Globe,
  Wrench,
  LogOut,
  User,
  ChevronDown,
  HelpCircle,
  HardDrive,
  FolderOpen,
  Receipt,
  RefreshCw,
  Building2
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
}

interface MenuGroup {
  title: string;
  items: NavigationItem[];
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

  // Configuración de menús por rol
  const getMenusForRole = (): { [key: string]: MenuGroup[] } => {
    const dashboardHref = userRole === 'ADMIN' ? '/admin/dashboard' : 
                          userRole === 'ASESOR' ? '/asesor/dashboard' : 
                          '/cliente/dashboard';

    if (userRole === 'ADMIN') {
      return {
        'Catálogo': [
          {
            title: 'Clientes',
            items: [
              { title: 'Lista de Clientes', icon: Users, href: '/admin/clients', moduleKey: 'client_list' },
              { title: 'Nuevo Cliente', icon: UserPlus, href: '/admin/clients/new', moduleKey: 'client_list' }
            ]
          },
          {
            title: 'Usuarios',
            items: [
              { title: 'Gestión de Usuarios', icon: UserPlus, href: '/admin/users', moduleKey: 'user_management' }
            ]
          }
        ],
        'Operaciones': [
          {
            title: 'Préstamos',
            items: [
              { title: 'Lista de Préstamos', icon: CreditCard, href: '/admin/loans', moduleKey: 'loan_list' },
              { title: 'Solicitudes de Crédito', icon: ClipboardList, href: '/admin/credit-applications', moduleKey: 'credit_workflow' }
            ]
          },
          {
            title: 'Pagos',
            items: [
              { title: 'Historial de Pagos', icon: DollarSign, href: '/admin/payments', moduleKey: 'payment_history' },
              { title: 'Transacciones', icon: Receipt, href: '/admin/payments/transactions', moduleKey: 'payment_history' }
            ]
          }
        ],
        'Reportes': [
          {
            title: 'Análisis',
            items: [
              { title: 'Dashboard Analítico', icon: BarChart3, href: '/admin/analytics', moduleKey: 'analytics_dashboard' },
              { title: 'Portfolio', icon: TrendingUp, href: '/admin/reports', moduleKey: 'report_portfolio' }
            ]
          },
          {
            title: 'Cobranza',
            items: [
              { title: 'Reportes de Cobranza', icon: Phone, href: '/admin/reports/collections', moduleKey: 'report_collections' }
            ]
          },
          {
            title: 'Documentos',
            items: [
              { title: 'Gestión de Archivos', icon: FileText, href: '/admin/files', moduleKey: 'file_management' },
              { title: 'Google Drive', icon: HardDrive, href: '/admin/storage', moduleKey: 'file_management' }
            ]
          }
        ],
        'Comunicación': [
          {
            title: 'WhatsApp',
            items: [
              { title: 'Mensajes', icon: MessageSquare, href: '/admin/whatsapp/messages', moduleKey: 'whatsapp_notifications' },
              { title: 'Recargas', icon: RefreshCw, href: '/admin/message-recharges', moduleKey: 'whatsapp_notifications' }
            ]
          },
          {
            title: 'Chat',
            items: [
              { title: 'Chatwoot', icon: MessageSquare, href: '/admin/chatwoot', moduleKey: 'chatwoot_chat' }
            ]
          },
          {
            title: 'Notificaciones',
            items: [
              { title: 'Centro de Notificaciones', icon: Bell, href: '/notifications', moduleKey: 'notifications_inapp' }
            ]
          }
        ],
        'Configuración': [
          {
            title: 'Sistema',
            items: [
              { title: 'Configuración General', icon: Settings, href: '/admin/config', moduleKey: 'system_settings' },
              { title: 'Módulos PWA', icon: Settings, href: '/admin/modules', moduleKey: 'system_settings' },
              { title: 'Parámetros', icon: Wrench, href: '/admin/settings', moduleKey: 'system_settings' }
            ]
          },
          {
            title: 'Integraciones',
            items: [
              { title: 'APIs Externas', icon: Globe, href: '/admin/whatsapp/config', moduleKey: 'api_integration' }
            ]
          },
          {
            title: 'Almacenamiento',
            items: [
              { title: 'Google Drive', icon: HardDrive, href: '/admin/storage', moduleKey: 'file_management' }
            ]
          }
        ]
      };
    } else if (userRole === 'ASESOR') {
      return {
        'Catálogo': [
          {
            title: 'Clientes',
            items: [
              { title: 'Mis Clientes', icon: Users, href: '/asesor/clients', moduleKey: 'client_list' },
              { title: 'Nuevo Cliente', icon: UserPlus, href: '/admin/clients/new', moduleKey: 'client_list' }
            ]
          }
        ],
        'Operaciones': [
          {
            title: 'Préstamos',
            items: [
              { title: 'Lista de Préstamos', icon: CreditCard, href: '/asesor/loans', moduleKey: 'loan_list' },
              { title: 'Solicitudes de Crédito', icon: ClipboardList, href: '/asesor/credit-applications', moduleKey: 'credit_workflow' }
            ]
          },
          {
            title: 'Pagos',
            items: [
              { title: 'Historial de Pagos', icon: DollarSign, href: '/admin/payments', moduleKey: 'payment_history' }
            ]
          }
        ],
        'Reportes': [
          {
            title: 'Análisis',
            items: [
              { title: 'Mis Métricas', icon: BarChart3, href: '/admin/reports', moduleKey: 'report_portfolio' }
            ]
          },
          {
            title: 'Cobranza',
            items: [
              { title: 'Cobranza Móvil', icon: Phone, href: '/mobile/cobranza', moduleKey: 'collection_mobile' }
            ]
          }
        ],
        'Comunicación': [
          {
            title: 'WhatsApp',
            items: [
              { title: 'Mensajes', icon: MessageSquare, href: '/admin/whatsapp/messages', moduleKey: 'whatsapp_notifications' }
            ]
          },
          {
            title: 'Notificaciones',
            items: [
              { title: 'Centro de Notificaciones', icon: Bell, href: '/notifications', moduleKey: 'notifications_inapp' }
            ]
          }
        ]
      };
    } else { // CLIENTE
      return {
        'Mis Finanzas': [
          {
            title: 'Préstamos',
            items: [
              { title: 'Mis Préstamos Activos', icon: CreditCard, href: '/cliente/loans', moduleKey: 'loan_list' },
              { title: 'Nueva Solicitud', icon: ClipboardList, href: '/cliente/credit-applications', moduleKey: 'credit_workflow' }
            ]
          },
          {
            title: 'Pagos',
            items: [
              { title: 'Realizar Pago', icon: DollarSign, href: '/cliente/payments', moduleKey: 'payment_history' },
              { title: 'Historial', icon: Receipt, href: '/cliente/payments', moduleKey: 'payment_history' }
            ]
          }
        ],
        'Documentos': [
          {
            title: 'Archivos',
            items: [
              { title: 'Mis Documentos', icon: FolderOpen, href: '/admin/files', moduleKey: 'file_management' }
            ]
          }
        ],
        'Comunicación': [
          {
            title: 'Notificaciones',
            items: [
              { title: 'Centro de Notificaciones', icon: Bell, href: '/notifications', moduleKey: 'notifications_inapp' }
            ]
          }
        ]
      };
    }
  };

  // Filtrar items por módulos habilitados
  const filterItemsByModule = (items: NavigationItem[]) => {
    return items.filter(item => {
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

  // Si no hay sesión, no mostrar navegación
  if (!session) {
    return null;
  }

  const dashboardHref = userRole === 'ADMIN' ? '/admin/dashboard' : 
                        userRole === 'ASESOR' ? '/asesor/dashboard' : 
                        '/cliente/dashboard';

  const menus = getMenusForRole();

  return (
    <nav className="hidden md:flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto w-full px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Brand */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              <div className="relative h-10 w-48">
                <Image 
                  src="/logoescalafin.png" 
                  alt="EscalaFin Logo" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Navegación principal */}
            <div className="flex items-center space-x-1">
              {/* Dashboard */}
              <Link href={dashboardHref}>
                <Button
                  variant={isActive(dashboardHref) ? 'default' : 'ghost'}
                  className="flex items-center space-x-2"
                  size="sm"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>

              {/* Menús dinámicos */}
              {Object.entries(menus).map(([menuTitle, groups]) => {
                // Filtrar grupos que tengan items habilitados
                const filteredGroups = groups.map(group => ({
                  ...group,
                  items: filterItemsByModule(group.items)
                })).filter(group => group.items.length > 0);

                if (filteredGroups.length === 0) return null;

                // Verificar si hay algún item activo
                const hasActiveItem = filteredGroups.some(group => 
                  group.items.some(item => isActive(item.href))
                );

                return (
                  <DropdownMenu key={menuTitle}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={hasActiveItem ? 'default' : 'ghost'}
                        className="flex items-center space-x-1"
                        size="sm"
                      >
                        <span>{menuTitle}</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent className="w-56" align="start">
                      {filteredGroups.map((group, groupIndex) => (
                        <div key={group.title}>
                          {groupIndex > 0 && <DropdownMenuSeparator />}
                          
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            {group.title}
                          </DropdownMenuLabel>
                          
                          {group.items.map((item) => {
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
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}

              {/* Soporte */}
              <Link href="/soporte">
                <Button
                  variant={isActive('/soporte') ? 'default' : 'ghost'}
                  className="flex items-center space-x-2"
                  size="sm"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Soporte</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Acciones del usuario */}
          <div className="flex items-center space-x-3">
            {/* Toggle de tema */}
            <ThemeToggle />

            {/* Notificaciones */}
            <ModuleWrapper moduleKey="notifications_inapp">
              <Link href="/notifications">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
              </Link>
            </ModuleWrapper>

            {/* Menú de usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
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
