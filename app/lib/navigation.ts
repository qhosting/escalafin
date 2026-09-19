/**
 * lib/navigation.ts — Fuente única del árbol de navegación.
 *
 * Antes el árbol estaba escrito a mano tres veces (desktop-navbar,
 * mobile-sidebar-content y bottom-navbar) y había divergido: 11 rutas de
 * administración existían solo en el menú de escritorio, y el menú móvil de
 * CLIENTE no ofrecía ni préstamos ni pagos. Todo consumidor de navegación debe
 * leer de aquí.
 */

import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  FolderOpen,
  Globe,
  HardDrive,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PiggyBank,
  Receipt,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  Wrench,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'ASESOR' | 'CLIENTE';

export interface NavItem {
  title: string;
  icon: LucideIcon;
  href: string;
  /** Si está presente, el item solo se muestra cuando el módulo está habilitado. */
  moduleKey?: string;
  badge?: string;
  /**
   * Marca los 4 destinos que aparecen en la barra inferior móvil.
   * Debe haber exactamente 4 por rol para que la barra quede equilibrada.
   */
  primary?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface NavSection {
  title: string;
  icon: LucideIcon;
  groups: NavGroup[];
}

/** Destino del enlace "Dashboard" según el rol. */
export function getDashboardHref(role?: string | null): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/saas';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'ASESOR':
      return '/asesor/dashboard';
    default:
      return '/cliente/dashboard';
  }
}

const SOPORTE_SECTION: NavSection = {
  title: 'Ayuda',
  icon: HelpCircle,
  groups: [
    {
      title: 'Soporte',
      items: [{ title: 'Centro de Soporte', icon: HelpCircle, href: '/soporte' }],
    },
  ],
};

const SUPER_ADMIN_NAV: NavSection[] = [
  {
    title: 'SaaS Platform',
    icon: Building2,
    groups: [
      {
        title: 'Ecosistema',
        items: [
          { title: 'Command Center', icon: Activity, href: '/admin/saas', primary: true },
          { title: 'Organizaciones', icon: Building2, href: '/admin/saas/tenants', primary: true },
        ],
      },
      {
        title: 'Billing & Scale',
        items: [
          { title: 'Planes & Billing', icon: CreditCard, href: '/admin/billing', primary: true },
          { title: 'Audit Global', icon: ClipboardList, href: '/admin/audit' },
        ],
      },
      {
        title: 'Seguridad',
        items: [{ title: 'WAF Firewall', icon: ShieldCheck, href: '/admin/saas/security' }],
      },
    ],
  },
  {
    title: 'Operaciones',
    icon: ShieldCheck,
    groups: [
      {
        title: 'Usuarios Globales',
        items: [
          { title: 'Super Admins', icon: ShieldCheck, href: '/admin/super-users', primary: true },
          { title: 'Modo Móvil', icon: Smartphone, href: '#modo-movil', badge: 'Simulador' },
        ],
      },
    ],
  },
  SOPORTE_SECTION,
];

