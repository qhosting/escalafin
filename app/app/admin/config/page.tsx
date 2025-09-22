
'use client';

import { AuthWrapper } from '@/components/auth-wrapper';
import MainLayout from '@/components/layout/main-layout';
import { RegistrationControl } from '@/components/admin/registration-control';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Database } from 'lucide-react';

export default function AdminConfigPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Configuración del Sistema
            </h1>
            <p className="text-gray-600 mt-1">
              Administra las configuraciones generales de la plataforma
            </p>
          </div>

          <div className="grid gap-6">
            {/* Control de Registro */}
            <RegistrationControl />

            {/* Información del Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Información del Sistema
                </CardTitle>
                <CardDescription>
                  Estado y configuración actual de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">Versión</div>
                      <div className="text-lg font-semibold text-gray-900">EscalaFin v2.0</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">Base de Datos</div>
                      <div className="text-lg font-semibold text-gray-900">PostgreSQL</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">Almacenamiento</div>
                      <div className="text-lg font-semibold text-gray-900">AWS S3 + Local</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">Notificaciones</div>
                      <div className="text-lg font-semibold text-gray-900">WhatsApp + Email</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enlaces a Otras Configuraciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  Configuraciones Específicas
                </CardTitle>
                <CardDescription>
                  Accede a configuraciones detalladas de módulos específicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a 
                    href="/admin/whatsapp/config" 
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Configuración WhatsApp</div>
                    <div className="text-sm text-gray-600">EvolutionAPI y plantillas de mensajes</div>
                  </a>
                  <div className="p-4 border rounded-lg bg-gray-50 opacity-50">
                    <div className="font-medium text-gray-900">Configuración de Pagos</div>
                    <div className="text-sm text-gray-600">Próximamente disponible</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </AuthWrapper>
  );
}
