
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Home, 
  DollarSign, 
  Users, 
  MapPin,
  User,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession() || {};

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  // Check if user has mobile access (advisors and admins)
  if (!['ADMIN', 'ADVISOR'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  EscalaFin Mobile
                </h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {session.user.role}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {session.user.name}
                  </span>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => signOut()}
              className="flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto py-2 gap-2">
            <Link href="/mobile/cobranza">
              <Button variant="ghost" size="sm" className="whitespace-nowrap flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cobranza
              </Button>
            </Link>
            <Link href="/mobile/clients">
              <Button variant="ghost" size="sm" className="whitespace-nowrap flex items-center gap-2">
                <Users className="h-4 w-4" />
                Clientes
              </Button>
            </Link>
            <Link href="/mobile/routes">
              <Button variant="ghost" size="sm" className="whitespace-nowrap flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Rutas
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="whitespace-nowrap flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <main className="pb-6">
        {children}
      </main>

      {/* Connection Status */}
      <div className="fixed bottom-4 left-4 right-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700">Conectado</span>
              </div>
              <div className="text-green-600">
                {new Date().toLocaleTimeString('es-MX')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
