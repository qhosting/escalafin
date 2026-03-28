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
    Mail
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
                toast.success('¡Gracias por instalar EscalaFin!');
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
                                { title: 'No Pago', icon: Receipt, href: '/admin/payments/no-pago', moduleKey: 'loan_list' }
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
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Header del sidebar móvil */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-primary/5">
                <div className="flex items-center justify-between mb-4">
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
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0">
                                    {getRoleDisplayName(userRole || 'USER')}
                                </Badge>
                                <div className={cn(
                                    "flex items-center gap-1 text-[9px] font-medium px-1.5 py-0 h-4 rounded-full border",
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
                        Instalar Aplicación
                    </Button>
                )}
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
                                        className="w-full justify-between items-center group px-4 py-4 h-auto font-bold text-base text-gray-800 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-2xl transition-all active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-xl bg-gray-100 dark:bg-gray-800 transition-colors group-hover:bg-primary/10 group-hover:text-primary",
                                                isExpanded && "bg-primary/10 text-primary"
                                            )}>
                                                <CategoryIcon className="h-4 w-4" />
                                            </div>
                                            <span>{category.category}</span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 opacity-50" />
                                        )}
                                    </Button>
                                </CollapsibleTrigger>

                                <CollapsibleContent className="space-y-1 ml-6 mt-1 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
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
                                                                variant={isActive(item.href) ? 'secondary' : 'ghost'}
                                                                className={cn(
                                                                    'w-full justify-start text-left h-12 px-4 text-sm font-semibold rounded-xl transition-all active:scale-[0.98]',
                                                                    isActive(item.href) && 'bg-primary/15 text-primary font-bold shadow-sm border border-primary/20'
                                                                )}
                                                            >
                                                                <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                                                                <span className="truncate flex-1">{item.title}</span>
                                                                {item.badge && (
                                                                    <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 h-4">
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
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        className="justify-center h-11 rounded-2xl"
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
                        className="justify-center h-11 rounded-2xl border-red-100 dark:border-red-900/30 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
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
