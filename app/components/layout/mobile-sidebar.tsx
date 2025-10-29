
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
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
  HelpCircle,
  HardDrive,
  FolderOpen,
  Receipt,
  RefreshCw,
  Building2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { useModules } from '@/hooks/use-modules';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface NavigationItem {
  title: string;
  icon: any;
  href: string;
  moduleKey?: string;
  roles?: string[];
  badge?: string;
}

interface MenuCategory {
  category: string;
  icon: any;
  groups: {
    title: string;
    items: NavigationItem[];
  }[];
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Principal']);
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

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Configuración de menús por rol
  const getMenusForRole = (): MenuCategory[] => {
    const dashboardHref = userRole === 'ADMIN' ? '/admin/dashboard' : 
                          userRole === 'ASESOR' ? '/asesor/dashboard' : 
                          '/cliente/dashboard';

    if (userRole === 'ADMIN') {
      return [
        {
          category: 'Principal',
          icon: LayoutDashboard,
          groups: [
            {
              title: 'Dashboard',
              items: [
                { title: 'Dashboard', icon: LayoutDashboard, href: dashboardHref }
              ]
            }
          ]
        },
        {
          category: 'Catálogo',
          icon: Users,
          groups: [
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
          ]
        },
        {
          category: 'Operaciones',
          icon: CreditCard,
          groups: [
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
          ]
        },
        {
          category: 'Reportes',
          icon: BarChart3,
          groups: [
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
          ]
        },
        {
          category: 'Comunicación',
          icon: MessageSquare,
          groups: [
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
          ]
        },
        {
          category: 'Configuración',
          icon: Settings,
          groups: [
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
        },
        {
          category: 'Soporte',
          icon: HelpCircle,
          groups: [
            {
              title: 'Ayuda',
              items: [
                { title: 'Soporte Técnico', icon: HelpCircle, href: '/soporte' }
              ]
            }
          ]
        }
      ];
    } else if (userRole === 'ASESOR') {
      return [
        {
          category: 'Principal',
          icon: LayoutDashboard,
          groups: [
            {
              title: 'Dashboard',
              items: [
                { title: 'Dashboard', icon: LayoutDashboard, href: dashboardHref }
              ]
            }
          ]
        },
        {
          category: 'Catálogo',
          icon: Users,
          groups: [
            {
              title: 'Clientes',
              items: [
                { title: 'Mis Clientes', icon: Users, href: '/asesor/clients', moduleKey: 'client_list' },
                { title: 'Nuevo Cliente', icon: UserPlus, href: '/admin/clients/new', moduleKey: 'client_list' }
              ]
            }
          ]
        },
        {
          category: 'Operaciones',
          icon: CreditCard,
          groups: [
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
          ]
        },
        {
          category: 'Reportes',
          icon: BarChart3,
          groups: [
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
          ]
        },
        {
          category: 'Comunicación',
          icon: MessageSquare,
          groups: [
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
        },
        {
          category: 'Soporte',
          icon: HelpCircle,
          groups: [
            {
              title: 'Ayuda',
              items: [
                { title: 'Soporte Técnico', icon: HelpCircle, href: '/soporte' }
              ]
            }
          ]
        }
      ];
    } else { // CLIENTE
      return [
        {
          category: 'Principal',
          icon: LayoutDashboard,
          groups: [
            {
              title: 'Dashboard',
              items: [
                { title: 'Mi Panel', icon: LayoutDashboard, href: dashboardHref }
              ]
            }
          ]
        },
        {
          category: 'Mis Finanzas',
          icon: DollarSign,
          groups: [
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
          ]
        },
        {
          category: 'Documentos',
          icon: FolderOpen,
          groups: [
            {
              title: 'Archivos',
              items: [
                { title: 'Mis Documentos', icon: FolderOpen, href: '/admin/files', moduleKey: 'file_management' }
              ]
            }
          ]
        },
        {
          category: 'Comunicación',
          icon: MessageSquare,
          groups: [
            {
              title: 'Notificaciones',
              items: [
                { title: 'Centro de Notificaciones', icon: Bell, href: '/notifications', moduleKey: 'notifications_inapp' }
              ]
            }
          ]
        },
        {
          category: 'Soporte',
          icon: HelpCircle,
          groups: [
            {
              title: 'Ayuda',
              items: [
                { title: 'Soporte Técnico', icon: HelpCircle, href: '/soporte' }
              ]
            }
          ]
        }
      ];
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

  // Si no hay sesión, no mostrar navegación móvil
  if (!session) {
    return null;
  }

  const categories = getMenusForRole();

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
                <User className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            
            <SheetContent side="right" className="w-80 p-0 overflow-y-auto">
              <div className="flex flex-col h-full bg-white dark:bg-gray-900">
                {/* Header del sidebar móvil */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-primary/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {getInitials(session?.user?.name || '', session?.user?.email || '')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {session?.user?.name || 'Usuario'}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {getRoleDisplayName(userRole || 'USER')}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Navegación por categorías */}
                <div className="flex-1 overflow-y-auto py-2">
                  <nav className="space-y-1 px-2">
                    {categories.map((category) => {
                      // Filtrar grupos que tengan items habilitados
                      const filteredGroups = category.groups.map(group => ({
                        ...group,
                        items: filterItemsByModule(group.items)
                      })).filter(group => group.items.length > 0);

                      if (filteredGroups.length === 0) return null;

                      const isExpanded = expandedCategories.includes(category.category);
                      const CategoryIcon = category.icon;

                      return (
                        <Collapsible
                          key={category.category}
                          open={isExpanded}
                          onOpenChange={() => toggleCategory(category.category)}
                        >
                          {/* Título de categoría */}
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between px-3 py-2 h-auto font-semibold text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <div className="flex items-center gap-2">
                                <CategoryIcon className="h-4 w-4" />
                                <span>{category.category}</span>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="space-y-1 mt-1">
                            {filteredGroups.map((group) => (
                              <div key={group.title} className="pl-2">
                                {/* Título del grupo (opcional, solo si hay múltiples grupos) */}
                                {filteredGroups.length > 1 && (
                                  <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                    {group.title}
                                  </p>
                                )}

                                {/* Items del grupo */}
                                <div className="space-y-0.5">
                                  {group.items.map((item) => {
                                    const ItemWrapper = item.moduleKey ? 
                                      ({ children }: { children: React.ReactNode }) => (
                                        <ModuleWrapper moduleKey={item.moduleKey!}>
                                          {children}
                                        </ModuleWrapper>
                                      ) : 
                                      ({ children }: { children: React.ReactNode }) => <>{children}</>;

                                    return (
                                      <ItemWrapper key={item.title}>
                                        <Link href={item.href} onClick={() => setOpen(false)}>
                                          <Button
                                            variant={isActive(item.href) ? 'secondary' : 'ghost'}
                                            className={cn(
                                              'w-full justify-start text-left h-9 px-3 text-sm',
                                              isActive(item.href) && 'bg-primary/10 text-primary font-medium'
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
                                      </ItemWrapper>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </nav>
                </div>

                {/* Footer con acciones */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2 bg-gray-50 dark:bg-gray-900">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm"
                    onClick={() => setOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Mi Perfil
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm text-red-600 hover:text-red-700 dark:text-red-400"
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
