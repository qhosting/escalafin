
'use client';

import { ClientMigration } from '@/components/clients/client-migration';
import { AuthWrapper } from '@/components/auth-wrapper';
import { ArrowLeft, Database } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function ClientMigrationPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin/clients">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Clientes
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Database className="h-8 w-8" />
                Migración de Clientes
              </h1>
              <p className="text-muted-foreground">
                Importa clientes existentes desde otros sistemas con sus saldos actuales
              </p>
            </div>
          </div>

          {/* Información importante */}
          <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <Database className="h-5 w-5" />
                Información Importante sobre la Migración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-800 dark:text-orange-200">✅ Qué se puede migrar:</h4>
                  <ul className="space-y-1 text-orange-700 dark:text-orange-300">
                    <li>• Datos personales del cliente</li>
                    <li>• Saldos pendientes actuales</li>
                    <li>• Fecha del último pago</li>
                    <li>• Información financiera básica</li>
                    <li>• Notas e historial previo</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-800 dark:text-orange-200">⚠️ Consideraciones:</h4>
                  <ul className="space-y-1 text-orange-700 dark:text-orange-300">
                    <li>• Los emails deben ser únicos</li>
                    <li>• Se creará un registro de migración</li>
                    <li>• Los saldos se registran como transacciones iniciales</li>
                    <li>• No se pueden migrar préstamos activos completos</li>
                    <li>• Revisa la información antes de migrar</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Componente de migración */}
          <ClientMigration
            onClientsMigrated={(clients) => {
              console.log('Clientes migrados:', clients);
            }}
          />
        </div>
      </div>
    </AuthWrapper>
  );
}
