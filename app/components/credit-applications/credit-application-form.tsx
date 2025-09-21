
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createCreditApplication, CreateCreditApplicationData } from '@/lib/api/credit-applications';
import { getClients, ClientWithDetails } from '@/lib/api/clients';
import { LoanType } from '@prisma/client';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';

interface CreditApplicationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedClientId?: string;
}

interface FormData {
  clientId: string;
  loanType: LoanType;
  requestedAmount: string;
  requestedTerm: string;
  purpose: string;
}

export function CreditApplicationForm({ 
  onSuccess, 
  onCancel, 
  preselectedClientId 
}: CreditApplicationFormProps) {
  const { data: session } = useSession() || {};
  const [clients, setClients] = useState<ClientWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      clientId: preselectedClientId || '',
      loanType: '' as LoanType,
      requestedAmount: '',
      requestedTerm: '',
      purpose: '',
    },
  });

  const watchedClientId = watch('clientId');
  const watchedLoanType = watch('loanType');

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const clientsData = await getClients({});
        setClients(Array.isArray(clientsData) ? clientsData : []);
      } catch (error) {
        console.error('Error loading clients:', error);
        toast.error('Error al cargar clientes');
        setClients([]); // Asegurar que clients sea siempre un array
      } finally {
        setLoadingClients(false);
      }
    };

    if (session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.ASESOR) {
      loadClients();
    }
  }, [session]);

  useEffect(() => {
    if (preselectedClientId) {
      setValue('clientId', preselectedClientId);
    }
  }, [preselectedClientId, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      const applicationData: CreateCreditApplicationData = {
        clientId: data.clientId,
        loanType: data.loanType,
        requestedAmount: parseFloat(data.requestedAmount),
        requestedTerm: parseInt(data.requestedTerm),
        purpose: data.purpose,
      };

      await createCreditApplication(applicationData);
      
      toast.success('Solicitud de crédito creada exitosamente');
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating credit application:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear solicitud');
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = Array.isArray(clients) ? clients.find(client => client.id === watchedClientId) : undefined;

  const getLoanTypeOptions = () => [
    { value: LoanType.PERSONAL, label: 'Préstamo Personal' },
    { value: LoanType.BUSINESS, label: 'Préstamo Empresarial' },
    { value: LoanType.MORTGAGE, label: 'Hipoteca' },
    { value: LoanType.AUTO, label: 'Préstamo Automotriz' },
    { value: LoanType.EDUCATION, label: 'Préstamo Educativo' },
  ];

  const getMaxLoanAmount = (loanType: LoanType) => {
    const maxAmounts = {
      [LoanType.PERSONAL]: 500000,
      [LoanType.BUSINESS]: 2000000,
      [LoanType.MORTGAGE]: 5000000,
      [LoanType.AUTO]: 1000000,
      [LoanType.EDUCATION]: 300000,
    };
    return maxAmounts[loanType];
  };

  const getMaxTerm = (loanType: LoanType) => {
    const maxTerms = {
      [LoanType.PERSONAL]: 60,
      [LoanType.BUSINESS]: 120,
      [LoanType.MORTGAGE]: 360,
      [LoanType.AUTO]: 84,
      [LoanType.EDUCATION]: 120,
    };
    return maxTerms[loanType];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Solicitud de Crédito</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente *</Label>
            {loadingClients ? (
              <div className="p-2 border rounded">Cargando clientes...</div>
            ) : (
              <Select
                value={watchedClientId}
                onValueChange={(value) => setValue('clientId', value)}
                disabled={!!preselectedClientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(clients) && clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {`${client.firstName} ${client.lastName} - ${client.email || client.phone}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.clientId && (
              <p className="text-sm text-red-600">Selecciona un cliente</p>
            )}
          </div>

          {/* Client Information Display */}
          {selectedClient && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Información del Cliente</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span> {selectedClient.firstName} {selectedClient.lastName}
                </div>
                <div>
                  <span className="font-medium">Teléfono:</span> {selectedClient.phone}
                </div>
                <div>
                  <span className="font-medium">Ingresos:</span> {
                    selectedClient.monthlyIncome 
                      ? `$${selectedClient.monthlyIncome.toLocaleString()}/mes`
                      : 'No especificado'
                  }
                </div>
                <div>
                  <span className="font-medium">Score Crediticio:</span> {selectedClient.creditScore || 'No disponible'}
                </div>
              </div>
            </div>
          )}

          {/* Loan Type */}
          <div className="space-y-2">
            <Label htmlFor="loanType">Tipo de Préstamo *</Label>
            <Select
              value={watchedLoanType}
              onValueChange={(value: LoanType) => setValue('loanType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de préstamo" />
              </SelectTrigger>
              <SelectContent>
                {getLoanTypeOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.loanType && (
              <p className="text-sm text-red-600">Selecciona un tipo de préstamo</p>
            )}
          </div>

          {/* Requested Amount */}
          <div className="space-y-2">
            <Label htmlFor="requestedAmount">Monto Solicitado *</Label>
            <Input
              id="requestedAmount"
              type="number"
              step="0.01"
              min="1000"
              max={watchedLoanType ? getMaxLoanAmount(watchedLoanType) : undefined}
              placeholder="0.00"
              {...register('requestedAmount', {
                required: 'El monto es requerido',
                min: { value: 1000, message: 'El monto mínimo es $1,000' },
                max: watchedLoanType ? {
                  value: getMaxLoanAmount(watchedLoanType),
                  message: `El monto máximo para este tipo de préstamo es $${getMaxLoanAmount(watchedLoanType).toLocaleString()}`
                } : undefined,
              })}
              className={errors.requestedAmount ? 'border-red-500' : ''}
            />
            {errors.requestedAmount && (
              <p className="text-sm text-red-600">{errors.requestedAmount.message}</p>
            )}
            {watchedLoanType && (
              <p className="text-xs text-gray-500">
                Máximo permitido: ${getMaxLoanAmount(watchedLoanType).toLocaleString()}
              </p>
            )}
          </div>

          {/* Requested Term */}
          <div className="space-y-2">
            <Label htmlFor="requestedTerm">Plazo Solicitado (meses) *</Label>
            <Input
              id="requestedTerm"
              type="number"
              min="1"
              max={watchedLoanType ? getMaxTerm(watchedLoanType) : 360}
              placeholder="12"
              {...register('requestedTerm', {
                required: 'El plazo es requerido',
                min: { value: 1, message: 'El plazo mínimo es 1 mes' },
                max: watchedLoanType ? {
                  value: getMaxTerm(watchedLoanType),
                  message: `El plazo máximo para este tipo de préstamo es ${getMaxTerm(watchedLoanType)} meses`
                } : { value: 360, message: 'El plazo máximo es 360 meses' },
              })}
              className={errors.requestedTerm ? 'border-red-500' : ''}
            />
            {errors.requestedTerm && (
              <p className="text-sm text-red-600">{errors.requestedTerm.message}</p>
            )}
            {watchedLoanType && (
              <p className="text-xs text-gray-500">
                Máximo permitido: {getMaxTerm(watchedLoanType)} meses
              </p>
            )}
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Propósito del Préstamo *</Label>
            <Textarea
              id="purpose"
              placeholder="Describe el propósito del préstamo..."
              rows={3}
              {...register('purpose', {
                required: 'El propósito es requerido',
                minLength: { value: 10, message: 'El propósito debe tener al menos 10 caracteres' },
                maxLength: { value: 500, message: 'El propósito no puede exceder 500 caracteres' },
              })}
              className={errors.purpose ? 'border-red-500' : ''}
            />
            {errors.purpose && (
              <p className="text-sm text-red-600">{errors.purpose.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Creando...' : 'Crear Solicitud'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
