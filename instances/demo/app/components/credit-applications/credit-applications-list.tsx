
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  getCreditApplications, 
  CreditApplicationWithClient,
  getApplicationStatusLabel,
  getApplicationStatusColor,
  getLoanTypeLabel,
} from '@/lib/api/credit-applications';
import { ApplicationStatus, UserRole } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { Search, Plus, Eye, FileText, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreditApplicationForm } from './credit-application-form';
import { CreditApplicationReview } from './credit-application-review';
import { CreditApplicationDetails } from './credit-application-details';

export function CreditApplicationsList() {
  const { data: session } = useSession() || {};
  const [applications, setApplications] = useState<CreditApplicationWithClient[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<CreditApplicationWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<CreditApplicationWithClient | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      const data = await getCreditApplications(filters);
      setApplications(data);
      setFilteredApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Error al cargar solicitudes de crédito');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  useEffect(() => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app =>
        `${app.client.firstName} ${app.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.client.phone.includes(searchTerm) ||
        app.purpose.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  }, [searchTerm, applications]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadApplications();
  };

  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    setSelectedApplication(null);
    loadApplications();
  };

  const canReviewApplication = (application: CreditApplicationWithClient) => {
    return session?.user?.role === UserRole.ADMIN && 
           (application.status === ApplicationStatus.PENDING || application.status === ApplicationStatus.UNDER_REVIEW);
  };

  const canCreateApplication = () => {
    return session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.ASESOR;
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Nueva Solicitud de Crédito</h2>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Volver a Lista
          </Button>
        </div>
        <CreditApplicationForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <h2 className="text-2xl font-bold">Solicitudes de Crédito</h2>
          {canCreateApplication() && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Solicitud
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por cliente, email, teléfono o propósito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: ApplicationStatus | 'all') => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Estados</SelectItem>
              <SelectItem value={ApplicationStatus.PENDING}>Pendiente</SelectItem>
              <SelectItem value={ApplicationStatus.UNDER_REVIEW}>En Revisión</SelectItem>
              <SelectItem value={ApplicationStatus.APPROVED}>Aprobada</SelectItem>
              <SelectItem value={ApplicationStatus.REJECTED}>Rechazada</SelectItem>
              <SelectItem value={ApplicationStatus.CANCELLED}>Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Cargando solicitudes...</p>
            </div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay solicitudes de crédito
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No se encontraron solicitudes que coincidan con los filtros'
                  : 'Comienza creando una nueva solicitud de crédito'
                }
              </p>
              {canCreateApplication() && !searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Solicitud
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        {application.client.firstName} {application.client.lastName}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                        <span>{getLoanTypeLabel(application.loanType)}</span>
                        <span>•</span>
                        <span>${application.requestedAmount.toLocaleString()}</span>
                        <span>•</span>
                        <span>{application.requestedTerm} meses</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <Badge className={getApplicationStatusColor(application.status)}>
                        {getApplicationStatusLabel(application.status)}
                      </Badge>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="mr-1 h-3 w-3" />
                        {format(new Date(application.createdAt), "dd 'de' MMM, yyyy", { locale: es })}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Client Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Teléfono:</span><br />
                        {application.client.phone}
                      </div>
                      <div>
                        <span className="font-medium">Ingresos:</span><br />
                        {application.client.monthlyIncome 
                          ? `$${application.client.monthlyIncome.toLocaleString()}/mes`
                          : 'No especificado'
                        }
                      </div>
                      <div>
                        <span className="font-medium">Score:</span><br />
                        {application.client.creditScore || 'No disponible'}
                      </div>
                    </div>

                    {/* Purpose */}
                    <div>
                      <span className="font-medium text-sm">Propósito:</span>
                      <p className="text-sm text-gray-600 mt-1">{application.purpose}</p>
                    </div>

                    {/* Asesor Info */}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Creada por:</span> {application.createdBy.firstName} {application.createdBy.lastName}
                    </div>

                    {/* Review Info */}
                    {application.reviewedByUser && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm">
                          <span className="font-medium">Revisada por:</span> {application.reviewedByUser.firstName} {application.reviewedByUser.lastName}
                        </div>
                        {application.reviewedAt && (
                          <div className="text-xs text-gray-600 mt-1">
                            {format(new Date(application.reviewedAt), "dd 'de' MMM, yyyy 'a las' HH:mm", { locale: es })}
                          </div>
                        )}
                        {application.reviewComments && (
                          <div className="text-sm mt-2">
                            <span className="font-medium">Comentarios:</span>
                            <p className="text-gray-600 mt-1">{application.reviewComments}</p>
                          </div>
                        )}
                        {application.status === ApplicationStatus.APPROVED && (
                          <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                            <div>
                              <span className="font-medium">Monto Aprobado:</span><br />
                              ${application.approvedAmount?.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Plazo Aprobado:</span><br />
                              {application.approvedTerm} meses
                            </div>
                            <div>
                              <span className="font-medium">Tasa de Interés:</span><br />
                              {(Number(application.interestRate || 0) * 100).toFixed(2)}%
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </Button>
                      
                      {canReviewApplication(application) && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowReviewModal(true);
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Revisar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedApplication && (
        <CreditApplicationReview
          application={selectedApplication}
          onSuccess={handleReviewSuccess}
          onCancel={() => {
            setShowReviewModal(false);
            setSelectedApplication(null);
          }}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <CreditApplicationDetails
          applicationId={selectedApplication.id}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedApplication(null);
          }}
        />
      )}
    </>
  );
}
