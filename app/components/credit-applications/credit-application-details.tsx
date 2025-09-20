
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { getCreditApplicationById, CreditApplicationWithClient, getApplicationStatusLabel, getApplicationStatusColor, getLoanTypeLabel } from '@/lib/api/credit-applications';
import { ApplicationStatus } from '@prisma/client';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  FileText, 
  User, 
  DollarSign, 
  Calendar, 
  Target, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  TrendingUp
} from 'lucide-react';

interface CreditApplicationDetailsProps {
  applicationId: string;
  onClose: () => void;
}

export function CreditApplicationDetails({ applicationId, onClose }: CreditApplicationDetailsProps) {
  const [application, setApplication] = useState<CreditApplicationWithClient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplication = async () => {
      try {
        setLoading(true);
        const data = await getCreditApplicationById(applicationId);
        setApplication(data);
      } catch (error) {
        console.error('Error loading application:', error);
        toast.error('Error al cargar los detalles de la solicitud');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [applicationId, onClose]);

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Cargando detalles...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!application) {
    return null;
  }

  const getStatusIcon = () => {
    switch (application.status) {
      case ApplicationStatus.APPROVED:
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case ApplicationStatus.REJECTED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case ApplicationStatus.UNDER_REVIEW:
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const calculateDebtToIncomeRatio = () => {
    if (!application.client.monthlyIncome || !application.approvedAmount || !application.approvedTerm || !application.interestRate) {
      return null;
    }

    const monthlyRate = Number(application.interestRate) / 12;
    const approvedAmountNum = Number(application.approvedAmount);
    const monthlyPayment = (approvedAmountNum * monthlyRate * Math.pow(1 + monthlyRate, application.approvedTerm)) /
                          (Math.pow(1 + monthlyRate, application.approvedTerm) - 1);
    
    return (monthlyPayment / application.client.monthlyIncome) * 100;
  };

  const debtToIncomeRatio = calculateDebtToIncomeRatio();

  const getRiskAssessment = () => {
    const score = application.client.creditScore || 0;
    const income = application.client.monthlyIncome || 0;
    const requestedAmount = Number(application.requestedAmount);

    if (score >= 750 && income >= requestedAmount * 0.3) return { level: 'Bajo', color: 'text-green-600' };
    if (score >= 650 && income >= requestedAmount * 0.25) return { level: 'Medio', color: 'text-yellow-600' };
    return { level: 'Alto', color: 'text-red-600' };
  };

  const riskAssessment = getRiskAssessment();

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            Detalles de la Solicitud de Crédito
            <Badge className={getApplicationStatusColor(application.status)}>
              {getStatusIcon()}
              <span className="ml-2">{getApplicationStatusLabel(application.status)}</span>
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">${application.requestedAmount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Monto Solicitado</div>
                </div>
                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{application.requestedTerm}</div>
                  <div className="text-sm text-gray-600">Meses</div>
                </div>
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-lg font-bold">{getLoanTypeLabel(application.loanType)}</div>
                  <div className="text-sm text-gray-600">Tipo de Préstamo</div>
                </div>
                <div className="text-center">
                  <TrendingUp className={`h-8 w-8 mx-auto mb-2 ${riskAssessment.color}`} />
                  <div className={`text-2xl font-bold ${riskAssessment.color}`}>{riskAssessment.level}</div>
                  <div className="text-sm text-gray-600">Nivel de Riesgo</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Nombre Completo</div>
                    <div className="font-medium">{application.client.firstName} {application.client.lastName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Teléfono</div>
                    <div>{application.client.phone}</div>
                  </div>
                </div>

                {application.client.email && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div>{application.client.email}</div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Ingresos Mensuales</div>
                    <div className="text-lg font-semibold text-green-600">
                      {application.client.monthlyIncome 
                        ? `$${application.client.monthlyIncome.toLocaleString()}`
                        : 'No especificado'
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Score Crediticio</div>
                    <div className="text-lg font-semibold">
                      {application.client.creditScore || 'No disponible'}
                      {application.client.creditScore && (
                        <span className={`ml-2 text-sm ${
                          application.client.creditScore >= 750 ? 'text-green-600' :
                          application.client.creditScore >= 650 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {application.client.creditScore >= 750 ? 'Excelente' :
                           application.client.creditScore >= 650 ? 'Bueno' :
                           'Regular'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {application.client.employmentType && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Tipo de Empleo</div>
                    <div>{
                      application.client.employmentType === 'EMPLOYED' ? 'Empleado' :
                      application.client.employmentType === 'SELF_EMPLOYED' ? 'Independiente' :
                      application.client.employmentType === 'UNEMPLOYED' ? 'Desempleado' :
                      application.client.employmentType === 'RETIRED' ? 'Jubilado' :
                      application.client.employmentType === 'STUDENT' ? 'Estudiante' :
                      application.client.employmentType
                    }</div>
                  </div>
                )}

                {application.client.employerName && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Empresa</div>
                    <div>{application.client.employerName}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Detalles de la Solicitud
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Fecha de Solicitud</div>
                  <div>{format(new Date(application.createdAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">Creada por</div>
                  <div>{application.createdBy.firstName} {application.createdBy.lastName}</div>
                  <div className="text-sm text-gray-600">{application.createdBy.email}</div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm font-medium text-gray-500">Propósito del Préstamo</div>
                  <div className="p-3 bg-gray-50 rounded-lg mt-1">
                    {application.purpose}
                  </div>
                </div>

                {debtToIncomeRatio && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Ratio Deuda/Ingreso Estimado</div>
                    <div className={`text-lg font-semibold ${
                      debtToIncomeRatio <= 30 ? 'text-green-600' :
                      debtToIncomeRatio <= 40 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {debtToIncomeRatio.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">
                      {debtToIncomeRatio <= 30 ? 'Excelente capacidad de pago' :
                       debtToIncomeRatio <= 40 ? 'Capacidad de pago aceptable' :
                       'Capacidad de pago limitada'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Review Information */}
          {application.reviewedByUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Información de Revisión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Revisado por</div>
                    <div>{application.reviewedByUser.firstName} {application.reviewedByUser.lastName}</div>
                    <div className="text-sm text-gray-600">{application.reviewedByUser.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Fecha de Revisión</div>
                    <div>
                      {application.reviewedAt 
                        ? format(new Date(application.reviewedAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })
                        : 'No disponible'
                      }
                    </div>
                  </div>
                </div>

                {application.reviewComments && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Comentarios</div>
                    <div className="p-3 bg-gray-50 rounded-lg mt-1">
                      {application.reviewComments}
                    </div>
                  </div>
                )}

                {application.status === ApplicationStatus.APPROVED && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-3">Términos Aprobados</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Monto Aprobado</div>
                        <div className="text-xl font-bold text-green-600">
                          ${application.approvedAmount?.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Plazo Aprobado</div>
                        <div className="text-xl font-bold text-green-600">
                          {application.approvedTerm} meses
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Tasa de Interés</div>
                        <div className="text-xl font-bold text-green-600">
                          {(Number(application.interestRate || 0) * 100).toFixed(2)}% anual
                        </div>
                      </div>
                    </div>

                    {application.approvedAmount && application.approvedTerm && application.interestRate && (
                      <div className="mt-4 p-3 bg-white rounded border">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Pago Mensual Estimado:</span><br />
                            <span className="text-lg font-semibold">
                              ${((Number(application.approvedAmount) * (Number(application.interestRate) / 12) * Math.pow(1 + Number(application.interestRate) / 12, application.approvedTerm)) /
                                (Math.pow(1 + Number(application.interestRate) / 12, application.approvedTerm) - 1)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Total a Pagar:</span><br />
                            <span className="text-lg font-semibold">
                              ${((Number(application.approvedAmount) * (Number(application.interestRate) / 12) * Math.pow(1 + Number(application.interestRate) / 12, application.approvedTerm)) /
                                (Math.pow(1 + Number(application.interestRate) / 12, application.approvedTerm) - 1) * application.approvedTerm).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Associated Loan */}
          {application.loan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Préstamo Asociado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Préstamo #{application.loan.loanNumber}</div>
                    <div className="text-sm text-gray-600">
                      Estado: <Badge variant="outline">{application.loan.status}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Préstamo
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
