
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight,
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
  Smartphone,
  Bell,
  Building2,
  TrendingUp,
  Globe,
  Wrench,
  LogOut,
  User,
  Menu,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface SidebarProps {
  className?: string;
}

interface NavigationItem {
  title: string;
  icon: any;
  href: string;
  moduleKey?: string;
  roles?: string[];
  badge?: string;
  children?: NavigationItem[];
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const { modules } = useModules();
  
  const userRole = (session as any)?.user?.role;

  // Control de visibilidad al hacer scroll
  useEffect(() => {
    const controlSidebar = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & scrolled more than 100px
        setVisible(false);
      } else {
        // Scrolling up or at top
        setVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlSidebar);
    return () => window.removeEventListener('scroll', controlSidebar);
  }, [lastScrollY]);

  // Actualizar CSS variable para el margen del contenido principal
  useEffect(() => {
    const root = document.documentElement;
    if (collapsed) {
      root.style.setProperty('--sidebar-width', '4rem');
    } else {
      root.style.setProperty('--sidebar-width', '16rem');
    }
  }, [collapsed]);

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

  // Configuración de navegación por categorías
  const navigationItems: { category: string; items: NavigationItem[] }[] = [
    {
      category: 'Principal',
      items: [
        {
          title: 'Dashboard',
          icon: LayoutDashboard,
          href: userRole === 'ADMIN' ? '/admin/dashboard' : 
                userRole === 'ASESOR' ? '/asesor/dashboard' : 
                '/cliente/dashboard',
        }
      ]
    },
    {
      category: 'Gestión',
      items: [
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
          href: '/loans',
          moduleKey: 'loan_list',
          roles: ['ADMIN', 'ASESOR']
        },
        {
          title: 'Mis Préstamos',
          icon: CreditCard,
          href: '/cliente/loans',
          moduleKey: 'loan_list',
          roles: ['CLIENTE']
        },
        {
          title: 'Pagos',
          icon: DollarSign,
          href: '/payments',
          moduleKey: 'payment_history',
          roles: ['ADMIN', 'ASESOR']
        },
        {
          title: 'Mis Pagos',
          icon: DollarSign,
          href: '/cliente/payments',
          moduleKey: 'payment_history',
          roles: ['CLIENTE']
        },
        {
          title: 'Usuarios',
          icon: UserPlus,
          href: '/admin/users',
          moduleKey: 'user_management',
          roles: ['ADMIN']
        },
        {
          title: 'Solicitudes de Crédito',
          icon: ClipboardList,
          href: '/credit-applications',
          moduleKey: 'credit_workflow',
          roles: ['ADMIN', 'ASESOR']
        },
        {
          title: 'Mi Solicitud',
          icon: ClipboardList,
          href: '/cliente/credit-applications',
          moduleKey: 'credit_workflow',
          roles: ['CLIENTE']
        }
      ]
    },
    {
      category: 'Reportes',
      items: [
        {
          title: 'Portfolio',
          icon: TrendingUp,
          href: '/reports/portfolio',
          moduleKey: 'report_portfolio',
          roles: ['ADMIN', 'ASESOR']
        },
        {
          title: 'Cobranza',
          icon: Phone,
          href: '/reports/collections',
          moduleKey: 'report_collections',
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
          href: '/files',
          moduleKey: 'file_management',
          roles: ['ADMIN', 'ASESOR']
        }
      ]
    },
    {
      category: 'Comunicación',
      items: [
        {
          title: 'WhatsApp',
          icon: MessageSquare,
          href: '/whatsapp',
          moduleKey: 'whatsapp_notifications',
          roles: ['ADMIN', 'ASESOR']
        },
        {
          title: 'Recargas de Mensajes',
          icon: RefreshCw,
          href: '/admin/message-recharges',
          moduleKey: 'whatsapp_notifications',
          roles: ['ADMIN']
        },
        {
          title: 'Notificaciones',
          icon: Bell,
          href: '/notifications',
          moduleKey: 'notifications_inapp',
          roles: ['ADMIN', 'ASESOR', 'CLIENTE']
        },
        {
          title: 'Cobranza Móvil',
          icon: Smartphone,
          href: '/mobile/cobranza',
          moduleKey: 'collection_mobile',
          roles: ['ADMIN', 'ASESOR']
        }
      ]
    },
    {
      category: 'Configuración',
      items: [
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
    }
  ];

  // Filtrar items por rol y módulos habilitados
  const getFilteredItems = (items: NavigationItem[]) => {
    return items.filter(item => {
      // Verificar rol
      if (item.roles && !item.roles.includes(userRole)) {
        return false;
      }
      
      // Verificar módulo habilitado (si aplica)
      if (item.moduleKey) {
        return modules.some(module => module.moduleKey === item.moduleKey);
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

  return (
    <div className={cn(
      'flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out fixed left-0 top-0 h-full z-50',
      collapsed ? 'w-16' : 'w-64',
      'hidden md:flex', // Solo visible en desktop
      visible ? 'translate-x-0' : '-translate-x-full', // Controla visibilidad con scroll
      className
    )}>
      {/* Header del Sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className={cn(
          'flex items-center space-x-3 transition-opacity duration-200',
          collapsed ? 'opacity-0' : 'opacity-100'
        )}>
          <Building2 className="h-6 w-6 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">EscalaFin</h2>
            <Badge variant="outline" className="text-xs">
              {enabledModulesCount} módulos
            </Badge>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Info y Controles */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className={cn(
            'flex items-center space-x-3',
            collapsed ? 'justify-center' : 'justify-start'
          )}>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {getInitials(session?.user?.name || '', session?.user?.email || '')}
                </span>
              </div>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {getRoleDisplayName(userRole || 'USER')}
                </Badge>
              </div>
            )}
          </div>
          
          {!collapsed && (
            <div className="flex items-center space-x-1">
              <ThemeToggle />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" forceMount>
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
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
          )}
        </div>
      </div>

      {/* Navegación */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-3">
          {navigationItems.map((section) => {
            const filteredItems = getFilteredItems(section.items);
            
            if (filteredItems.length === 0) return null;

            return (
              <div key={section.category}>
                {/* Título de categoría */}
                {!collapsed && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.category}
                  </h3>
                )}
                
                {collapsed && <Separator className="mb-3" />}

                {/* Items de navegación */}
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const ItemComponent = item.moduleKey ? 
                      ({ children }: { children: React.ReactNode }) => (
                        <ModuleWrapper moduleKey={item.moduleKey!}>
                          {children}
                        </ModuleWrapper>
                      ) : 
                      ({ children }: { children: React.ReactNode }) => <>{children}</>;

                    return (
                      <ItemComponent key={item.title}>
                        <Link href={item.href}>
                          <Button
                            variant={isActive(item.href) ? 'secondary' : 'ghost'}
                            className={cn(
                              'w-full justify-start text-left h-10',
                              collapsed ? 'px-3' : 'px-3',
                              isActive(item.href) && 'bg-primary/10 text-primary border-primary/20'
                            )}
                          >
                            <item.icon className={cn(
                              'h-4 w-4 flex-shrink-0',
                              !collapsed && 'mr-3'
                            )} />
                            {!collapsed && (
                              <>
                                <span className="truncate flex-1">{item.title}</span>
                                {item.badge && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    {item.badge}
                                  </Badge>
                                )}
                              </>
                            )}
                          </Button>
                        </Link>
                      </ItemComponent>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
