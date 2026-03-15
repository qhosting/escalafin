'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import {
  Building2,
  Bell,
  User,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function MobileSidebar() {
  const { data: session } = useSession() || {};

  if (!session) {
    return null;
  }

  return (
    <div className="md:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      {/* Header móvil premium */}
      <div className="flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center space-x-3 active:scale-95 transition-transform">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            EscalaFin
          </h2>
        </Link>

        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 h-10 w-10">
            <Search className="h-5 w-5 text-gray-500" />
          </Button>

          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 h-10 w-10 relative">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
            </Button>
          </Link>

          <Link href="/profile" className="ml-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 overflow-hidden shadow-sm active:ring-2 ring-primary/30 transition-all">
              <User className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
