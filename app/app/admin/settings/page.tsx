
'use client';

import { AuthWrapper } from '@/components/auth-wrapper';
import MainLayout from '@/components/layout/main-layout';
import { RegistrationControl } from '@/components/admin/registration-control';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Shield, 
  Database, 
  CreditCard, 
  MessageSquare, 
  FileText,
  Building2,
  Lock,
  Globe,
  Bell
} from 'lucide-react';

export default function AdminSettingsPage() {
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
              Administra todas las configuraciones generales de EscalaFin
            </p>
          </div>

          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="integrations">Integraciones</TabsTrigger>
              <TabsTrigger value="security">Seguridad</TabsTrigger>
            </TabsList>

            {/* PESTAÑA GENERAL */}
            <TabsContent value="general" className="space-y-6">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <div className="text-lg font-semibold text-gray-900">AWS S3</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700">Notificaciones</div>
                        <div className="text-lg font-semibold text-gray-900">WhatsApp + Email</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700">Pagos</div>
                        <div className="text-lg font-semibold text-gray-900">Openpay</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700">Estado</div>
                        <div className="text-lg font-semibold text-green-600">✅ Operativo</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PESTAÑA MÓDULOS */}
            <TabsContent value="modules" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    Módulos del Sistema
                  </CardTitle>
                  <CardDescription>
                    Configuración de módulos disponibles en la plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">Gestión de Clientes</div>
                        <div className="text-sm font-medium text-green-600">✅ Activo</div>
                      </div>
                      <div className="text-sm text-gray-600">CRUD completo de clientes</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">Gestión de Préstamos</div>
                        <div className="text-sm font-medium text-green-600">✅ Activo</div>
                      </div>
                      <div className="text-sm text-gray-600">Cálculo de amortización</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">Sistema de Pagos</div>
                        <div className="text-sm font-medium text-green-600">✅ Activo</div>
                      </div>
                      <div className="text-sm text-gray-600">Integración con Openpay</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">Analytics</div>
                        <div className="text-sm font-medium text-green-600">✅ Activo</div>
                      </div>
                      <div className="text-sm text-gray-600">Dashboard en tiempo real</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PESTAÑA INTEGRACIONES */}
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-600" />
                    Integraciones Externas
                  </CardTitle>
                  <CardDescription>
                    Configuración de APIs y servicios externos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a 
                      href="/admin/whatsapp/config" 
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-5 w-5 text-green-500" />
                        <div className="font-medium text-gray-900">WhatsApp Business</div>
                      </div>
                      <div className="text-sm text-gray-600">EvolutionAPI y plantillas de mensajes</div>
                      <div className="text-xs text-green-600 mt-1">✅ Configurado</div>
                    </a>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        <div className="font-medium text-gray-900">Openpay</div>
                      </div>
                      <div className="text-sm text-gray-600">Procesamiento de pagos</div>
                      <div className="text-xs text-green-600 mt-1">✅ Configurado</div>
                    </div>

                    <a 
                      href="/admin/storage" 
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-orange-500" />
                        <div className="font-medium text-gray-900">AWS S3</div>
                      </div>
                      <div className="text-sm text-gray-600">Almacenamiento de archivos</div>
                      <div className="text-xs text-green-600 mt-1">✅ Configurado</div>
                    </a>

                    <div className="p-4 border rounded-lg bg-gray-50 opacity-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="h-5 w-5 text-gray-400" />
                        <div className="font-medium text-gray-900">Notificaciones Email</div>
                      </div>
                      <div className="text-sm text-gray-600">Próximamente disponible</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PESTAÑA SEGURIDAD */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-red-600" />
                    Configuración de Seguridad
                  </CardTitle>
                  <CardDescription>
                    Configuraciones de autenticación y autorización
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">Autenticación NextAuth</div>
                          <div className="text-sm font-medium text-green-600">✅ Activo</div>
                        </div>
                        <div className="text-sm text-gray-600">Sistema de login seguro</div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">Control de Roles</div>
                          <div className="text-sm font-medium text-green-600">✅ Activo</div>
                        </div>
                        <div className="text-sm text-gray-600">Admin, Asesor, Cliente</div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">Protección de API</div>
                          <div className="text-sm font-medium text-green-600">✅ Activo</div>
                        </div>
                        <div className="text-sm text-gray-600">Middleware de autenticación</div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">Encriptación de Datos</div>
                          <div className="text-sm font-medium text-green-600">✅ Activo</div>
                        </div>
                        <div className="text-sm text-gray-600">Passwords hasheados bcrypt</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </AuthWrapper>
  );
}
