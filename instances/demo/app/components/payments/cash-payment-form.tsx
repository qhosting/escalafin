
'use client';

import { useState } from 'react';
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
    photoEvidence: undefined
  });
  
  const [processing, setProcessing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
