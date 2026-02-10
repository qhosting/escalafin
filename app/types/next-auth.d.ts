
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      tenantId: string | null;
      tenantSlug: string | null;
    };
  }

  interface User {
    role: string;
    tenantId: string | null;
    tenantSlug: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    tenantId: string | null;
    tenantSlug: string | null;
  }
}
