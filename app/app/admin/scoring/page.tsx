
'use client';

import { useState } from 'react';
import CreditScoringSystem from '@/components/scoring/credit-scoring-system';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, History, TrendingUp } from 'lucide-react';

export default function ScoringPage() {
  const [activeTab, setActiveTab] = useState('calculator');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Sistema de Scoring Crediticio
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Evaluación automatizada del riesgo crediticio y análisis de factores
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculadora de Score
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial de Evaluaciones
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics de Scoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <CreditScoringSystem />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Evaluaciones Crediticias</CardTitle>
              <CardDescription>
                Registro de todas las evaluaciones de scoring realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  El historial de evaluaciones se implementará próximamente
                </p>
                <Button variant="outline">
                  Ver todas las evaluaciones
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Scoring</CardTitle>
              <CardDescription>
                Estadísticas y tendencias del sistema de scoring crediticio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Los analytics de scoring se implementarán próximamente
                </p>
                <Button variant="outline">
                  Ver estadísticas de scoring
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
