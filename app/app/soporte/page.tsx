
'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, MessageCircle, Phone, Clock, Users, Headphones } from 'lucide-react'

export default function SoportePage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Soporte Técnico</h1>
          <p className="text-muted-foreground">
            Estamos aquí para ayudarte con cualquier consulta o problema técnico
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Email Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Soporte por Email
              </CardTitle>
              <CardDescription>
                Envíanos un correo para consultas técnicas o reportar problemas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Respuesta en 24-48 horas</span>
              </div>
              <Button 
                className="w-full" 
                onClick={() => window.open('mailto:root@cloudmx.site', '_blank')}
              >
                <Mail className="h-4 w-4 mr-2" />
                root@cloudmx.site
              </Button>
            </CardContent>
          </Card>

          {/* WhatsApp Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Soporte por WhatsApp
              </CardTitle>
              <CardDescription>
                Chatea con nosotros para soporte inmediato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Respuesta inmediata</span>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={() => window.open('https://wa.me/message/LDM6P4RYKODLI1', '_blank')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Abrir WhatsApp
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-purple-600" />
              Información de Soporte
            </CardTitle>
            <CardDescription>
              Detalles importantes sobre nuestro servicio de soporte técnico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Horarios de Atención
                </h4>
                <p className="text-sm text-muted-foreground">
                  Lunes a Viernes: 9:00 AM - 6:00 PM<br />
                  Sábados: 10:00 AM - 2:00 PM<br />
                  Domingos: Emergencias únicamente
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  Tipos de Soporte
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Problemas técnicos</li>
                  <li>• Configuración del sistema</li>
                  <li>• Capacitación de usuarios</li>
                  <li>• Integración de APIs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
            <CardDescription>
              Respuestas a las consultas más comunes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm">¿Cómo reporto un problema?</h4>
                <p className="text-sm text-muted-foreground">
                  Puedes reportar problemas por email o WhatsApp. Incluye una descripción detallada 
                  del problema y capturas de pantalla si es posible.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm">¿Qué información debo incluir en mi reporte?</h4>
                <p className="text-sm text-muted-foreground">
                  Incluye: descripción del problema, pasos para reproducirlo, navegador utilizado, 
                  y cualquier mensaje de error que aparezca.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm">¿Hay soporte en fines de semana?</h4>
                <p className="text-sm text-muted-foreground">
                  El soporte regular está disponible de lunes a sábado. Los domingos solo 
                  atendemos emergencias críticas que afecten el funcionamiento del sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
