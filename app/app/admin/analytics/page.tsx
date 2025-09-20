
'use client';

import { Suspense } from 'react';
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics Empresariales
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Análisis avanzado del rendimiento financiero y operacional
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Cargando Analytics...</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        }
      >
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}
