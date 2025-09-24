
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { reviewCreditApplication, CreditApplicationWithClient, getApplicationStatusLabel, getApplicationStatusColor, getLoanTypeLabel } from '@/lib/api/credit-applications';
import { ApplicationStatus } from '@prisma/client';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';

interface CreditApplicationReviewProps {
  application: CreditApplicationWithClient;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ReviewFormData {
  status: ApplicationStatus;
  reviewComments: string;
  approvedAmount: string;
  approvedTerm: string;
  interestRate: string;
}

export function CreditApplicationReview({ application, onSuccess, onCancel }: CreditApplicationReviewProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormData>({
    defaultValues: {
      status: '' as ApplicationStatus,
      reviewComments: '',
      approvedAmount: application.requestedAmount.toString(),
      approvedTerm: application.requestedTerm.toString(),
      interestRate: '0.12', // Default 12% annual
    },
  });

  const watchedStatus = watch('status');

  const onSubmit = async (data: ReviewFormData) => {
    try {
      setLoading(true);

      const reviewData = {
        status: data.status,
        reviewComments: data.reviewComments || undefined,
        approvedAmount: data.status === ApplicationStatus.APPROVED ? parseFloat(data.approvedAmount) : undefined,
        approvedTerm: data.status === ApplicationStatus.APPROVED ? parseInt(data.approvedTerm) : undefined,
        interestRate: data.status === ApplicationStatus.APPROVED ? parseFloat(data.interestRate) : undefined,
      };

      await reviewCreditApplication(application.id, reviewData);
      
      toast.success('Solicitud revisada exitosamente');
      onSuccess();
    } catch (error) {
      console.error('Error reviewing application:', error);
      toast.error(error instanceof Error ? error.message : 'Error al revisar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case ApplicationStatus.REJECTED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const calculateMonthlyPayment = (amount: number, rate: number, term: number): number => {
    const monthlyRate = rate / 12;
    return (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
  };

  const approvedAmount = parseFloat(watch('approvedAmount') || '0');
  const approvedTerm = parseInt(watch('approvedTerm') || '0');
  const interestRate = parseFloat(watch('interestRate') || '0');
  const monthlyPayment = approvedAmount && approvedTerm && interestRate 
    ? calculateMonthlyPayment(approvedAmount, interestRate, approvedTerm)
    : 0;

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Revisar Solicitud de Crédito
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Solicitud</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium">Cliente</Label>
                    <p className="text-sm">{application.client.firstName} {application.client.lastName}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Contacto</Label>
                    <p className="text-sm">{application.client.phone}</p>
                    {application.client.email && <p className="text-sm text-gray-600">{application.client.email}</p>}
                  </div>
                  <div>
                    <Label className="font-medium">Tipo de Préstamo</Label>
                    <p className="text-sm">{getLoanTypeLabel(application.loanType)}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Estado Actual</Label>
                    <div className="mt-1">
                      <Badge className={getApplicationStatusColor(application.status)}>
                        {getApplicationStatusLabel(application.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="font-medium">Monto Solicitado</Label>
                    <p className="text-sm">${application.requestedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Plazo Solicitado</Label>
                    <p className="text-sm">{application.requestedTerm} meses</p>
                  </div>
                  <div>
                    <Label className="font-medium">Ingresos Mensuales</Label>
                    <p className="text-sm">
                      {application.client.monthlyIncome 
                        ? `$${application.client.monthlyIncome.toLocaleString()}`
                        : 'No especificado'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Score Crediticio</Label>
                    <p className="text-sm">{application.client.creditScore || 'No disponible'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Label className="font-medium">Propósito del Préstamo</Label>
                <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{application.purpose}</p>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Solicitud creada el {format(new Date(application.createdAt), "dd 'de' MMM, yyyy 'a las' HH:mm", { locale: es })} 
                por {application.createdBy.firstName} {application.createdBy.lastName}
              </div>
            </CardContent>
          </Card>

          {/* Review Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Decisión de Revisión</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Decision */}
                <div className="space-y-2">
                  <Label htmlFor="status">Decisión *</Label>
                  <Select
                    value={watchedStatus}
                    onValueChange={(value: ApplicationStatus) => setValue('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar decisión" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ApplicationStatus.UNDER_REVIEW}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ApplicationStatus.UNDER_REVIEW)}
                          En Revisión
                        </div>
                      </SelectItem>
                      <SelectItem value={ApplicationStatus.APPROVED}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ApplicationStatus.APPROVED)}
                          Aprobar
                        </div>
                      </SelectItem>
                      <SelectItem value={ApplicationStatus.REJECTED}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ApplicationStatus.REJECTED)}
                          Rechazar
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-600">Selecciona una decisión</p>
                  )}
                </div>

                {/* Approval Details - Only show if approved */}
                {watchedStatus === ApplicationStatus.APPROVED && (
                  <div className="space-y-4 p-4 border border-green-200 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800">Detalles de Aprobación</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="approvedAmount">Monto Aprobado *</Label>
                        <Input
                          id="approvedAmount"
                          type="number"
                          step="0.01"
                          min="1000"
                          max={Number(application.requestedAmount) * 1.5} // Max 150% of requested
                          {...register('approvedAmount', {
                            required: 'El monto aprobado es requerido',
                            min: { value: 1000, message: 'El monto mínimo es $1,000' },
                            max: { 
                              value: Number(application.requestedAmount) * 1.5, 
                              message: `El monto máximo es $${(Number(application.requestedAmount) * 1.5).toLocaleString()}` 
                            },
                          })}
                          className={errors.approvedAmount ? 'border-red-500' : ''}
                        />
                        {errors.approvedAmount && (
                          <p className="text-sm text-red-600">{errors.approvedAmount.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="approvedTerm">Plazo Aprobado (meses) *</Label>
                        <Input
                          id="approvedTerm"
                          type="number"
                          min="1"
                          max="360"
                          {...register('approvedTerm', {
                            required: 'El plazo aprobado es requerido',
                            min: { value: 1, message: 'El plazo mínimo es 1 mes' },
                            max: { value: 360, message: 'El plazo máximo es 360 meses' },
                          })}
                          className={errors.approvedTerm ? 'border-red-500' : ''}
                        />
                        {errors.approvedTerm && (
                          <p className="text-sm text-red-600">{errors.approvedTerm.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="interestRate">Tasa de Interés Anual *</Label>
                        <Input
                          id="interestRate"
                          type="number"
                          step="0.0001"
                          min="0.01"
                          max="0.50"
                          placeholder="0.12 (12%)"
                          {...register('interestRate', {
                            required: 'La tasa de interés es requerida',
                            min: { value: 0.01, message: 'La tasa mínima es 1%' },
                            max: { value: 0.50, message: 'La tasa máxima es 50%' },
                          })}
                          className={errors.interestRate ? 'border-red-500' : ''}
                        />
                        {errors.interestRate && (
                          <p className="text-sm text-red-600">{errors.interestRate.message}</p>
                        )}
                        <p className="text-xs text-gray-600">
                          Tasa: {((interestRate || 0) * 100).toFixed(2)}% anual
                        </p>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    {monthlyPayment > 0 && (
                      <div className="mt-4 p-3 bg-white rounded border">
                        <h5 className="font-medium mb-2">Resumen de Pagos</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Pago Mensual:</span><br />
                            ${monthlyPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div>
                            <span className="font-medium">Total a Pagar:</span><br />
                            ${(monthlyPayment * approvedTerm).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Comments */}
                <div className="space-y-2">
                  <Label htmlFor="reviewComments">
                    Comentarios {watchedStatus === ApplicationStatus.REJECTED && '(Requeridos)'}
                  </Label>
                  <Textarea
                    id="reviewComments"
                    placeholder="Ingresa comentarios sobre la decisión..."
                    rows={4}
                    {...register('reviewComments', {
                      required: watchedStatus === ApplicationStatus.REJECTED ? 'Los comentarios son requeridos para rechazar' : false,
                      maxLength: { value: 1000, message: 'Los comentarios no pueden exceder 1000 caracteres' },
                    })}
                    className={errors.reviewComments ? 'border-red-500' : ''}
                  />
                  {errors.reviewComments && (
                    <p className="text-sm text-red-600">{errors.reviewComments.message}</p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                    variant={watchedStatus === ApplicationStatus.APPROVED ? 'default' : 
                            watchedStatus === ApplicationStatus.REJECTED ? 'destructive' : 'secondary'}
                  >
                    {loading ? 'Procesando...' : `${
                      watchedStatus === ApplicationStatus.APPROVED ? 'Aprobar Solicitud' :
                      watchedStatus === ApplicationStatus.REJECTED ? 'Rechazar Solicitud' :
                      'Actualizar Estado'
                    }`}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
