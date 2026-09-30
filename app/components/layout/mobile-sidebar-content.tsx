'use client';

import React from 'react';
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
    ChevronDown,
    Mail,
    Activity,
    ShieldCheck,
    ShieldAlert,
    Layers,
    Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { useModules } from '@/hooks/use-modules';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { PWAInstaller } from '@/lib/pwa-utils';
import { Wifi, WifiOff, DownloadCloud } from 'lucide-react';

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

interface MobileSidebarContentProps {
    onClose?: () => void;
}

export function MobileSidebarContent({ onClose }: MobileSidebarContentProps) {
    const [expandedCategories, setExpandedCategories] = React.useState<string[]>(['Principal']);
    const [canInstall, setCanInstall] = React.useState(false);
    const [isOnline, setIsOnline] = React.useState(true);
    const installerRef = React.useRef<PWAInstaller | null>(null);
    const pathname = usePathname();
    const { data: session } = useSession() || {};
    const { modules, loading, isModuleEnabled } = useModules();

    const userRole = (session as any)?.user?.role;

    React.useEffect(() => {
        // Check PWA installation status
        installerRef.current = new PWAInstaller();
        const checkInstallable = () => {
            setCanInstall(installerRef.current?.canInstall() || false);
        };

        // Check network status
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('beforeinstallprompt', checkInstallable);

        const timer = setInterval(checkInstallable, 2000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeinstallprompt', checkInstallable);
            clearInterval(timer);
        };
    }, []);

    const handleInstall = async () => {
        if (installerRef.current) {
            const success = await installerRef.current.install();
            if (success) {
                toast.success('¡Gracias por instalar InverPlus!');
                setCanInstall(false);
            }
        }
    };

    const handleSignOut = async () => {
        await signOut({ redirect: true, callbackUrl: '/auth/login' });
        toast.success('Sesión cerrada');
        if (onClose) onClose();
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
        return email ? email[0].toUpperCase() : 'U';
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const getMenusForRole = (): MenuCategory[] => {
        const dashboardHref = (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') ? '/admin/dashboard' :
            userRole === 'ASESOR' ? '/asesor/dashboard' :
                '/cliente/dashboard';

        if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
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
                                { title: 'Gestión de Usuarios', icon: UserPlus, href: '/admin/users', moduleKey: 'user_management' },
                                { title: 'Verificación KYC', icon: ShieldCheck, href: '/admin/kyc', moduleKey: 'user_management' }
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
                                { title: 'No Pago', icon: Receipt, href: '/admin/payments/no-pago', moduleKey: 'loan_list' },
                                { title: 'Penalizaciones', icon: ShieldAlert, href: '/admin/penalties', moduleKey: 'payment_history' },
                                { title: 'Comisiones', icon: Layers, href: '/admin/commissions', moduleKey: 'payment_history' }
                            ]
                        }
                    ]
                },
                {
                    category: 'Reportes & IA',
                    icon: BarChart3,
                    groups: [
                        {
                            title: 'Análisis',
                            items: [
                                { title: 'Dashboard Analítico', icon: BarChart3, href: '/admin/analytics', moduleKey: 'analytics_dashboard' },
                                { title: 'Personalizados', icon: FileText, href: '/admin/reports', moduleKey: 'report_portfolio' },
                                { title: 'Administración IA', icon: RefreshCw, href: '/admin/scoring', moduleKey: 'analytics_dashboard' }
                            ]
                        },
                        {
                            title: 'Cobranza',
                            items: [
                                { title: 'Rutas de Cobranza', icon: Phone, href: '/admin/collections', moduleKey: 'report_collections' }
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
                            title: 'Préstamos',
                            items: [
                                { title: 'Tasas de Interés Semanales', icon: Settings, href: '/admin/weekly-interest-rates', moduleKey: 'loans' }
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
                        },
                        {
                            title: 'Control de Pagos',
                            items: [
                                { title: 'Mis Préstamos', icon: CreditCard, href: '/asesor/loans', moduleKey: 'loan_list' },
                                { title: 'No Pago', icon: Receipt, href: '/admin/payments/no-pago', moduleKey: 'loan_list' }
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
                }
            ];
        }
    };

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

    const categories = getMenusForRole();

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950">
            {/* Header del sidebar móvil */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/10">
                <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150/40 dark:border-slate-800/60 rounded-[1.75rem] gap-4 mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                            <span className="text-xs font-black text-primary">
                                {getInitials(session?.user?.name || '', session?.user?.email || '')}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                {session?.user?.name || 'Usuario'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-wider h-4 px-1.5 py-0">
                                    {getRoleDisplayName(userRole || 'USER')}
                                </Badge>
                                <div className={cn(
                                    "flex items-center gap-1 text-[9px] font-bold px-1.5 py-0 h-4 rounded-full border",
                                    isOnline
                                        ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800"
                                        : "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800"
                                )}>
                                    {isOnline ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                                    {isOnline ? 'Online' : 'Offline'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>

                {canInstall && (
                    <Button
                        onClick={handleInstall}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-none h-10 gap-2 mb-2 animate-bounce-subtle"
                    >
                        <DownloadCloud className="h-4 w-4" />
                        Instalar PWA
                    </Button>
                )}

                <Link href="/download" onClick={onClose}>
                    <Button
                        variant="outline"
                        className="w-full border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl h-10 gap-2 mb-2"
                    >
                        <Smartphone className="h-4 w-4" />
                        Descargar App Nativa
                    </Button>
                </Link>
            </div>

            {/* Navegación por categorías */}
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1.5 px-4">
                    {categories.map((category) => {
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
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-between items-center group px-4 py-4 h-auto font-black text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-2xl transition-all active:scale-[0.98] antialiased"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700/80 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20",
                                                isExpanded && "bg-primary/15 text-primary border-primary/30"
                                            )}>
                                                <CategoryIcon className="h-4 w-4 stroke-[2.2px]" />
                                            </div>
                                            <span className="font-extrabold">{category.category}</span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 opacity-70" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 opacity-70" />
                                        )}
                                    </Button>
                                </CollapsibleTrigger>

                                <CollapsibleContent className="space-y-1 ml-6 mt-1 border-l-2 border-primary/30 dark:border-primary/20 pl-4">
                                    {filteredGroups.map((group) => (
                                         <div key={group.title} className="space-y-1">
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
                                                         <Link href={item.href} onClick={onClose}>
                                                             <Button
                                                                 variant="ghost"
                                                                 className={cn(
                                                                     'w-full justify-start text-left h-11 px-4 text-xs font-bold rounded-xl transition-all duration-200 active:scale-[0.97] group antialiased',
                                                                     isActive(item.href)
                                                                         ? 'bg-primary/15 text-primary font-black shadow-xs border border-primary/25 border-l-2 border-l-primary rounded-l-none pl-3.5'
                                                                         : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-950 dark:hover:text-white hover:translate-x-1 hover:pl-5'
                                                                 )}
                                                             >
                                                                 <item.icon className={cn(
                                                                     "h-4 w-4 mr-3 flex-shrink-0 stroke-[2.2px] transition-transform duration-200 group-hover:scale-110",
                                                                     isActive(item.href) ? "text-primary" : "text-slate-500 dark:text-slate-400 group-hover:text-primary"
                                                                 )} />
                                                                 <span className="truncate flex-1 tracking-tight">{item.title}</span>
                                                                 {item.badge && (
                                                                     <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 h-4 font-black">
                                                                         {item.badge}
                                                                     </Badge>
                                                                 )}
                                                             </Button>
                                                         </Link>
                                                     </ItemWrapper>
                                                 );
                                             })}
                                         </div>
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })}
                </nav>
            </div>

            {/* Footer con acciones */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        className="justify-center h-10 rounded-xl font-bold border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                        asChild
                        onClick={onClose}
                    >
                        <Link href="/profile">
                            <User className="h-4 w-4 mr-2" />
                            Perfil
                        </Link>
                    </Button>

                    <Button
                        variant="outline"
                        className="justify-center h-10 rounded-xl font-bold border-rose-100 dark:border-rose-900/30 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/20"
                        onClick={handleSignOut}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    );
}
