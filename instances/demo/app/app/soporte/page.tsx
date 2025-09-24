
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, HelpCircle, MessageSquare, Phone, Mail, CreditCard, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function SoportePage() {
  const sessionResult = useSession();
  const { data: session, status } = sessionResult || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Soporte Técnico</h1>
          <p className="text-muted-foreground">
            Centro de ayuda y contacto para usuarios de EscalaFin
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contacto directo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contacto Directo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">soporte@escalafin.com</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard('soporte@escalafin.com')}
                >
                  Copiar
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">+52 55 1234 5678</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://wa.me/5255123456789', '_blank')}
                >
                  Abrir Chat
                </Button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Horario de atención:</strong><br />
                Lunes a Viernes: 9:00 AM - 6:00 PM<br />
                Sábados: 9:00 AM - 2:00 PM
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recarga de mensajes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Recarga de Mensajes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  Paquetes Disponibles
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">100 mensajes WhatsApp</span>
                    <Badge variant="outline" className="text-green-700 bg-green-50">
                      $50 MXN
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">500 mensajes WhatsApp</span>
                    <Badge variant="outline" className="text-green-700 bg-green-50">
                      $200 MXN
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">1000 mensajes WhatsApp</span>
                    <Badge variant="outline" className="text-green-700 bg-green-50">
                      $350 MXN
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Consumo actual:</strong><br />
                  Para verificar tu consumo de mensajes y solicitar recarga, contacta a soporte.
                </p>
              </div>

              <Button 
                className="w-full"
                onClick={() => window.open('https://wa.me/5255123456789?text=Hola, necesito información sobre recarga de mensajes WhatsApp', '_blank')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Solicitar Recarga
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información de transferencia SPEI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Datos para Transferencia SPEI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Banco</label>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-mono">KLAR</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard('KLAR')}
                  >
                    Copiar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Titular</label>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-mono">Edwin Zapote Salinas</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard('Edwin Zapote Salinas')}
                  >
                    Copiar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">CLABE</label>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-mono">661610002201495542</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard('661610002201495542')}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">
                  Instrucciones para Transferencia
                </h4>
                <ol className="text-sm text-blue-700 space-y-2">
                  <li>1. Utiliza los datos SPEI proporcionados</li>
                  <li>2. Incluye tu número de cliente en el concepto</li>
                  <li>3. Envía el comprobante por WhatsApp</li>
                  <li>4. Espera la confirmación de recarga</li>
                </ol>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Las transferencias se procesan de Lunes a Viernes en horario bancario. 
                  El tiempo de procesamiento es de 1 a 2 horas hábiles.
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline"
              onClick={() => window.open('mailto:soporte@escalafin.com?subject=Consulta de Soporte&body=Hola, necesito ayuda con...', '_blank')}
            >
              <Mail className="w-4 h-4 mr-2" />
              Enviar Email
            </Button>
            <Button
              onClick={() => window.open('https://wa.me/5255123456789?text=Hola, necesito soporte técnico', '_blank')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FAQ o preguntas frecuentes */}
      <Card>
        <CardHeader>
          <CardTitle>Preguntas Frecuentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium mb-2">¿Cómo verifico mi consumo de mensajes?</h5>
              <p className="text-sm text-muted-foreground">
                Contacta a soporte técnico por WhatsApp o email con tu número de cliente.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium mb-2">¿Cuánto tiempo tarda en procesarse una recarga?</h5>
              <p className="text-sm text-muted-foreground">
                Las recargas se procesan en 1-2 horas hábiles después de confirmar el pago.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium mb-2">¿Puedo solicitar una factura por la recarga?</h5>
              <p className="text-sm text-muted-foreground">
                Sí, solicita tu factura al momento de realizar la transferencia o contactando a soporte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
