
'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>{children}</div>;
  }

  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
