'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  Search,
  Bell,
  PanelLeft,
  User,
  LogOut,
  ChevronRight,
  Building2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { GlobalSearch } from './global-search';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useTenant } from '@/components/providers/tenant-provider';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TopHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

// Diccionario semántico de traducción para Breadcrumbs
const ROUTE_LABELS: Record<string, string> = {
  admin: 'Admin',
  saas: 'SaaS Center',
  tenants: 'Organizaciones',
  billing: 'Facturación',
  audit: 'Auditoría',
  security: 'Seguridad',
  'super-users': 'Super Admins',
  dashboard: 'Dashboard',
  clients: 'Clientes',
  new: 'Nuevo',
  edit: 'Editar',
  users: 'Usuarios',
  kyc: 'Verificación KYC',
  loans: 'Préstamos',
  'credit-applications': 'Solicitudes de Crédito',
  payments: 'Pagos',
  transactions: 'Transacciones',
  'no-pago': 'No Pago',
  penalties: 'Penalizaciones',
  commissions: 'Comisiones',
  analytics: 'Analítica',
  reports: 'Reportes',
  scoring: 'Scoring Predictivo',
  collections: 'Rutas de Cobranza',
  files: 'Archivos',
  storage: 'Google Drive',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  'message-recharges': 'Recargas',
  'message-templates': 'Plantillas',
  config: 'Configuración',
  theme: 'Temas',
  modules: 'Módulos PWA',
  'weekly-interest-rates': 'Tasas Semanales',
  'download-app': 'Descargar App',
  notifications: 'Notificaciones',
  profile: 'Mi Perfil',
  soporte: 'Soporte Técnico',
  asesor: 'Asesor',
  cliente: 'Portal Cliente',
  simulator: 'Simulador'
};

export function TopHeader({ collapsed, onToggle, className }: TopHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const { tenant } = useTenant();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const userRole = (session as any)?.user?.role;

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
    toast.success('Sesión finalizada');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN': return 'Administrador';
      case 'ASESOR': return 'Asesor';
      case 'CLIENTE': return 'Cliente';
      default: return role;
    }
  };

  const getInitials = (name: string, email: string) => {
    if (name && name.length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return (email ? email.slice(0, 2) : 'US').toUpperCase();
  };

  // Generación dinámica de breadcrumbs
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    const isLast = index === pathSegments.length - 1;
    return { segment, url, label, isLast };
  });

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-14 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md",
        "border-b border-gray-200 dark:border-gray-800",
        "flex items-center justify-between px-4 transition-all duration-300",
        className
      )}
    >
      {/* Sección Izquierda: Toggle de Sidebar + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg shrink-0"
          onClick={onToggle}
          title={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 shrink-0" />

        {/* Breadcrumbs de Navegación */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          <Link
            href="/"
            className="hover:text-foreground transition-colors font-medium text-gray-500 dark:text-gray-400"
          >
            EscalaFin
          </Link>
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.url}>
              <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" />
              {crumb.isLast ? (
                <span className="font-semibold text-foreground truncate max-w-[150px] md:max-w-[220px]">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.url}
                  className="hover:text-foreground transition-colors truncate max-w-[120px]"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Sección Derecha: Herramientas Globales y Perfil */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Buscador Global (Atajo Ctrl+K) */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 gap-2 border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 text-gray-500 hover:text-foreground rounded-lg"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline text-xs font-normal">Buscar...</span>
          <kbd className="hidden lg:inline-flex h-4 select-none items-center gap-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-1 font-mono text-[9px] font-semibold text-gray-500">
            <span>⌘</span>K
          </kbd>
        </Button>

        <GlobalSearch isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />

        {/* Badge de Organización / Tenant si aplica */}
        {tenant && (tenant as any).slug !== 'default-tenant' && (
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
            <Building2 className="h-3 w-3" />
            <span className="truncate max-w-[110px]">{tenant.name}</span>
          </div>
        )}

        {/* Toggle Modo Oscuro / Claro */}
        <ThemeToggle />

        {/* Notificaciones */}
        <ModuleWrapper moduleKey="notifications_inapp">
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg relative"
              title="Centro de notificaciones"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </Link>
        </ModuleWrapper>

        {/* Menú de Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 ring-1 ring-border/50">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                  {getInitials(session?.user?.name || '', session?.user?.email || '')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-60" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold leading-none truncate max-w-[140px]">
                    {session?.user?.name || 'Usuario'}
                  </p>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    {getRoleDisplayName(userRole || 'USER')}
                  </Badge>
                </div>
                <p className="text-[11px] leading-none text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer text-xs" asChild>
              <Link href="/profile" className="flex items-center w-full">
                <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Mi Perfil</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer text-xs text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
