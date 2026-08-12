'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard, Users, CreditCard, DollarSign,
  BarChart3, Settings, Home, FileText, PiggyBank
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/pwa/admin/dashboard', icon: LayoutDashboard, label: 'Inicio',     roles: ['ADMIN', 'SUPER_ADMIN'] },
  { href: '/pwa/admin/loans',     icon: CreditCard,      label: 'Cartera',    roles: ['ADMIN', 'SUPER_ADMIN'] },
  { href: '/pwa/admin/clients',   icon: Users,           label: 'Clientes',   roles: ['ADMIN', 'SUPER_ADMIN'] },
  { href: '/pwa/admin/payments/new', icon: DollarSign,   label: 'Cobrar',     roles: ['ADMIN', 'SUPER_ADMIN'] },
  { href: '/pwa/admin/commissions', icon: BarChart3,     label: 'Comisiones', roles: ['ADMIN'] },

  { href: '/pwa/asesor',          icon: Home,            label: 'Inicio',     roles: ['ASESOR'] },
  { href: '/pwa/asesor',          icon: Users,           label: 'Clientes',   roles: ['ASESOR'] },
  { href: '/mobile/cobranza',     icon: DollarSign,      label: 'Cobrar',     roles: ['ASESOR'] },
  { href: '/pwa/asesor/simulator', icon: PiggyBank,      label: 'Simulador',  roles: ['ASESOR'] },

  { href: '/pwa/client',          icon: Home,            label: 'Inicio',     roles: ['CLIENTE'] },
  { href: '/pwa/client',          icon: FileText,        label: 'Préstamos',  roles: ['CLIENTE'] },
  { href: '/cliente/payments',    icon: CreditCard,      label: 'Pagos',      roles: ['CLIENTE'] },
];

export function BottomNavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role || '';

  const items = NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
        {items.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] px-1 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-blue-100 dark:bg-blue-900/50' : ''
              }`}>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={`text-[10px] font-semibold tracking-tight ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
