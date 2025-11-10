
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, Calculator, DollarSign, Calendar, User, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface LoanFormProps {
  loanId?: string;
  userRole?: string;
}

const loanSchema = z.object({
  clientId: z.string().min(1, 'Selecciona un cliente'),
  loanType: z.string().min(1, 'Selecciona el tipo de préstamo'),
  principalAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Ingresa un monto válido mayor a 0'
  }),
  interestRate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Ingresa una tasa válida mayor a 0'
  }),
  termMonths: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Ingresa un plazo válido mayor a 0'
  }),
  startDate: z.date({
    required_error: 'Selecciona la fecha de inicio'
  }),
  purpose: z.string().optional()
});

type LoanFormData = z.infer<typeof loanSchema>;

const loanTypes = [
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'BUSINESS', label: 'Empresarial' },
  { value: 'MORTGAGE', label: 'Hipotecario' },
  { value: 'AUTO', label: 'Automotriz' },
  { value: 'EDUCATION', label: 'Educativo' }
];

export function LoanForm({ loanId, userRole }: LoanFormProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema)
  });

  const watchedValues = watch();

  // Fetch clientes disponibles
  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Error al cargar clientes');

      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error al cargar la lista de clientes');
    } finally {
      setLoadingClients(false);
    }
  };

  // Cargar datos del préstamo para edición
  const fetchLoanData = async () => {
    if (!loanId) return;

    try {
      const response = await fetch(`/api/loans/${loanId}`);
      if (!response.ok) throw new Error('Error al cargar el préstamo');

      const data = await response.json();
      const loan = data.loan; // Desestructurar correctamente la respuesta
      
      if (!loan) {
        throw new Error('Préstamo no encontrado');
      }
      
      reset({
        clientId: loan.clientId,
        loanType: loan.loanType,
        principalAmount: loan.principalAmount.toString(),
        interestRate: loan.interestRate.toString(),
        termMonths: loan.termMonths.toString(),
        startDate: new Date(loan.startDate),
        purpose: loan.purpose || ''
      });
    } catch (error) {
      console.error('Error fetching loan:', error);
      toast.error('Error al cargar los datos del préstamo');
      router.push(`/${userRole?.toLowerCase() || 'admin'}/loans`);
    }
  };

  useEffect(() => {
    fetchClients();
    if (loanId) fetchLoanData();
  }, [loanId]);

  // Calcular pago mensual automáticamente
  useEffect(() => {
    const { principalAmount, interestRate, termMonths } = watchedValues;
    
    if (principalAmount && interestRate && termMonths) {
      const principal = parseFloat(principalAmount);
      const rate = parseFloat(interestRate);
      const term = parseInt(termMonths);
      
      if (principal > 0 && rate > 0 && term > 0) {
        const monthlyRate = rate / 100 / 12;
        const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                       (Math.pow(1 + monthlyRate, term) - 1);
        
        setMonthlyPayment(payment);
        setTotalAmount(payment * term);
      }
    }
  }, [watchedValues.principalAmount, watchedValues.interestRate, watchedValues.termMonths]);

  const onSubmit = async (data: LoanFormData) => {
    try {
      setSubmitting(true);

      // Calcular campos derivados
      const principal = parseFloat(data.principalAmount);
      const rate = parseFloat(data.interestRate);
      const term = parseInt(data.termMonths);
      
      const monthlyRate = rate / 100 / 12;
      const calculatedMonthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                                       (Math.pow(1 + monthlyRate, term) - 1);
      const calculatedTotalAmount = calculatedMonthlyPayment * term;
      
      // Calcular fecha de fin
      const endDate = new Date(data.startDate);
      endDate.setMonth(endDate.getMonth() + term);

      const payload = {
        ...data,
        principalAmount: principal,
        interestRate: rate,
        termMonths: term,
        monthlyPayment: calculatedMonthlyPayment,
        totalAmount: calculatedTotalAmount,
        startDate: data.startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      const url = loanId ? `/api/loans/${loanId}` : '/api/loans';
      const method = loanId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar la solicitud');
      }

      const result = await response.json();
      
      // Obtener el ID del préstamo correctamente según el tipo de respuesta
      const loanIdResult = loanId ? result.loan.id : result.loan.id;
      
      toast.success(loanId ? 'Préstamo actualizado exitosamente' : 'Préstamo creado exitosamente');
      router.push(`/${userRole?.toLowerCase() || 'admin'}/loans/${loanIdResult}`);

    } catch (error: any) {
      console.error('Error submitting loan:', error);
      toast.error(error.message || 'Error al procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/${userRole?.toLowerCase() || 'admin'}/loans`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {loanId ? 'Editar Préstamo' : 'Nuevo Préstamo'}
          </h1>
          <p className="text-gray-600">
            {loanId ? 'Modifica la información del préstamo' : 'Completa los datos para crear un nuevo préstamo'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientId">Cliente *</Label>
              <Select
                value={watchedValues.clientId || ''}
                onValueChange={(value) => setValue('clientId', value)}
                disabled={loadingClients}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingClients ? "Cargando clientes..." : "Selecciona un cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName} - {client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-red-600 mt-1">{errors.clientId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información del Préstamo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Detalles del Préstamo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loanType">Tipo de Préstamo *</Label>
                <Select
                  value={watchedValues.loanType || ''}
                  onValueChange={(value) => setValue('loanType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {loanTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.loanType && (
                  <p className="text-sm text-red-600 mt-1">{errors.loanType.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="principalAmount">Monto del Préstamo *</Label>
                <Input
                  id="principalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('principalAmount')}
                />
                {errors.principalAmount && (
                  <p className="text-sm text-red-600 mt-1">{errors.principalAmount.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="interestRate">Tasa de Interés Anual (%) *</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('interestRate')}
                />
                {errors.interestRate && (
                  <p className="text-sm text-red-600 mt-1">{errors.interestRate.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="termMonths">Plazo (meses) *</Label>
                <Input
                  id="termMonths"
                  type="number"
                  min="1"
                  placeholder="12"
                  {...register('termMonths')}
                />
                {errors.termMonths && (
                  <p className="text-sm text-red-600 mt-1">{errors.termMonths.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <DatePicker
                  selected={watchedValues.startDate}
                  onSelect={(date) => setValue('startDate', date || new Date())}
                  placeholder="Selecciona la fecha de inicio"
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="purpose">Propósito del Préstamo</Label>
              <Textarea
                id="purpose"
                placeholder="Describe el propósito del préstamo..."
                {...register('purpose')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Calculadora de Pagos */}
        {monthlyPayment && totalAmount && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Resumen de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pago Mensual</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(monthlyPayment)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total a Pagar</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total de Intereses</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(totalAmount - parseFloat(watchedValues.principalAmount || '0'))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${userRole?.toLowerCase() || 'admin'}/loans`)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loanId ? 'Actualizar Préstamo' : 'Crear Préstamo'}
          </Button>
        </div>
      </form>
    </div>
  );
}
