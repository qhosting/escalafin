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
    Bell,
    Search
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
                    { icon: LayoutDashboard, label: 'Inicio', href: '/admin/dashboard' },
                    { icon: Users, label: 'Clientes', href: '/admin/clients' },
                    { icon: CreditCard, label: 'Préstamos', href: '/admin/loans' },
                    { icon: DollarSign, label: 'Pagos', href: '/admin/payments' },
                ];
            case 'ASESOR':
                return [
                    { icon: LayoutDashboard, label: 'Inicio', href: '/asesor/dashboard' },
                    { icon: Users, label: 'Clientes', href: '/asesor/clients' },
                    { icon: CreditCard, label: 'Préstamos', href: '/asesor/loans' },
                    { icon: DollarSign, label: 'Cobros', href: '/admin/payments' }, // O la ruta de cobranza si existe
                ];
            case 'CLIENTE':
                return [
                    { icon: LayoutDashboard, label: 'Inicio', href: '/cliente/dashboard' },
                    { icon: CreditCard, label: 'Mis Créditos', href: '/cliente/loans' },
                    { icon: DollarSign, label: 'Pagos', href: '/cliente/payments' },
                    { icon: ClipboardList, label: 'Solicitud', href: '/cliente/credit-applications' },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems();

    const isActive = (href: string) => {
        if (href === '/') return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* Glassmorphism background */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center flex-1 transition-all duration-200 gap-1",
                                    active ? "text-primary" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-xl transition-colors",
                                    active && "bg-primary/10"
                                )}>
                                    <Icon className={cn("h-5 w-5", active ? "stroke-[2.5px]" : "stroke-2")} />
                                </div>
                                <span className={cn("text-[10px] font-medium transition-transform", active && "scale-105")}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Menu / More Button */}
                    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <SheetTrigger asChild>
                            <button className="flex flex-col items-center justify-center flex-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 gap-1">
                                <div className="p-1.5 rounded-xl">
                                    <Menu className="h-5 w-5 stroke-2" />
                                </div>
                                <span className="text-[10px] font-medium">Menú</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-[2.5rem] border-t-0 bg-transparent">
                            <div className="h-full bg-white dark:bg-gray-900 rounded-t-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                                {/* Visual Puller */}
                                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-1" />
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