const ADMIN_NAV: NavSection[] = [
  {
    title: 'Catálogo',
    icon: Users,
    groups: [
      {
        title: 'Clientes',
        items: [
          { title: 'Lista de Clientes', icon: Users, href: '/admin/clients', moduleKey: 'client_list', primary: true },
          { title: 'Nuevo Cliente', icon: UserPlus, href: '/admin/clients/new', moduleKey: 'client_list' },
        ],
      },
      {
        title: 'Usuarios',
        items: [
          { title: 'Gestión de Usuarios', icon: UserPlus, href: '/admin/users', moduleKey: 'user_management' },
          { title: 'Verificación KYC', icon: ShieldCheck, href: '/admin/kyc', moduleKey: 'user_management' },
        ],
      },
    ],
  },
  {
    title: 'Operaciones',
    icon: CreditCard,
    groups: [
      {
        title: 'Préstamos',
        items: [
          { title: 'Lista de Préstamos', icon: CreditCard, href: '/admin/loans', moduleKey: 'loan_list', primary: true },
          { title: 'Solicitudes de Crédito', icon: ClipboardList, href: '/admin/credit-applications', moduleKey: 'credit_workflow' },
        ],
      },
      {
        title: 'Pagos',
        items: [
          { title: 'Historial de Pagos', icon: DollarSign, href: '/admin/payments', moduleKey: 'payment_history', primary: true },
          { title: 'Transacciones', icon: Receipt, href: '/admin/payments/transactions', moduleKey: 'payment_history' },
          { title: 'No Pago', icon: Activity, href: '/admin/payments/no-pago', moduleKey: 'loan_list' },
          { title: 'Penalizaciones', icon: ShieldCheck, href: '/admin/penalties', moduleKey: 'payment_history' },
          { title: 'Comisiones', icon: Layers, href: '/admin/commissions', moduleKey: 'payment_history' },
        ],
      },
    ],
  },
  {
    title: 'Reportes',
    icon: BarChart3,
    groups: [
      {
        title: 'Análisis',
        items: [
          { title: 'Dashboard Analítico', icon: BarChart3, href: '/admin/analytics', moduleKey: 'analytics_dashboard' },
          { title: 'Personalizados', icon: FileText, href: '/admin/reports', moduleKey: 'report_portfolio' },
          { title: 'Administración IA', icon: RefreshCw, href: '/admin/scoring', moduleKey: 'analytics_dashboard' },
        ],
      },
      {
        title: 'Cobranza',
        items: [
          { title: 'Rutas de Cobranza', icon: Phone, href: '/admin/collections', moduleKey: 'report_collections' },
        ],
      },
      {
        title: 'Documentos',
        items: [
          { title: 'Gestión de Archivos', icon: FolderOpen, href: '/admin/files', moduleKey: 'file_management' },
          { title: 'Google Drive', icon: HardDrive, href: '/admin/storage', moduleKey: 'file_management' },
        ],
      },
    ],
  },
  {
    title: 'Comunicación',
    icon: MessageSquare,
    groups: [
      {
        title: 'WhatsApp',
        items: [
          { title: 'Chat Center', icon: MessageSquare, href: '/admin/whatsapp', moduleKey: 'whatsapp_notifications' },
          { title: 'Recargas', icon: RefreshCw, href: '/admin/message-recharges', moduleKey: 'whatsapp_notifications' },
        ],
      },
      {
        title: 'SMS',
        items: [{ title: 'LabsMobile', icon: Phone, href: '/admin/sms', moduleKey: 'labsmobile_sms' }],
      },
      {
        title: 'Notificaciones',
        items: [
          { title: 'Centro de Notificaciones', icon: Bell, href: '/notifications', moduleKey: 'notifications_inapp' },
          { title: 'Plantillas de Mensajes', icon: Mail, href: '/admin/message-templates', moduleKey: 'notifications_templates' },
        ],
      },
    ],
  },
  {
    title: 'Configuración',
    icon: Settings,
    groups: [
      {
        title: 'Sistema',
        items: [
          { title: 'Configuración General', icon: Settings, href: '/admin/config', moduleKey: 'system_settings' },
          { title: 'Módulos PWA', icon: Layers, href: '/admin/modules', moduleKey: 'system_settings' },
          { title: 'Parámetros', icon: Wrench, href: '/admin/settings', moduleKey: 'system_settings' },
        ],
      },
      {
        title: 'Préstamos',
        items: [
          { title: 'Tasas de Interés Semanales', icon: Settings, href: '/admin/weekly-interest-rates', moduleKey: 'loans' },
        ],
      },
      {
        title: 'Integraciones',
        items: [
          { title: 'APIs Externas', icon: Globe, href: '/admin/whatsapp/config', moduleKey: 'api_integration' },
        ],
      },
      {
        title: 'Herramientas',
        items: [
          { title: 'Modo Móvil', icon: Smartphone, href: '#modo-movil', badge: 'Simulador' },
        ],
      },
    ],
  },
  SOPORTE_SECTION,
];

