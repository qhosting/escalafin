
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
  Save,
  DollarSign,
  RefreshCw,
  Clock,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { PaymentSuccessView } from './payment-success-view';
import { calculateLateFee } from '@/lib/loan-calculations';
import { LateFeeType } from '@prisma/client';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

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
  penaltyIds: string[];
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
    amount: 0, 
    paymentDate: (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })(),
    collectorLocation: 'Capturando GPS...', // Default text while capturing
    notes: '',
    receiptNumber: '',
    collectionMethod: 'field',
    photoEvidence: undefined,
    lateFeePaid: 0,
    penaltyIds: []
  });
  
  const [pendingPenalties, setPendingPenalties] = useState<any[]>([]);
  const [loadingPenalties, setLoadingPenalties] = useState(false);
  const [accumulatedLateFee, setAccumulatedLateFee] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  // 🌍 Auto-GPS Capture
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ ...prev, collectorLocation: `${latitude}, ${longitude}` }));
          console.log('GPS Captured:', latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setFormData(prev => ({ ...prev, collectorLocation: 'Ubicación no disponible' }));
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation, loan?.id]);

  // 🔍 Fetch Pending Penalties
  useEffect(() => {
    if (loan?.id) {
      fetchPenalties();
    }
  }, [loan?.id]);

  const fetchPenalties = async () => {
    if (!loan?.id) return;
    try {
      setLoadingPenalties(true);
      const response = await fetch(`/api/loans/${loan.id}/penalties`);
      const data = await response.json();
      if (data.penalties) {
        setPendingPenalties(data.penalties);
      }
    } catch (e) {
      console.error('Error fetching penalties:', e);
    } finally {
      setLoadingPenalties(false);
    }
  };

  // 💰 Auto-calculate next payment and late fees
  const [calcDoneForLoan, setCalcDoneForLoan] = useState<string | null>(null);

  useEffect(() => {
    if (loan && calcDoneForLoan !== loan.id) {
      const today = new Date();
      
      // 1. Calcular intereses moratorios
      let totalMora = 0;
      if (loan.amortizationSchedule) {
        const lateItems = loan.amortizationSchedule.filter(
          (item: any) => !item.isPaid && new Date(item.paymentDate) < today
        );

        lateItems.forEach((item: any) => {
          const fee = calculateLateFee({
            dueDate: new Date(item.paymentDate),
            paymentDate: today,
            lateFeeType: loan.lateFeeType || 'DAILY_FIXED',
            lateFeeAmount: Number(loan.lateFeeAmount) || 200,
            lateFeeMaxWeekly: Number(loan.lateFeeMaxWeekly) || 800
          });
          totalMora += fee;
        });
      }
      setAccumulatedLateFee(totalMora);

      // 2. Encontrar el siguiente pago vencido o por vencer
      let nextPaymentAmount = loan.monthlyPayment;
      if (loan.amortizationSchedule) {
        const nextScheduled = loan.amortizationSchedule.find((item: any) => !item.isPaid);
        if (nextScheduled) {
          nextPaymentAmount = Number(nextScheduled.totalPayment);
        }
      }
      
      setFormData(prev => ({ 
        ...prev, 
        loanId: loan.id,
        clientId: loan.client.id,
        amount: nextPaymentAmount + totalMora,
        lateFeePaid: totalMora,
        penaltyIds: [] // No seleccionamos ninguna por defecto, el usuario debe elegir
      }));
      setCalcDoneForLoan(loan.id);
    }
  }, [loan, calcDoneForLoan]);

  const togglePenalty = (penalty: any) => {
    const isSelected = formData.penaltyIds.includes(penalty.id);
    const penaltyAmount = Number(penalty.amount);

    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        penaltyIds: prev.penaltyIds.filter(id => id !== penalty.id),
        lateFeePaid: prev.lateFeePaid - penaltyAmount,
        amount: prev.amount - penaltyAmount
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        penaltyIds: [...prev.penaltyIds, penalty.id],
        lateFeePaid: prev.lateFeePaid + penaltyAmount,
        amount: prev.amount + penaltyAmount
      }));
    }
  };

  const handleInputChange = (field: keyof CashPaymentData, value: string | number | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const processCashPayment = async () => {
    const isLocationCaptured = formData.collectorLocation && 
                               formData.collectorLocation !== 'Capturando GPS...' && 
                               formData.collectorLocation !== 'Ubicación no disponible';

    if (!formData.amount) {
      toast.error('Por favor ingresa un monto válido');
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
      formDataToSend.append('collectorLocation', isLocationCaptured ? formData.collectorLocation : 'Sin GPS - Registro PWA');
      formDataToSend.append('notes', 'Cobro PWA - Registro Rápido'); // Notas automáticas
      formDataToSend.append('receiptNumber', formData.receiptNumber || '');
      formDataToSend.append('collectionMethod', formData.collectionMethod);
      formDataToSend.append('collectorId', session.user.id);
      formDataToSend.append('lateFeePaid', formData.lateFeePaid.toString());
      formDataToSend.append('penaltyIds', JSON.stringify(formData.penaltyIds));

      const response = await fetch('/api/payments/cash', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al registrar el pago');
      }

      toast.success('Pago registrado exitosamente');
      
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
    } finally {
      setProcessing(false);
    }
  };

  if (successData) {
    return (
      <Card className="rounded-3xl border-0 shadow-none">
        <CardContent className="pt-0 p-0">
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Resumen del Préstamo - Premium */}
      <Card className="rounded-3xl overflow-hidden shadow-xl border-blue-50 dark:border-blue-900/50">
        <CardHeader className="bg-blue-600 p-6 md:p-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <Badge className="bg-white/20 text-white border-0 font-black text-[10px] uppercase tracking-widest mb-2">
                Recaudación en Campo
              </Badge>
              <CardTitle className="text-white text-3xl md:text-4xl font-black tracking-tight leading-none">
                {loan ? `${loan.client.firstName} ${loan.client.lastName}` : 'Seleccione Préstamo'}
              </CardTitle>
              {loan && (
                <div className="flex items-center gap-2 text-white/80 font-mono text-sm">
                  <span className="font-black text-white">{loan.loanNumber}</span>
                  <span>·</span>
                  <span className="font-medium">{loan.client.address || 'Sin dirección registrada'}</span>
                </div>
              )}
            </div>
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
              <Banknote className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardHeader>
        
        {loan && (
          <CardContent className="p-6 md:p-8 bg-white dark:bg-gray-900">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-gray-400">Saldo Total</Label>
                <p className="text-xl md:text-2xl font-black text-red-600">
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(loan.balanceRemaining)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-gray-400">Cuota Base</Label>
                <p className="text-xl md:text-2xl font-black text-blue-600">
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(loan.monthlyPayment)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-gray-400">Interés Mora</Label>
                <p className="text-xl md:text-2xl font-black text-orange-500">
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(accumulatedLateFee)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-gray-400">Monto Sugerido</Label>
                <div className="flex items-center gap-2">
                  <p className="text-xl md:text-2xl font-black text-green-600">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(formData.amount)}
                  </p>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Formulario de Pago - Compacto y Eficiente */}
      <Card className="rounded-3xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monto Final - Enorme para visibilidad */}
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="amount" className="text-xs font-black uppercase text-gray-400">Monto a Cobrar (MXN)</Label>
              <div className="relative group">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 text-blue-600" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="pl-14 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 font-black text-4xl text-blue-700 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                />
              </div>
              <p className="text-[10px] font-bold text-gray-400 italic">Incluye {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(formData.lateFeePaid)} de interés moratorio.</p>
            </div>

            {/* Receipt Number - Importante tenerlo a la mano */}
            <div className="space-y-2">
              <Label htmlFor="receiptNumber" className="text-xs font-black uppercase text-gray-400">Número de Recibo / Folio</Label>
              <Input
                id="receiptNumber"
                className="h-20 rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800 font-black text-2xl uppercase font-mono tracking-wider"
                value={formData.receiptNumber}
                onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
                placeholder="0001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
             {/* Fecha - Automática pero editable */}
             <div className="space-y-3">
              <Label htmlFor="paymentDate" className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Fecha Operativa (Valor)</Label>
              <div className="relative group">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 transition-transform group-focus-within:scale-110" />
                <Input
                  id="paymentDate"
                  type="date"
                  className="pl-14 h-16 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 font-black text-xl md:text-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                  value={formData.paymentDate}
                  onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                />
              </div>
            </div>

             {/* Método - Solo selección */}
             <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Lugar de Recaudación</Label>
              <Select 
                value={formData.collectionMethod} 
                onValueChange={(value: any) => handleInputChange('collectionMethod', value)}
              >
                <SelectTrigger className="h-16 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 font-black text-lg md:text-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-2xl p-2">
                  <SelectItem value="field" className="font-black text-lg py-3 rounded-xl focus:bg-blue-50 focus:text-blue-700">🚀 Trabajo de Campo</SelectItem>
                  <SelectItem value="home" className="font-black text-lg py-3 rounded-xl focus:bg-blue-50 focus:text-blue-700">🏠 Domicilio Cliente</SelectItem>
                  <SelectItem value="office" className="font-black text-lg py-3 rounded-xl focus:bg-blue-50 focus:text-blue-700">🏢 Oficina Central</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location - Hidden pero capturado */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200">
            <MapPin className={cn(
              "h-4 w-4 animate-bounce",
              formData.collectorLocation.includes(',') ? "text-green-500" : "text-orange-500"
            )} />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Ubicación GPS: {formData.collectorLocation}
            </span>
          </div>

          {/* Penalizaciones por Cobrar - Mostrar solo si hay */}
          {pendingPenalties.length > 0 && (
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl">
                    <ShieldAlert className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white">Multas por Incumplimiento</h4>
                    <p className="text-[10px] font-bold text-slate-400">Seleccione las multas de $200 que desea cobrar ahora</p>
                  </div>
                </div>
                <Badge className="bg-orange-100 text-orange-700 font-black border-0 rounded-full h-6 px-3">
                  {pendingPenalties.length} pendientes
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingPenalties.map((penalty) => (
                  <div 
                    key={penalty.id}
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer active:scale-95",
                      formData.penaltyIds.includes(penalty.id) 
                        ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800" 
                        : "bg-white border-gray-50 hover:border-gray-200 dark:bg-gray-900 dark:border-gray-800"
                    )}
                    onClick={() => togglePenalty(penalty)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        formData.penaltyIds.includes(penalty.id) ? "bg-orange-600 border-orange-600" : "border-gray-200"
                      )}>
                        {formData.penaltyIds.includes(penalty.id) && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                      <div className="space-y-0.5">
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-tighter",
                          formData.penaltyIds.includes(penalty.id) ? "text-orange-700" : "text-gray-400"
                        )}>
                          Pag.# {penalty.installment?.paymentNumber || 'N/A'} • {penalty.createdAt ? new Date(penalty.createdAt).toLocaleDateString() : ''}
                        </p>
                        <p className="text-sm font-black text-slate-700 dark:text-gray-200">${penalty.amount}</p>
                      </div>
                    </div>
                    {formData.penaltyIds.includes(penalty.id) && (
                      <Badge className="bg-orange-600 text-white border-0 font-black text-[9px] uppercase tracking-widest">Cobrar</Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-4 bg-orange-100/30 rounded-2xl border border-dashed border-orange-200">
                <ShieldCheck className="h-4 w-4 text-orange-600" />
                <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">
                  Total seleccionado en multas: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(formData.penaltyIds.length * 200)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons - Grandes para PWA */}
      <div className="flex gap-4 pt-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={onCancel} 
          disabled={processing}
          className="h-20 w-1/3 rounded-3xl font-black text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all border-gray-200"
        >
          Anular
        </Button>
        <Button 
          size="lg"
          onClick={processCashPayment} 
          disabled={processing || !formData.amount}
          className="flex-1 h-20 rounded-3xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-black text-xl uppercase tracking-widest active:scale-95 transition-all text-white"
        >
          {processing ? (
            <RefreshCw className="h-8 w-8 animate-spin" />
          ) : (
            <div className="flex items-center gap-3">
              <Save className="h-6 w-6" />
              GUARDAR
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CashPaymentForm;
