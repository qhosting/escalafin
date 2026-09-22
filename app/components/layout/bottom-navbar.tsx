'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    DollarSign,
    Menu,
    ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useModules } from '@/hooks/use-modules';
import { getPrimaryNavItems } from '@/lib/navigation';
import { SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { MobileSidebarContent } from './mobile-sidebar-content';

export function BottomNavbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const { isModuleEnabled } = useModules();
    if (!session) return null;

    const userRole = (session as any)?.user?.role;

    // Cerrar menú al cambiar de ruta
    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    const shortLabels: Record<string, string> = { '/admin/clients': 'Clientes', '/admin/loans': 'Préstamos', '/admin/payments': 'Pagos', '/asesor/clients': 'Clientes', '/asesor/loans': 'Préstamos', '/asesor/payments': 'Pagos', '/cliente/loans': 'Créditos', '/cliente/payments': 'Pagos', '/cliente/credit-applications': 'Solicitud', '/admin/saas': 'Inicio', '/admin/saas/tenants': 'Empresas', '/admin/billing': 'Planes', '/admin/super-users': 'Equipo' };
    const navItems = getPrimaryNavItems(userRole, isModuleEnabled).map(item => ({ ...item, label: shortLabels[item.href] || 'Inicio', color: 'bg-primary' }));

    const isActive = (href: string) => {
        if (href === '/' || href.includes('dashboard')) {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <>
            <div className={cn(
                "md:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-[100] transition-all duration-300",
                isMenuOpen ? "opacity-0 pointer-events-none translate-y-3" : "opacity-100 translate-y-0 animate-in slide-in-from-bottom-5 duration-700"
            )}>
                {/* Cápsula Flotante FinTech Glass */}
                <div className="bg-white/95 dark:bg-[#030914]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] px-2 py-1.5">
                    <div className="flex items-center justify-between h-14 relative">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    href={item.href}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300",
                                        active ? "scale-105" : "opacity-75 hover:opacity-100"
                                    )}
                                >
                                    {/* Barra luminosa superior con ping activo */}
                                    {active && (
                                        <div className="absolute -top-1.5 flex items-center justify-center">
                                            <div className="w-8 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 rounded-b-full shadow-[0_3px_10px_rgba(0,180,216,0.8)]" />
                                            <div className="absolute w-8 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 rounded-b-full animate-ping opacity-35" />
                                        </div>
                                    )}

                                    <div className={cn(
                                        "p-2 rounded-2xl transition-all duration-300 relative ef-sidebar-icon-morph",
                                        active 
                                            ? "bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-emerald-500/20 text-cyan-600 dark:text-cyan-400 shadow-xs" 
                                            : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                                    )}>
                                        <Icon className={cn(
                                            "h-5 w-5 transition-transform",
                                            active 
                                                ? "text-cyan-600 dark:text-cyan-300 scale-110 stroke-[2.5px] drop-shadow-[0_0_6px_rgba(0,180,216,0.5)]" 
                                                : "stroke-2"
                                        )} />
                                    </div>
                                    
                                    {/* Etiqueta de texto micro-trackeada */}
                                    <span className={cn(
                                        "text-[8.5px] font-black uppercase tracking-tight mt-0.5 transition-all duration-300 whitespace-nowrap text-center leading-none",
                                        active ? "text-cyan-700 dark:text-cyan-300 font-black" : "text-slate-400 dark:text-slate-500"
                                    )}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}

                        {/* Divisor vertical */}
                        <div className="w-px h-7 bg-slate-200 dark:bg-white/10 mx-1 opacity-60" />

                        {/* Botón de Menú Completo */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsMenuOpen(true);
                            }}
                            aria-label="Abrir Menú"
                            className="flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 cursor-pointer select-none"
                        >
                            <div className="p-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/30 transition-all">
                                <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300 stroke-[2.5px]" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5 text-slate-400 dark:text-slate-500">Menú</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Sheet desplegable del Menú Completo Móvil */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetContent side="bottom" className="h-[88vh] max-h-[90vh] p-0 rounded-t-[2.5rem] border-t-0 bg-transparent z-[200]">
                    <SheetTitle className="sr-only">Navegación principal</SheetTitle>
                    <SheetDescription className="sr-only">Secciones disponibles para tu cuenta</SheetDescription>
                    <div className="h-full bg-white dark:bg-[#030914] rounded-t-[2.5rem] overflow-hidden shadow-2xl flex flex-col border-t border-slate-200 dark:border-white/10">
                        {/* Barra indicadora táctil superior */}
                        <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mt-3 mb-2 shrink-0" />
                        <div className="flex-1 overflow-y-auto w-full">
                            <MobileSidebarContent onClose={() => setIsMenuOpen(false)} />
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
