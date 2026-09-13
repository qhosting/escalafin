'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  FolderOpen,
  Building2,
  ShieldCheck,
  Activity,
  ChevronDown,
  HelpCircle,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useModules } from '@/hooks/use-modules';
import { useTenant } from '@/components/providers/tenant-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface NavigationSubItem {
  title: string;
  href: string;
  icon?: any;
  moduleKey?: string;
  badge?: string;
}

export interface NavigationSectionItem {
  title: string;
  icon: any;
  href?: string;
  moduleKey?: string;
  badge?: string;
  items?: NavigationSubItem[];
}

export interface SidebarCategory {
  title: string;
  items: NavigationSectionItem[];
}

interface DesktopSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function DesktopSidebar({ collapsed, onToggle, className }: DesktopSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const { isModuleEnabled } = useModules();
  const { tenant } = useTenant();

  const userRole = (session as any)?.user?.role;

  // Estado para acordeones abiertos
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  const isSectionActive = (item: NavigationSectionItem) => {
    if (item.href && isActive(item.href)) return true;
    if (item.items?.some(sub => isActive(sub.href))) return true;
    return false;
  };

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const getDashboardHref = () => {
    switch (userRole) {
      case 'SUPER_ADMIN': return '/admin/saas';
      case 'ADMIN': return '/admin/dashboard';
      case 'ASESOR': return '/asesor/dashboard';
      case 'CLIENTE': return '/cliente/dashboard';
      default: return '/';
    }
  };

  const getCategoriesForRole = (): SidebarCategory[] => {
    if (userRole === 'SUPER_ADMIN') {
      return [
        {
          title: 'Ecosistema SaaS',
          items: [
            {
              title: 'Command Center',
              icon: Activity,
              href: '/admin/saas'
            },
            {
              title: 'Organizaciones',
              icon: Building2,
              href: '/admin/saas/tenants'
            },
            {
              title: 'Planes & Facturación',
              icon: CreditCard,
              href: '/admin/billing'
            },
            {
              title: 'Auditoría Global',
              icon: ClipboardList,
              href: '/admin/audit'
            },
            {
              title: 'Seguridad WAF',
              icon: ShieldCheck,
              href: '/admin/saas/security'
            },
            {
              title: 'Super Administradores',
              icon: Users,
              href: '/admin/super-users'
            }
          ]
        }
      ];
    }

    if (userRole === 'ADMIN') {
      return [
        {
          title: 'Catálogo & Personas',
          items: [
            {
              title: 'Clientes',
              icon: Users,
              items: [
                { title: 'Lista de Clientes', href: '/admin/clients', moduleKey: 'client_list' },
                { title: 'Nuevo Cliente', href: '/admin/clients/new', moduleKey: 'client_list' }
              ]
            },
            {
              title: 'Equipo & Accesos',
              icon: UserPlus,
              items: [
                { title: 'Gestión de Usuarios', href: '/admin/users', moduleKey: 'user_management' },
                { title: 'Verificación KYC', href: '/admin/kyc', moduleKey: 'user_management' }
              ]
            }
          ]
        },
        {
          title: 'Operaciones de Crédito',
          items: [
            {
              title: 'Préstamos',
              icon: CreditCard,
              items: [
                { title: 'Cartera Activa', href: '/admin/loans', moduleKey: 'loan_list' },
                { title: 'Solicitudes de Crédito', href: '/admin/credit-applications', moduleKey: 'credit_workflow' }
              ]
            },
            {
              title: 'Cobranza & Pagos',
              icon: DollarSign,
              items: [
                { title: 'Historial de Pagos', href: '/admin/payments', moduleKey: 'payment_history' },
                { title: 'Transacciones', href: '/admin/payments/transactions', moduleKey: 'payment_history' },
                { title: 'No Pago', href: '/admin/payments/no-pago', moduleKey: 'loan_list' },
                { title: 'Penalizaciones', href: '/admin/penalties', moduleKey: 'payment_history' },
                { title: 'Comisiones', href: '/admin/commissions', moduleKey: 'payment_history', badge: 'v3.5' }
              ]
            }
          ]
        },
        {
          title: 'Inteligencia & Reportes',
          items: [
            {
              title: 'Analytics & IA',
              icon: BarChart3,
              items: [
                { title: 'Dashboard Analítico', href: '/admin/analytics', moduleKey: 'analytics_dashboard' },
                { title: 'Reportes Personalizados', href: '/admin/reports', moduleKey: 'report_portfolio' },
                { title: 'Rutas Predictivas IA', href: '/admin/collections', moduleKey: 'report_collections', badge: 'AI' },
                { title: 'Scoring Predictivo', href: '/admin/scoring', moduleKey: 'analytics_dashboard' }
              ]
            },
            {
              title: 'Bóveda Documental',
              icon: FolderOpen,
              items: [
                { title: 'Gestión de Archivos', href: '/admin/files', moduleKey: 'file_management' },
                { title: 'Google Drive', href: '/admin/storage', moduleKey: 'file_management' }
              ]
            }
          ]
        },
        {
          title: 'Canales & Difusión',
          items: [
            {
              title: 'WhatsApp Business',
              icon: MessageSquare,
              items: [
                { title: 'Chat Center', href: '/admin/whatsapp', moduleKey: 'whatsapp_notifications' },
                { title: 'Bolsa de Recargas', href: '/admin/message-recharges', moduleKey: 'whatsapp_notifications' }
              ]
            },
            {
              title: 'SMS & Alertas',
              icon: Phone,
              items: [
                { title: 'LabsMobile SMS', href: '/admin/sms', moduleKey: 'labsmobile_sms' },
                { title: 'Plantillas de Notificación', href: '/admin/message-templates', moduleKey: 'notifications_templates' },
                { title: 'Centro de Alertas', href: '/notifications', moduleKey: 'notifications_inapp' }
              ]
            }
          ]
        },
        {
          title: 'Configuración & Sistema',
          items: [
            {
              title: 'Ajustes de Plataforma',
              icon: Settings,
              items: [
                { title: 'Configuración General', href: '/admin/config', moduleKey: 'system_settings' },
                { title: 'Personalización de Tema', href: '/admin/config/theme', moduleKey: 'system_settings' },
                { title: 'Tasas de Interés', href: '/admin/weekly-interest-rates', moduleKey: 'loans' },
                { title: 'Módulos PWA', href: '/admin/modules', moduleKey: 'system_settings' },
                { title: 'Descarga App Oficial', href: '/admin/download-app' }
              ]
            },
            {
              title: 'Auditoría & Cumplimiento',
              icon: ShieldCheck,
              href: '/admin/audit'
            }
          ]
        }
      ];
    }

    if (userRole === 'ASESOR') {
      return [
        {
          title: 'Operación en Campo',
          items: [
            {
              title: 'Clientes',
              icon: Users,
              items: [
                { title: 'Mis Clientes Asignados', href: '/asesor/clients', moduleKey: 'client_list' },
                { title: 'Registrar Nuevo Cliente', href: '/admin/clients/new', moduleKey: 'client_list' }
              ]
            },
            {
              title: 'Créditos & Rutas',
              icon: CreditCard,
              items: [
                { title: 'Mis Préstamos', href: '/asesor/loans', moduleKey: 'loan_list' },
                { title: 'Solicitudes en Trámite', href: '/asesor/credit-applications', moduleKey: 'credit_workflow' },
                { title: 'Ruta del Día GPS', href: '/mobile/asesor/route', moduleKey: 'collection_mobile', badge: 'GPS' },
                { title: 'Registrar Visita / Pago', href: '/mobile/visits/new', moduleKey: 'collection_mobile' }
              ]
            },
            {
              title: 'Herramientas',
              icon: Sparkles,
              items: [
                { title: 'Simulador de Crédito', href: '/pwa/asesor/simulator' },
                { title: 'Historial de Pagos', href: '/admin/payments', moduleKey: 'payment_history' },
                { title: 'Mis Comisiones', href: '/admin/commissions', moduleKey: 'payment_history' }
              ]
            }
          ]
        }
      ];
    }

    // CLIENTE
    return [
      {
        title: 'Mis Finanzas',
        items: [
          {
            title: 'Mis Préstamos Activos',
            icon: CreditCard,
            href: '/cliente/loans',
            moduleKey: 'loan_list'
          },
          {
            title: 'Solicitar Nuevo Crédito',
            icon: ClipboardList,
            href: '/cliente/credit-applications',
            moduleKey: 'credit_workflow'
          },
          {
            title: 'Historial de Pagos',
            icon: DollarSign,
            href: '/cliente/payments',
            moduleKey: 'payment_history'
          },
          {
            title: 'Bóveda de Documentos',
            icon: FolderOpen,
            href: '/admin/files',
            moduleKey: 'file_management'
          }
        ]
      }
    ];
  };

  const categories = getCategoriesForRole();

  // Auto-expand active category
  useEffect(() => {
    const updated: Record<string, boolean> = { ...openSections };
    categories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.items && isSectionActive(item)) {
          updated[item.title] = true;
        }
      });
    });
    setOpenSections(updated);
  }, [pathname, userRole]);

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen hidden md:flex flex-col",
          "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
          "transition-all duration-300 ease-in-out select-none shadow-sm",
          collapsed ? "w-[68px]" : "w-64",
          className
        )}
      >
        {/* Header del Sidebar */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <Link
            href={getDashboardHref()}
            className={cn(
              "flex items-center gap-2.5 overflow-hidden transition-opacity hover:opacity-90",
              collapsed && "justify-center w-full"
            )}
          >
            {collapsed ? (
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="font-black text-primary text-sm tracking-tight">EF</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <Image
                  src={(tenant as any)?.logo || "/logoescalafin.png"}
                  alt="Logo"
                  width={120}
                  height={28}
                  className="h-7 w-auto object-contain max-w-[120px]"
                  priority
                />
              </div>
            )}
          </Link>

          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg"
              onClick={onToggle}
              title="Colapsar menú lateral"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Botón rápido Dashboard Principal */}
        <div className="p-2 border-b border-gray-100 dark:border-gray-800/80">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={getDashboardHref()} className="block">
                  <Button
                    variant={isActive(getDashboardHref()) ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "w-full h-9 rounded-lg transition-all duration-200",
                      isActive(getDashboardHref())
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium text-xs">
                Dashboard Principal
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link href={getDashboardHref()} className="block">
              <Button
                variant={isActive(getDashboardHref()) ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2.5 h-9 rounded-lg transition-all duration-200 font-medium text-xs",
                  isActive(getDashboardHref())
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span className="truncate">Dashboard</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Lista de Navegación con Scroll Independiente */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          {categories.map((category, catIdx) => {
            // Filtrar items por módulos
            const visibleItems = category.items.filter(item => {
              if (item.moduleKey && !isModuleEnabled(item.moduleKey)) return false;
              if (item.items) {
                const subVisible = item.items.filter(sub => !sub.moduleKey || isModuleEnabled(sub.moduleKey));
                return subVisible.length > 0;
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={category.title || catIdx} className="space-y-0.5">
                {/* Título de Categoría (solo expandido) */}
                {!collapsed && (
                  <p className="px-2.5 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {category.title}
                  </p>
                )}

                {/* Separador sutil en colapsado */}
                {collapsed && catIdx > 0 && (
                  <div className="w-6 mx-auto my-1.5 border-t border-gray-200 dark:border-gray-800" />
                )}

                {visibleItems.map(item => {
                  const hasSubItems = Boolean(item.items && item.items.length > 0);
                  const activeSection = isSectionActive(item);
                  const isOpen = openSections[item.title] ?? activeSection;

                  // 1. MODO COLAPSADO
                  if (collapsed) {
                    if (hasSubItems) {
                      return (
                        <Tooltip key={item.title}>
                          <TooltipTrigger asChild>
                            <Link href={item.items![0].href} className="block">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "w-full h-9 rounded-lg transition-all duration-200 relative",
                                  activeSection
                                    ? "bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary-foreground font-semibold"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {activeSection && (
                                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                                )}
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="p-2 space-y-1 min-w-[170px]">
                            <p className="font-semibold text-xs text-foreground px-2 py-0.5 border-b border-border/40">
                              {item.title}
                            </p>
                            <div className="pt-1 flex flex-col gap-0.5">
                              {item.items!.map(sub => (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  className={cn(
                                    "px-2 py-1 rounded text-xs transition-colors flex items-center justify-between",
                                    isActive(sub.href)
                                      ? "bg-primary/15 text-primary font-medium"
                                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  <span>{sub.title}</span>
                                  {sub.badge && (
                                    <span className="text-[10px] px-1 bg-primary/20 text-primary rounded font-bold">
                                      {sub.badge}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <Tooltip key={item.title}>
                        <TooltipTrigger asChild>
                          <Link href={item.href || '#'} className="block">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "w-full h-9 rounded-lg transition-all duration-200 relative",
                                isActive(item.href)
                                  ? "bg-primary/15 text-primary font-semibold"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                              )}
                            >
                              <item.icon className="h-4 w-4 shrink-0" />
                              {isActive(item.href) && (
                                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                              )}
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium text-xs">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  // 2. MODO EXPANDIDO
                  if (hasSubItems) {
                    return (
                      <Collapsible
                        key={item.title}
                        open={isOpen}
                        onOpenChange={() => toggleSection(item.title)}
                        className="space-y-0.5"
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-between gap-2 h-8 px-2.5 rounded-lg font-medium text-xs transition-all duration-150",
                              activeSection
                                ? "text-primary dark:text-primary font-semibold bg-primary/10"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <item.icon className={cn("h-4 w-4 shrink-0", activeSection ? "text-primary" : "text-gray-400")} />
                              <span className="truncate">{item.title}</span>
                            </div>
                            <ChevronDown
                              className={cn(
                                "h-3 w-3 shrink-0 text-gray-400 transition-transform duration-200",
                                isOpen && "rotate-180 text-gray-600 dark:text-gray-200"
                              )}
                            />
                          </Button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="pl-4 pr-1 py-0.5 space-y-0.5 border-l border-gray-200 dark:border-gray-800 ml-3.5">
                          {item.items!.map(sub => {
                            const activeSub = isActive(sub.href);
                            return (
                              <Link key={sub.href} href={sub.href} className="block">
                                <div
                                  className={cn(
                                    "flex items-center justify-between px-2 py-1 rounded-md text-xs transition-all duration-150",
                                    activeSub
                                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60 font-normal"
                                  )}
                                >
                                  <span className="truncate">{sub.title}</span>
                                  {sub.badge && (
                                    <Badge
                                      variant={activeSub ? "secondary" : "outline"}
                                      className="text-[9px] px-1 py-0 h-3.5 ml-1 font-bold"
                                    >
                                      {sub.badge}
                                    </Badge>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  }

                  // Item sin sub-items en modo expandido
                  const activeDirect = isActive(item.href);
                  return (
                    <Link key={item.title} href={item.href || '#'} className="block">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-between gap-2 h-8 px-2.5 rounded-lg font-medium text-xs transition-all duration-150",
                          activeDirect
                            ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <item.icon className={cn("h-4 w-4 shrink-0", activeDirect ? "text-primary-foreground" : "text-gray-400")} />
                          <span className="truncate">{item.title}</span>
                        </div>
                        {item.badge && (
                          <Badge variant={activeDirect ? "secondary" : "outline"} className="text-[9px] px-1 h-3.5">
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer del Sidebar */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col gap-1">
          {/* Soporte */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/soporte" className="block">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full h-8 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium text-xs">
                Mesa de Ayuda / Soporte
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link href="/soporte" className="block">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-8 px-2 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span className="truncate">Soporte y Ayuda</span>
              </Button>
            </Link>
          )}

          {/* Toggle Expandir (cuando está colapsado) */}
          {collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-8 rounded-lg text-primary hover:bg-primary/10"
                  onClick={onToggle}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium text-xs">
                Expandir barra lateral
              </TooltipContent>
            </Tooltip>
          )}

          {/* Versión e Indicador */}
          {!collapsed && (
            <div className="flex items-center justify-between px-2 pt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
              <span className="font-medium">EscalaFin OS</span>
              <span className="font-mono text-[9px] bg-gray-200 dark:bg-gray-800 px-1 py-0.2 rounded text-gray-600 dark:text-gray-400">
                v3.5.0
              </span>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
