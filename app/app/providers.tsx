
'use client';


import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { TenantProvider, Tenant } from '@/components/providers/tenant-provider';

interface ProvidersProps {
  children: React.ReactNode;
  tenant?: Tenant | null;
}

export function Providers({ children, tenant = null }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TenantProvider tenant={tenant}>
          {children}
        </TenantProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
