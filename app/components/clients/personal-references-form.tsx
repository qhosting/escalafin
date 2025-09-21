
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  createPersonalReference, 
  getPersonalReferences, 
  updatePersonalReference, 
  deletePersonalReference,
  getRelationshipTypeLabel,
  getNotificationPreferenceLabel,
  validatePhoneNumber,
  formatPhoneNumber,
  CreatePersonalReferenceData,
  UpdatePersonalReferenceData,
} from '@/lib/api/personal-references';
import { PersonalReference, RelationshipType, NotificationPreference } from '@prisma/client';
import { Plus, Edit, Trash2, Phone, MapPin, MessageCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PersonalReferencesFormProps {
  clientId: string;
  readonly?: boolean;
}

export function PersonalReferencesForm({ clientId, readonly = false }: PersonalReferencesFormProps) {
  const [references, setReferences] = useState<PersonalReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReference, setEditingReference] = useState<PersonalReference | null>(null);
  const [formData, setFormData] = useState<CreatePersonalReferenceData | UpdatePersonalReferenceData>({
    clientId,
    fullName: '',
    relationship: RelationshipType.FAMILY,
    relationshipOther: '',
    phone: '',
    address: '',
    notificationPreference: NotificationPreference.WHATSAPP,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReferences();
  }, [clientId]);

  const loadReferences = async () => {
    try {
      setLoading(true);
      const data = await getPersonalReferences(clientId);
      setReferences(data);
    } catch (error) {
      console.error('Error loading references:', error);
      toast.error('Error al cargar las referencias personales');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName?.trim()) {
      errors.fullName = 'El nombre completo es requerido';
    }

    if (!formData.phone?.trim()) {
      errors.phone = 'El teléfono es requerido';
    } else if (!validatePhoneNumber(formData.phone)) {
      errors.phone = 'El formato del teléfono no es válido (ej: 5551234567 o +52 5551234567)';
    }

    if (formData.relationship === RelationshipType.OTHER && !formData.relationshipOther?.trim()) {
      errors.relationshipOther = 'Especifica el tipo de relación';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (editingReference) {
        await updatePersonalReference(editingReference.id, formData);
        toast.success('Referencia personal actualizada exitosamente');
      } else {
        await createPersonalReference(formData as CreatePersonalReferenceData);
        toast.success('Referencia personal agregada exitosamente');
      }

      resetForm();
      loadReferences();
    } catch (error: any) {
      console.error('Error saving reference:', error);
      toast.error(error.message || 'Error al guardar la referencia personal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (reference: PersonalReference) => {
    setEditingReference(reference);
    setFormData({
      fullName: reference.fullName,
      relationship: reference.relationship,
      relationshipOther: reference.relationshipOther || '',
      phone: reference.phone,
      address: reference.address || '',
      notificationPreference: reference.notificationPreference,
    });
    setShowForm(true);
  };

  const handleDelete = async (reference: PersonalReference) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta referencia personal?')) {
      try {
        await deletePersonalReference(reference.id);
        toast.success('Referencia personal eliminada exitosamente');
        loadReferences();
      } catch (error: any) {
        console.error('Error deleting reference:', error);
        toast.error(error.message || 'Error al eliminar la referencia personal');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      clientId,
      fullName: '',
      relationship: RelationshipType.FAMILY,
      relationshipOther: '',
      phone: '',
      address: '',
      notificationPreference: NotificationPreference.WHATSAPP,
    });
    setFormErrors({});
    setEditingReference(null);
    setShowForm(false);
  };

  const canAddReference = references.length < 2;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referencias Personales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Referencias Personales ({references.length}/2)</CardTitle>
          {!readonly && canAddReference && (
            <Button
              onClick={() => setShowForm(!showForm)}
              size="sm"
              disabled={showForm}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Referencia
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning about maximum references */}
        {references.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Se requieren al menos 2 referencias personales para la solicitud de crédito.
              Actualmente no hay referencias registradas.
            </AlertDescription>
          </Alert>
        )}

        {references.length === 1 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Se recomienda tener 2 referencias personales. Actualmente hay 1 referencia registrada.
            </AlertDescription>
          </Alert>
        )}

        {/* Reference Form */}
        {showForm && !readonly && (
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingReference ? 'Editar Referencia Personal' : 'Nueva Referencia Personal'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <Label htmlFor="fullName">Nombre Completo *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName || ''}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Nombre completo de la referencia"
                      className={formErrors.fullName ? 'border-red-500' : ''}
                    />
                    {formErrors.fullName && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="5551234567 o +52 5551234567"
                      className={formErrors.phone ? 'border-red-500' : ''}
                    />
                    {formErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* Relationship */}
                  <div>
                    <Label htmlFor="relationship">Parentesco *</Label>
                    <Select
                      value={formData.relationship || RelationshipType.FAMILY}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        relationship: value as RelationshipType,
                        relationshipOther: value === RelationshipType.OTHER ? formData.relationshipOther : ''
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={RelationshipType.FAMILY}>Familia</SelectItem>
                        <SelectItem value={RelationshipType.FRIEND}>Amigo/a</SelectItem>
                        <SelectItem value={RelationshipType.COWORKER}>Compañero/a de trabajo</SelectItem>
                        <SelectItem value={RelationshipType.NEIGHBOR}>Vecino/a</SelectItem>
                        <SelectItem value={RelationshipType.OTHER}>Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Relationship Other */}
                  {formData.relationship === RelationshipType.OTHER && (
                    <div>
                      <Label htmlFor="relationshipOther">Especificar Parentesco *</Label>
                      <Input
                        id="relationshipOther"
                        value={formData.relationshipOther || ''}
                        onChange={(e) => setFormData({ ...formData, relationshipOther: e.target.value })}
                        placeholder="Especifica el tipo de relación"
                        className={formErrors.relationshipOther ? 'border-red-500' : ''}
                      />
                      {formErrors.relationshipOther && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.relationshipOther}</p>
                      )}
                    </div>
                  )}

                  {/* Notification Preference */}
                  <div>
                    <Label htmlFor="notificationPreference">Recibir Notificaciones</Label>
                    <Select
                      value={formData.notificationPreference || NotificationPreference.WHATSAPP}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        notificationPreference: value as NotificationPreference
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NotificationPreference.WHATSAPP}>WhatsApp</SelectItem>
                        <SelectItem value={NotificationPreference.SMS}>SMS</SelectItem>
                        <SelectItem value={NotificationPreference.BOTH}>SMS y WhatsApp</SelectItem>
                        <SelectItem value={NotificationPreference.NONE}>Sin notificaciones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Dirección completa (opcional)"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Guardando...' : (editingReference ? 'Actualizar' : 'Agregar')}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* References List */}
        {references.length > 0 && (
          <div className="space-y-4">
            {references.map((reference, index) => (
              <Card key={reference.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">{reference.fullName}</h4>
                        <Badge variant="secondary">
                          Referencia #{index + 1}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Parentesco:</span>
                          <span>
                            {getRelationshipTypeLabel(reference.relationship)}
                            {reference.relationshipOther && ` (${reference.relationshipOther})`}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{formatPhoneNumber(reference.phone)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-gray-500" />
                          <span>{getNotificationPreferenceLabel(reference.notificationPreference)}</span>
                        </div>
                      </div>

                      {reference.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                          <span>{reference.address}</span>
                        </div>
                      )}
                    </div>

                    {!readonly && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(reference)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(reference)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {references.length === 0 && !showForm && (
          <div className="text-center py-8 text-gray-500">
            <p>No hay referencias personales registradas.</p>
            {!readonly && canAddReference && (
              <p className="text-sm mt-2">
                Haz clic en "Agregar Referencia" para comenzar.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
