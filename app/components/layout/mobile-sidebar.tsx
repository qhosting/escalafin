
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { 
  Menu,
  X,
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
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { useModules } from '@/hooks/use-modules';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const { modules, loading, isModuleEnabled } = useModules();
  
  const userRole = (session as any)?.user?.role;

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
    toast.success('Sesión cerrada');
    setOpen(false);
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
          href: '/admin/clients',
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
        },
        {
          title: 'Soporte Técnico',
          icon: HelpCircle,
          href: '/soporte',
          roles: ['ADMIN', 'ASESOR', 'CLIENTE']
        }
      ]
    },
    {
      category: 'Configuración',
      items: [
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

  // Si no hay sesión, no mostrar navegación móvil
  if (!session) {
    return null;
  }

  return (
    <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      {/* Header móvil */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">EscalaFin</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full bg-white">
                {/* Header del sidebar móvil */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {getInitials(session?.user?.name || '', session?.user?.email || '')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {session?.user?.name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {getRoleDisplayName(userRole || 'USER')}
                      </Badge>
                    </div>
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
                          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            {section.category}
                          </h3>

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
                                  <Link href={item.href} onClick={() => setOpen(false)}>
                                    <Button
                                      variant={isActive(item.href) ? 'secondary' : 'ghost'}
                                      className={cn(
                                        'w-full justify-start text-left h-10 px-3',
                                        isActive(item.href) && 'bg-primary/10 text-primary border-primary/20'
                                      )}
                                    >
                                      <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                                      <span className="truncate flex-1">{item.title}</span>
                                      {item.badge && (
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                          {item.badge}
                                        </Badge>
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

                {/* Footer con acciones */}
                <div className="p-4 border-t border-gray-200 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Mi Perfil
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
