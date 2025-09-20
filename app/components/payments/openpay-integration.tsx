
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  QrCode,
  Smartphone,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentFormData {
  amount: number;
  description: string;
  customerName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentMethod: 'card' | 'spei' | 'store' | 'bank_account';
}

interface PaymentResult {
  id: string;
  status: string;
  amount: number;
  method: string;
  payment_url?: string;
  authorization?: string;
  error_message?: string;
}

const OpenpayIntegration: React.FC<{ 
  loanId?: string; 
  paymentId?: string;
  amount?: number;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
}> = ({ 
  loanId, 
  paymentId, 
  amount: defaultAmount = 0, 
  onSuccess, 
  onError 
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: defaultAmount,
    description: 'Pago de préstamo',
    customerName: '',
    customerLastName: '',
    customerEmail: '',
    customerPhone: '',
    paymentMethod: 'card'
  });
  
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const handleInputChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const processPayment = async () => {
    if (!formData.customerName || !formData.customerEmail || !formData.amount) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/payments/openpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          loanId,
          paymentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el pago');
      }

      setPaymentResult(result);
      
      if (result.status === 'completed' || result.status === 'charge_pending') {
        toast.success('Pago procesado exitosamente');
        onSuccess?.(result);
      } else if (result.payment_url) {
        toast.info('Redirigiendo a la página de pago...');
        window.open(result.payment_url, '_blank');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMessage);
      onError?.(errorMessage);
      console.error('Error processing payment:', error);
    } finally {
      setProcessing(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentResult?.id) return;

    try {
      const response = await fetch(`/api/payments/openpay/${paymentResult.id}`);
      const status = await response.json();
      
      setPaymentResult(prev => prev ? { ...prev, ...status } : status);
      
      if (status.status === 'completed') {
        toast.success('¡Pago confirmado!');
        onSuccess?.(status);
      } else if (status.status === 'failed') {
        toast.error('El pago fue rechazado');
        onError?.(status.error_message || 'Pago rechazado');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast.error('Error al verificar el estado del pago');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'charge_pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      case 'charge_pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Procesando';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'spei':
        return <Building2 className="h-5 w-5" />;
      case 'store':
        return <QrCode className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  if (paymentResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(paymentResult.status)}
            Estado del Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">ID de Transacción</Label>
              <p className="text-sm text-muted-foreground">{paymentResult.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Estado</Label>
              <div className="flex items-center gap-2">
                <Badge variant={paymentResult.status === 'completed' ? 'default' : 'secondary'}>
                  {getStatusText(paymentResult.status)}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Monto</Label>
              <p className="text-lg font-bold">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN'
                }).format(paymentResult.amount)}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Método</Label>
              <div className="flex items-center gap-2">
                {getMethodIcon(paymentResult.method)}
                <span className="text-sm">{paymentResult.method}</span>
              </div>
            </div>
          </div>

          {paymentResult.authorization && (
            <div>
              <Label className="text-sm font-medium">Código de Autorización</Label>
              <p className="font-mono text-sm bg-muted p-2 rounded">
                {paymentResult.authorization}
              </p>
            </div>
          )}

          {paymentResult.error_message && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{paymentResult.error_message}</AlertDescription>
            </Alert>
          )}

          {paymentResult.payment_url && (
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Para completar el pago, 
                <a 
                  href={paymentResult.payment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-1 text-blue-600 hover:underline"
                >
                  haz clic aquí
                </a>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={checkPaymentStatus}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Verificar Estado
            </Button>
            <Button 
              onClick={() => {
                setPaymentResult(null);
                setFormData(prev => ({ ...prev, amount: defaultAmount }));
              }}
            >
              Nuevo Pago
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Procesar Pago con Openpay</CardTitle>
        <CardDescription>
          Completa los datos para procesar el pago de forma segura
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="customer" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer">Datos del Cliente</TabsTrigger>
            <TabsTrigger value="payment">Información de Pago</TabsTrigger>
            <TabsTrigger value="method">Método de Pago</TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nombre *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerLastName">Apellido *</Label>
                <Input
                  id="customerLastName"
                  value={formData.customerLastName}
                  onChange={(e) => handleInputChange('customerLastName', e.target.value)}
                  placeholder="Apellido del cliente"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  placeholder="cliente@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Teléfono</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  placeholder="55 1234 5678"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  placeholder="1000.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Monto Formateado</Label>
                <div className="p-2 bg-muted rounded text-lg font-bold">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN'
                  }).format(formData.amount)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción del pago"
              />
            </div>
          </TabsContent>

          <TabsContent value="method" className="space-y-4">
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select 
                value={formData.paymentMethod} 
                onValueChange={(value: any) => handleInputChange('paymentMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tarjeta de Crédito/Débito
                    </div>
                  </SelectItem>
                  <SelectItem value="spei">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      SPEI (Transferencia Bancaria)
                    </div>
                  </SelectItem>
                  <SelectItem value="store">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      Pago en Tienda
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                El cliente será redirigido a la página de Openpay para completar el pago de forma segura.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Los campos marcados con * son obligatorios
          </div>
          <Button 
            onClick={processPayment} 
            disabled={processing || !formData.customerName || !formData.customerEmail || !formData.amount}
            className="flex items-center gap-2"
          >
            {processing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4" />
            )}
            {processing ? 'Procesando...' : 'Procesar Pago'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenpayIntegration;
