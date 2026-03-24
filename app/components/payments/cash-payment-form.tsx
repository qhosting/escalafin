
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Banknote, 
  MapPin, 
  Calendar, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Camera,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { PaymentSuccessView } from './payment-success-view';
import { calculateLateFee } from '@/lib/loan-calculations';
import { LateFeeType } from '@prisma/client';

interface CashPaymentData {
  loanId: string;
  clientId: string;
  amount: number;
  paymentDate: string;
  collectorLocation: string;
  notes: string;
  receiptNumber?: string;
  collectionMethod: 'home' | 'office' | 'field';
  photoEvidence?: File;
  lateFeePaid: number;
}

interface CashPaymentFormProps {
  loan?: {
    id: string;
    loanNumber: string;
    client: {
      id: string;
      firstName: string;
      lastName: string;
      address?: string;
    };
    balanceRemaining: number;
    monthlyPayment: number;
    lateFeeType?: LateFeeType;
    lateFeeAmount?: number;
    lateFeeMaxWeekly?: number;
    amortizationSchedule?: any[];
  };
  onSuccess?: (payment: any) => void;
  onCancel?: () => void;
}

const CashPaymentForm: React.FC<CashPaymentFormProps> = ({ 
  loan, 
  onSuccess, 
  onCancel 
}) => {
  const { data: session } = useSession() || {};
  const [formData, setFormData] = useState<CashPaymentData>({
    loanId: loan?.id || '',
    clientId: loan?.client?.id || '',
    amount: loan?.monthlyPayment || 0,
    paymentDate: new Date().toISOString().split('T')[0],
    collectorLocation: '',
    notes: '',
    receiptNumber: '',
    collectionMethod: 'home',
    photoEvidence: undefined,
    lateFeePaid: 0
  });
  
  const [accumulatedLateFee, setAccumulatedLateFee] = useState(0);
  
  const [processing, setProcessing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const handleInputChange = (field: keyof CashPaymentData, value: string | number | File) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange('photoEvidence', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Calcular mora acumulada
  const [initialCalcDone, setInitialCalcDone] = useState(false);
  
  useEffect(() => {
    if (loan?.amortizationSchedule && !initialCalcDone) {
      const today = new Date();
      const lateItems = loan.amortizationSchedule.filter(
        (item: any) => !item.isPaid && new Date(item.paymentDate) < today
      );

      let total = 0;
      lateItems.forEach((item: any) => {
        const fee = calculateLateFee({
          dueDate: new Date(item.paymentDate),
          paymentDate: today,
          lateFeeType: loan.lateFeeType || 'DAILY_FIXED',
          lateFeeAmount: Number(loan.lateFeeAmount) || 200,
          lateFeeMaxWeekly: Number(loan.lateFeeMaxWeekly) || 800
        });
        total += fee;
      });
      
      setAccumulatedLateFee(total);
      
      if (total > 0) {
        setFormData(prev => ({ 
          ...prev, 
          amount: prev.amount + total,
          lateFeePaid: total 
        }));
      }
      setInitialCalcDone(true);
    }
  }, [loan, initialCalcDone]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleInputChange('collectorLocation', `${latitude}, ${longitude}`);
          toast.success('Ubicación capturada correctamente');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('No se pudo obtener la ubicación');
        }
      );
    } else {
      toast.error('Geolocalización no disponible en este dispositivo');
    }
  };

  const processCashPayment = async () => {
    if (!formData.amount || !formData.collectorLocation) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (!session?.user?.id) {
      toast.error('Sesión no válida');
      return;
    }

    setProcessing(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('loanId', formData.loanId);
      formDataToSend.append('clientId', formData.clientId);
      formDataToSend.append('amount', formData.amount.toString());
      formDataToSend.append('paymentDate', formData.paymentDate);
      formDataToSend.append('collectorLocation', formData.collectorLocation);
      formDataToSend.append('notes', formData.notes);
      formDataToSend.append('receiptNumber', formData.receiptNumber || '');
      formDataToSend.append('collectionMethod', formData.collectionMethod);
      formDataToSend.append('collectorId', session.user.id);
      formDataToSend.append('lateFeePaid', formData.lateFeePaid.toString());

      if (formData.photoEvidence) {
        formDataToSend.append('photoEvidence', formData.photoEvidence);
      }

      const response = await fetch('/api/payments/cash', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al registrar el pago');
      }

      toast.success('Pago en efectivo registrado exitosamente');
      
      // Preparar datos para el recibo
      setSuccessData({
        ...result,
        clientName: `${loan?.client.firstName} ${loan?.client.lastName}`,
        loanNumber: loan?.loanNumber,
        paymentMethod: 'Efectivo',
        amount: formData.amount,
        balanceAfter: result.updatedLoan?.balanceRemaining || (loan ? loan.balanceRemaining - formData.amount : 0)
      });

      onSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMessage);
      console.error('Error processing cash payment:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'home':
        return '🏠';
      case 'office':
        return '🏢';
      case 'field':
        return '🚗';
      default:
        return '💰';
    }
  };

  if (successData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <PaymentSuccessView 
            payment={successData} 
            onClose={() => {
              if (onCancel) onCancel();
              else setSuccessData(null);
            }} 
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-600" />
            Registro de Pago en Efectivo
          </CardTitle>
          <CardDescription>
            Registra pagos recibidos físicamente en efectivo - Cobranza Móvil
          </CardDescription>
        </CardHeader>
        {loan && (
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-medium">Cliente:</Label>
                <p>{loan.client.firstName} {loan.client.lastName}</p>
              </div>
              <div>
                <Label className="font-medium">Préstamo:</Label>
                <p className="font-mono">{loan.loanNumber}</p>
              </div>
              <div>
                <Label className="font-medium">Saldo Pendiente:</Label>
                <p className="font-bold text-red-600">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN'
                  }).format(loan.balanceRemaining)}
                </p>
              </div>
              <div>
                <Label className="font-medium">Pago Mensual:</Label>
                <p className="font-semibold">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN'
                  }).format(loan.monthlyPayment)}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto Recibido *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="1000.00"
              />
              <div className="text-lg font-bold text-green-600">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN'
                }).format(formData.amount)}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Fecha de Pago *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleInputChange('paymentDate', e.target.value)}
              />
            </div>
          </div>

          {/* Mora (Late Fee) */}
          {accumulatedLateFee > 0 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Interés Moratorio Acumulado</span>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-orange-900 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300">
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(accumulatedLateFee)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-1">
                  <Label htmlFor="lateFeePaid" className="text-xs text-orange-700 dark:text-orange-300 uppercase font-bold">Monto Multa a Cobrar</Label>
                  <Input
                    id="lateFeePaid"
                    type="number"
                    size={10}
                    className="h-8 border-orange-300"
                    value={formData.lateFeePaid}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ 
                        ...prev, 
                        lateFeePaid: val,
                        // Ajustar monto total si es necesario? O dejar que el usuario lo haga
                      }));
                    }}
                  />
                  <p className="text-[10px] text-orange-600">Este monto no reduce el capital del préstamo.</p>
                </div>
                <div className="flex flex-col justify-end text-right">
                  <span className="text-xs text-muted-foreground italic">Restante p/ Préstamo:</span>
                  <span className="font-bold text-blue-600">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(formData.amount - formData.lateFeePaid)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Collection Method */}
          <div className="space-y-2">
            <Label>Método de Cobranza</Label>
            <Select 
              value={formData.collectionMethod} 
              onValueChange={(value: any) => handleInputChange('collectionMethod', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">
                  <div className="flex items-center gap-2">
                    <span>{getMethodIcon('home')}</span>
                    Domicilio del Cliente
                  </div>
                </SelectItem>
                <SelectItem value="office">
                  <div className="flex items-center gap-2">
                    <span>{getMethodIcon('office')}</span>
                    Oficina
                  </div>
                </SelectItem>
                <SelectItem value="field">
                  <div className="flex items-center gap-2">
                    <span>{getMethodIcon('field')}</span>
                    Trabajo de Campo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación de Cobranza *</Label>
            <div className="flex gap-2">
              <Input
                id="location"
                value={formData.collectorLocation}
                onChange={(e) => handleInputChange('collectorLocation', e.target.value)}
                placeholder="Coordenadas GPS o dirección"
                readOnly
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={getCurrentLocation}
                className="shrink-0"
              >
                <MapPin className="h-4 w-4" />
                GPS
              </Button>
            </div>
          </div>

          {/* Receipt Number */}
          <div className="space-y-2">
            <Label htmlFor="receiptNumber">Número de Recibo (Opcional)</Label>
            <Input
              id="receiptNumber"
              value={formData.receiptNumber}
              onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
              placeholder="REC-001"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Detalles adicionales del pago..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Photo Evidence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Evidencia Fotográfica
          </CardTitle>
          <CardDescription>
            Toma una foto como comprobante del pago recibido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photo">Foto del Comprobante</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
            />
          </div>

          {photoPreview && (
            <div className="space-y-2">
              <Label>Vista Previa:</Label>
              <div className="relative w-full max-w-md mx-auto">
                <img 
                  src={photoPreview} 
                  alt="Comprobante de pago" 
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collector Info */}
      <Alert>
        <User className="h-4 w-4" />
        <AlertDescription>
          <strong>Cobrador:</strong> {session?.user?.name || 'Usuario no identificado'}
          <br />
          <strong>Fecha/Hora:</strong> {new Date().toLocaleString('es-MX')}
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={processing}>
            Cancelar
          </Button>
        )}
        <Button 
          onClick={processCashPayment} 
          disabled={processing || !formData.amount || !formData.collectorLocation}
          className="flex-1 flex items-center gap-2"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Procesando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Registrar Pago en Efectivo
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CashPaymentForm;
