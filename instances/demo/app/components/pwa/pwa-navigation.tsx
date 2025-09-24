
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Users, 
  BarChart3, 
  User, 
  CreditCard, 
  MessageCircle,
  MapPin,
  DollarSign 
} from 'lucide-react';

interface PWANavigationProps {
  userRole: string;
}

export const PWANavigation: React.FC<PWANavigationProps> = ({ userRole }) => {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show navigation on login pages
  if (pathname.includes('/auth/')) {
    return null;
  }

  const clientNavItems = [
    { icon: Home, label: 'Inicio', path: '/pwa/client' },
    { icon: CreditCard, label: 'Préstamos', path: '/cliente/loans' },
    { icon: DollarSign, label: 'Pagos', path: '/cliente/payments' },
    { icon: User, label: 'Perfil', path: '/cliente/profile' }
  ];

  const asesorNavItems = [
    { icon: Home, label: 'Inicio', path: '/pwa/asesor' },
    { icon: Users, label: 'Clientes', path: '/mobile/clients' },
    { icon: MapPin, label: 'Cobranza', path: '/mobile/cobranza' },
    { icon: MessageCircle, label: 'Mensajes', path: '/asesor/messages' }
  ];

  const reportsNavItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/pwa/reports' },
    { icon: Users, label: 'Clientes', path: '/admin/clients' },
    { icon: CreditCard, label: 'Préstamos', path: '/admin/loans' },
    { icon: DollarSign, label: 'Pagos', path: '/admin/payments' }
  ];

  const getNavItems = () => {
    if (pathname.includes('/pwa/client')) return clientNavItems;
    if (pathname.includes('/pwa/asesor')) return asesorNavItems;
    if (pathname.includes('/pwa/reports')) return reportsNavItems;
    
    // Default based on user role
    if (userRole === 'CLIENTE') return clientNavItems;
    if (userRole === 'ASESOR') return asesorNavItems;
    return reportsNavItems;
  };

  const navItems = getNavItems();
  const isPWARoute = pathname.includes('/pwa/');

  // Only show navigation on PWA routes
  if (!isPWARoute) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-1 h-12 p-1 ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs truncate">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default PWANavigation;