const ASESOR_NAV: NavSection[] = [
  {
    title: 'Catálogo',
    icon: Users,
    groups: [
      {
        title: 'Clientes',
        items: [
          { title: 'Mis Clientes', icon: Users, href: '/asesor/clients', moduleKey: 'client_list', primary: true },
        ],
      },
    ],
  },
  {
    title: 'Operaciones',
    icon: CreditCard,
    groups: [
      {
        title: 'Préstamos',
        items: [
          { title: 'Mis Préstamos', icon: CreditCard, href: '/asesor/loans', moduleKey: 'loan_list', primary: true },
          { title: 'Solicitudes de Crédito', icon: ClipboardList, href: '/asesor/credit-applications', moduleKey: 'credit_workflow' },
          { title: 'Simulador de Crédito', icon: PiggyBank, href: '/asesor/simulator', moduleKey: 'loan_list' },
        ],
      },
      {
        title: 'Pagos',
        items: [
          { title: 'Historial de Pagos', icon: DollarSign, href: '/asesor/payments', moduleKey: 'payment_history', primary: true },
        ],
      },
    ],
  },
  {
    title: 'Reportes',
    icon: BarChart3,
    groups: [
      {
        title: 'Análisis',
        items: [{ title: 'Mis Métricas', icon: BarChart3, href: '/asesor/dashboard' }],
      },
      {
        title: 'Cobranza',
        items: [
          { title: 'Mi Ruta del Día', icon: MapPin, href: '/asesor/routes', moduleKey: 'collection_mobile' },
          { title: 'Cobranza Móvil', icon: Phone, href: '/mobile/cobranza', moduleKey: 'collection_mobile' },
        ],
      },
    ],
  },
  SOPORTE_SECTION,
];

const CLIENTE_NAV: NavSection[] = [
  {
    title: 'Mis Finanzas',
    icon: CreditCard,
    groups: [
      {
        title: 'Préstamos',
        items: [
          { title: 'Mis Préstamos Activos', icon: CreditCard, href: '/cliente/loans', moduleKey: 'loan_list', primary: true },
          { title: 'Nueva Solicitud', icon: ClipboardList, href: '/cliente/credit-applications', moduleKey: 'credit_workflow', primary: true },
        ],
      },
      {
        title: 'Pagos',
        items: [
          { title: 'Pagos y Recibos', icon: DollarSign, href: '/cliente/payments', moduleKey: 'payment_history', primary: true },
        ],
      },
    ],
  },
  {
    title: 'Documentos',
    icon: FolderOpen,
    groups: [
      {
        title: 'Archivos',
        items: [{ title: 'Mis Documentos', icon: FolderOpen, href: '/cliente/documents', moduleKey: 'file_management' }],
      },
    ],
  },
  SOPORTE_SECTION,
];

/** Árbol completo de navegación para un rol, sin filtrar por módulos. */
export function getNavigation(role?: string | null): NavSection[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return SUPER_ADMIN_NAV;
    case 'ADMIN':
      return ADMIN_NAV;
    case 'ASESOR':
      return ASESOR_NAV;
    case 'CLIENTE':
      return CLIENTE_NAV;
    default:
      return [];
  }
}

/**
 * Poda el árbol dejando solo lo que el usuario puede ver.
 * Los grupos y secciones que quedan vacíos se eliminan, de modo que nunca
 * aparece un encabezado sin destinos debajo.
 */
export function filterNavigation(
  sections: NavSection[],
  isModuleEnabled: (moduleKey: string) => boolean
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      groups: section.groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => !item.moduleKey || isModuleEnabled(item.moduleKey)),
        }))
        .filter((group) => group.items.length > 0),
    }))
    .filter((section) => section.groups.length > 0);
}

/**
 * Los 4 destinos de la barra inferior móvil: Dashboard más los items marcados
 * como `primary`. Se derivan del mismo árbol para que la barra no pueda
 * apuntar a rutas que el menú ya no ofrece.
 */
export function getPrimaryNavItems(
  role: string | null | undefined,
  isModuleEnabled: (moduleKey: string) => boolean
): NavItem[] {
  const dashboard: NavItem = {
    title: role === 'CLIENTE' ? 'Mi Panel' : 'Inicio',
    icon: LayoutDashboard,
    href: getDashboardHref(role),
  };

  const primary = filterNavigation(getNavigation(role), isModuleEnabled)
    .flatMap((section) => section.groups)
    .flatMap((group) => group.items)
    .filter((item) => item.primary);

  return [dashboard, ...primary.filter(item => item.href !== dashboard.href)].slice(0, 4);
}

/** Coincidencia de ruta activa, tolerante a subrutas. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Only the most specific destination is marked current on nested routes. */
export function getActiveNavHref(pathname: string, sections: NavSection[]): string | undefined {
  return sections.flatMap(s => s.groups).flatMap(g => g.items)
    .filter(item => isNavItemActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
