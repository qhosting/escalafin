'use client';

import React from 'react';
import { AuthWrapper } from '@/components/auth-wrapper';
import { AdminSkeleton } from '@/components/layout/loading-variants';
import AdvisorTodayRoute from '@/components/collections/advisor-today-route';
import { Navigation, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default function AsesorRoutesPage() {
  return (
    <AuthWrapper allowedRoles={['ASESOR', 'ADMIN', 'SUPER_ADMIN']} loadingFallback={<AdminSkeleton />}>
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Navigation className="h-7 w-7 text-primary" />
                Mi Ruta de Cobranza en Campo
              </h1>
              <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200">
                <Sparkles className="h-3 w-3 mr-1" /> IA Optimizada
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Itinerario inteligente del día con navegación GPS, horarios sugeridos y registro de resultados.
            </p>
          </div>
        </div>

        <AdvisorTodayRoute />
      </div>
    </AuthWrapper>
  );
}
