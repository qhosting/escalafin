'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  ArrowRight, 
  DollarSign, 
  Calendar, 
  Calculator,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  calculateLoanDetails, 
  generateAmortizationSchedule,
  getWeeklyInterestAmount
} from '@/lib/loan-calculations';

interface RefinanceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  loan: {
    id: string;
    loanNumber: string;
    clientId: string;
    balanceRemaining: number;
    principalAmount: number;
    loanType: string;
    loanCalculationType?: string;
    interestRate: number;
    paymentFrequency: string;
    termMonths: number;
    client: {
      firstName: string;
      lastName: string;
    };
  };
  onSuccess: () => void;
}

export function RefinanceModal({ isOpen, onOpenChange, loan, onSuccess }: RefinanceModalProps) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'REFINANCE' | 'RENEWAL'>('REFINANCE');
  const [loading, setLoading] = useState(false);

  // New Loan State
  const [formData, setFormData] = useState({
    principalAmount: '',
    termMonths: '16',
    interestRate: (loan.interestRate * 100).toString(),
    startDate: format(new Date(), 'yyyy-MM-dd'),
    loanCalculationType: loan.loanCalculationType || 'INTERES',
    paymentFrequency: loan.paymentFrequency || 'SEMANAL',
    weeklyInterestAmount: '',
    insuranceAmount: '0',
    disbursementFee: '0',
  });

  const [calculation, setCalculation] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);

  // Efecto para inicializar monto si es refinanciamiento
  useEffect(() => {
    if (mode === 'REFINANCE') {
      // Por defecto sugerimos el saldo actual + algo extra o simplemente cubrir el saldo
      setFormData(prev => ({ 
        ...prev, 
        principalAmount: Math.ceil(loan.balanceRemaining).toString() 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        principalAmount: loan.principalAmount.toString() 
      }));
    }
  }, [mode, loan]);

  // Recalcular automáticamente cuando cambian valores clave
  useEffect(() => {
    handleCalculate();
  }, [formData.principalAmount, formData.termMonths, formData.interestRate, formData.paymentFrequency, formData.loanCalculationType]);

  const handleCalculate = () => {
    const principal = parseFloat(formData.principalAmount);
    const term = parseInt(formData.termMonths);
    if (!principal || !term) return;

    try {
      const result = calculateLoanDetails({
        loanCalculationType: formData.loanCalculationType as any,
        principalAmount: principal,
        numberOfPayments: term,
        paymentFrequency: formData.paymentFrequency as any,
        annualInterestRate: parseFloat(formData.interestRate) / 100,
        weeklyInterestAmount: formData.weeklyInterestAmount ? parseFloat(formData.weeklyInterestAmount) : undefined,
        startDate: new Date(formData.startDate)
      });

      const newSchedule = generateAmortizationSchedule({
        principalAmount: principal,
        numberOfPayments: term,
        paymentFrequency: formData.paymentFrequency as any,
        loanCalculationType: formData.loanCalculationType as any,
        annualInterestRate: parseFloat(formData.interestRate) / 100,
        weeklyInterestAmount: parseFloat(formData.weeklyInterestAmount || '0'),
        startDate: new Date(formData.startDate),
        paymentAmount: result.paymentAmount
      });

      setCalculation(result);
      setSchedule(newSchedule);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirm = async () => {
    if (!calculation) return;

    try {
      setLoading(true);
      const endpoint = mode === 'REFINANCE' 
        ? `/api/loans/${loan.id}/refinance` 
        : `/api/loans/${loan.id}/renew`;

      const body = {
        newLoanData: {
          loanType: loan.loanType,
          principalAmount: parseFloat(formData.principalAmount),
          interestRate: parseFloat(formData.interestRate) / 100,
          termMonths: parseInt(formData.termMonths),
          startDate: formData.startDate,
          loanCalculationType: formData.loanCalculationType,
          paymentFrequency: formData.paymentFrequency,
          weeklyInterestAmount: formData.weeklyInterestAmount ? parseFloat(formData.weeklyInterestAmount) : undefined,
          insuranceAmount: parseFloat(formData.insuranceAmount),
          disbursementFee: parseFloat(formData.disbursementFee),
        },
        settlementAmount: mode === 'REFINANCE' ? loan.balanceRemaining : 0,
        notes: mode === 'REFINANCE' 
          ? `Refinanciamiento del préstamo ${loan.loanNumber}` 
          : `Renovación del préstamo ${loan.loanNumber}`
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al procesar');
      }

      toast.success(mode === 'REFINANCE' ? 'Refinanciamiento completado' : 'Renovación completada');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 rounded-[2rem] border-none shadow-2xl">
        {/* Header con gradiente premium */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <RefreshCw className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {mode === 'REFINANCE' ? 'Refinanciamiento' : 'Renovación'} de Crédito
            </DialogTitle>
          </div>
          <DialogDescription className="text-blue-100 font-medium">
            Gestiona la continuidad crediticia para <strong>{loan.client.firstName} {loan.client.lastName}</strong>.
          </DialogDescription>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto bg-slate-50/50">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Selección de Modo */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('REFINANCE')}
                  className={cn(
                    "relative p-6 rounded-3xl border-2 transition-all text-left group overflow-hidden",
                    mode === 'REFINANCE' 
                      ? "border-blue-500 bg-blue-50/50 shadow-md ring-4 ring-blue-500/10" 
                      : "border-slate-200 bg-white hover:border-blue-200"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                    mode === 'REFINANCE' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                  )}>
                    <RefreshCw className="h-6 w-6" />
                  </div>
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-wider mb-1">Refinanciar</h3>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">Absorbe el saldo pendiente de ${loan.balanceRemaining.toFixed(0)} en un nuevo crédito.</p>
                  {mode === 'REFINANCE' && <div className="absolute top-4 right-4"><CheckCircle2 className="h-5 w-5 text-blue-600" /></div>}
                </button>

                <button
                  onClick={() => setMode('RENEWAL')}
                  className={cn(
                    "relative p-6 rounded-3xl border-2 transition-all text-left group overflow-hidden",
                    mode === 'RENEWAL' 
                      ? "border-indigo-500 bg-indigo-50/50 shadow-md ring-4 ring-indigo-500/10" 
                      : "border-slate-200 bg-white hover:border-indigo-200"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                    mode === 'RENEWAL' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                  )}>
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-wider mb-1">Renovar</h3>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">Crea un nuevo crédito independiente (usualmente cuando el actual está liquidado).</p>
                  {mode === 'RENEWAL' && <div className="absolute top-4 right-4"><CheckCircle2 className="h-5 w-5 text-indigo-600" /></div>}
                </button>
              </div>

              <Separator />

              {/* Formulario de Configuración */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Nuevo Monto Principal</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="number"
                      value={formData.principalAmount}
                      onChange={(e) => setFormData(p => ({ ...p, principalAmount: e.target.value }))}
                      className="pl-10 h-12 rounded-2xl border-slate-200 font-bold text-lg focus:ring-blue-500"
                    />
                  </div>
                  {mode === 'REFINANCE' && (
                    <p className="text-[10px] text-blue-600 font-bold italic">
                      * El cliente recibirá netos: {formatCurrency(Math.max(0, parseFloat(formData.principalAmount || '0') - loan.balanceRemaining))}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Plazo (Pagos)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="number"
                      value={formData.termMonths}
                      onChange={(e) => setFormData(p => ({ ...p, termMonths: e.target.value }))}
                      className="pl-10 h-12 rounded-2xl border-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Tipo de Cálculo</Label>
                  <Select 
                    value={formData.loanCalculationType} 
                    onValueChange={(v) => setFormData(p => ({ ...p, loanCalculationType: v }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-medium bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERES">Interés Tradicional</SelectItem>
                      <SelectItem value="TARIFA_FIJA">Tarifa Fija</SelectItem>
                      <SelectItem value="INTERES_SEMANAL">Interés Semanal</SelectItem>
                      <SelectItem value="POR_MIL_120">$120 por cada $1000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Frecuencia</Label>
                  <Select 
                    value={formData.paymentFrequency} 
                    onValueChange={(v) => setFormData(p => ({ ...p, paymentFrequency: v }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-medium bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEMANAL">Semanal</SelectItem>
                      <SelectItem value="CATORCENAL">Catorcenal</SelectItem>
                      <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                      <SelectItem value="MENSUAL">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resumen del Cálculo Rápido */}
              {calculation && (
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Resumen del Nuevo Crédito</h4>
                    <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-700 border-blue-100 font-bold px-3">
                      {formData.termMonths} Pagos
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Cuota</p>
                      <p className="text-xl font-black text-slate-900">{formatCurrency(calculation.paymentAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                      <p className="text-xl font-black text-slate-900">{formatCurrency(calculation.totalAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Termina</p>
                      <p className="text-[12px] font-black text-blue-600 mt-1">{format(calculation.endDate, 'dd MMM yyyy', { locale: es })}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex gap-4">
                <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-black text-amber-900 uppercase text-xs mb-1">Confirmar Operación</h4>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    {mode === 'REFINANCE' 
                      ? `Se liquidará el préstamo ${loan.loanNumber} (saldo ${formatCurrency(loan.balanceRemaining)}) y se creará uno nuevo por ${formatCurrency(parseFloat(formData.principalAmount))}.`
                      : `Se creará un nuevo préstamo de ${formatCurrency(parseFloat(formData.principalAmount))} para el cliente.`
                    } Esta acción es irreversible y afectará los reportes financieros.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400">Previsualización de Amortización</h4>
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                  <table className="w-full text-[10px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold text-slate-500 uppercase">#</th>
                        <th className="px-4 py-2 text-left font-bold text-slate-500 uppercase">Fecha</th>
                        <th className="px-4 py-2 text-right font-bold text-slate-500 uppercase">Cuota</th>
                        <th className="px-4 py-2 text-right font-bold text-slate-500 uppercase">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-2 text-slate-600">{row.paymentNumber}</td>
                          <td className="px-4 py-2 text-slate-900 font-medium">{format(row.paymentDate, 'dd/MM/yyyy')}</td>
                          <td className="px-4 py-2 text-right font-bold text-blue-600">{formatCurrency(row.totalPayment)}</td>
                          <td className="px-4 py-2 text-right text-slate-500">{formatCurrency(row.remainingBalance)}</td>
                        </tr>
                      ))}
                      {schedule.length > 5 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-center text-slate-400 italic font-medium">
                            ... y {schedule.length - 5} pagos más
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con controles de navegación */}
        <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
            className="rounded-2xl font-bold h-12 px-6"
          >
            {step === 1 ? 'Cancelar' : 'Regresar'}
          </Button>

          <Button 
            onClick={() => step < 2 ? setStep(step + 1) : handleConfirm()}
            disabled={loading || !calculation}
            className={cn(
              "rounded-2xl font-black h-12 px-8 shadow-lg transition-all",
              step === 2 ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            ) : step === 2 ? (
              <CheckCircle2 className="h-5 w-5 mr-2" />
            ) : (
              <Calculator className="h-5 w-5 mr-2" />
            )}
            {step === 2 ? 'Confirmar y Crear' : 'Siguiente Paso'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
