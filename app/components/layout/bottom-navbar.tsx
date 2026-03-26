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
import { MobileSidebarContent } from './mobile-sidebar-content';

export function BottomNavbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    if (!session) return null;

    const userRole = (session as any)?.user?.role;

    const getNavItems = () => {
        switch (userRole) {
            case 'ADMIN':
                return [
                    { icon: LayoutDashboard, label: 'Inicio', href: '/admin/dashboard', color: 'bg-blue-600' },
                    { icon: Users, label: 'Clientes', href: '/admin/clients', color: 'bg-indigo-600' },
                    { icon: CreditCard, label: 'Préstamos', href: '/admin/loans', color: 'bg-violet-600' },
                    { icon: DollarSign, label: 'Pagos', href: '/admin/payments', color: 'bg-emerald-600' },
                ];
            case 'ASESOR':
                return [
                    { icon: LayoutDashboard, label: 'Inicio', href: '/asesor/dashboard', color: 'bg-blue-600' },
                    { icon: Users, label: 'Clientes', href: '/asesor/clients', color: 'bg-indigo-600' },
                    { icon: CreditCard, label: 'Préstamos', href: '/asesor/loans', color: 'bg-violet-600' },
                    { icon: DollarSign, label: 'Cobros', href: '/admin/payments', color: 'bg-emerald-600' },
                ];
            case 'CLIENTE':
                return [
                    { icon: LayoutDashboard, label: 'Inicio', href: '/cliente/dashboard', color: 'bg-blue-600' },
                    { icon: CreditCard, label: 'Créditos', href: '/cliente/loans', color: 'bg-violet-600' },
                    { icon: DollarSign, label: 'Pagos', href: '/cliente/payments', color: 'bg-emerald-600' },
                    { icon: ClipboardList, label: 'Solicitud', href: '/cliente/credit-applications', color: 'bg-orange-600' },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems();

    const isActive = (href: string) => {
        if (href === '/' || href.includes('dashboard')) {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-[100] animate-in slide-in-from-bottom-5 duration-700">
            {/* Premium Floating Glass Container */}
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/20 dark:border-gray-800 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] px-2 py-2">
                <div className="flex items-center justify-between h-14 relative">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center justify-center flex-1 transition-all duration-300",
                                    active ? "scale-110" : "opacity-60 hover:opacity-100"
                                )}
                            >
                                <div className={cn(
                                    "p-2.5 rounded-2xl transition-all duration-300 relative group",
                                    active ? cn(item.color, "shadow-lg shadow-black/10") : "bg-transparent"
                                )}>
                                    <Icon className={cn(
                                        "h-5 w-5 transition-transform",
                                        active ? "text-white scale-110 stroke-[2.5px]" : "text-gray-600 dark:text-gray-400 stroke-2"
                                    )} />
                                    
                                    {/* Active State Glow */}
                                    {active && (
                                        <div className={cn(
                                            "absolute inset-0 rounded-2xl blur-md opacity-40 -z-10",
                                            item.color
                                        )} />
                                    )}
                                </div>
                                
                                 {/* Label Text - Subtle and elegant */}
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-tighter mt-1 transition-all duration-300",
                                    active ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
                                )}>
                                    {item.label}
                                </span>

                                {/* Indicator Dot */}
                                {active && (
                                    <div className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-gray-900 dark:bg-white animate-pulse" />
                                )}
                            </Link>
                        );
                    })}

                    {/* Separator */}
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-800 mx-1 opacity-50" />

                    {/* Menu Button */}
                    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <SheetTrigger asChild>
                            <button className="flex flex-col items-center justify-center w-14 transition-all opacity-60 hover:opacity-100 active:scale-90">
                                <div className="p-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800">
                                    <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400 stroke-2" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-tighter mt-1 text-gray-400 dark:text-gray-500">Menú</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-[3rem] border-t-0 bg-transparent">
                            <div className="h-full bg-white dark:bg-gray-950 rounded-t-[3rem] overflow-hidden shadow-2xl flex flex-col border-t border-white/10">
                                {/* Visual Puller */}
                                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mt-4 mb-2" />
                                <div className="flex-1 overflow-y-auto">
                                    <MobileSidebarContent onClose={() => setIsMenuOpen(false)} />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </div>
    );
}
