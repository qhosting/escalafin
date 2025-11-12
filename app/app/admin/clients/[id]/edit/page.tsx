
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, User, Shield, FileText, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ClientProfileImage } from '@/components/clients/client-profile-image';

interface GuarantorData {
  fullName: string;
  address: string;
  phone: string;
  relationship: string;
}

interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  monthlyIncome: string;
  employmentType: string;
  employerName: string;
  workAddress: string;
  yearsEmployed: string;
  creditScore: string;
  bankName: string;
  accountNumber: string;
  status: string;
  asesorId: string;
  guarantor?: GuarantorData;
  collaterals: string[];
}

const EMPLOYMENT_TYPES = [
  { value: 'EMPLOYED', label: 'Empleado' },
  { value: 'SELF_EMPLOYED', label: 'Autoempleado' },
  { value: 'UNEMPLOYED', label: 'Desempleado' },
  { value: 'RETIRED', label: 'Jubilado' },
  { value: 'STUDENT', label: 'Estudiante' }
];

const CLIENT_STATUSES = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'SUSPENDED', label: 'Suspendido' }
];

const RELATIONSHIP_TYPES = [
  { value: 'FAMILY', label: 'Familiar' },
  { value: 'FRIEND', label: 'Amigo' },
  { value: 'COWORKER', label: 'Compañero de Trabajo' },
  { value: 'NEIGHBOR', label: 'Vecino' },
  { value: 'OTHER', label: 'Otro' }
];

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    monthlyIncome: '',
    employmentType: '',
    employerName: '',
    workAddress: '',
    yearsEmployed: '',
    creditScore: '',
    bankName: '',
    accountNumber: '',
    status: 'ACTIVE',
    asesorId: '',
    guarantor: undefined,
    collaterals: []
  });
  
  const [newCollateral, setNewCollateral] = useState('');
  const [clientImage, setClientImage] = useState<string | null>(null);
  const [clientFullName, setClientFullName] = useState('');

  useEffect(() => {
    if (params?.id) {
      fetchClientData(params.id as string);
    }
  }, [params?.id]);

  const fetchClientData = async (clientId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error('Error al cargar cliente');

      const client = await response.json();
      
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
        dateOfBirth: client.dateOfBirth ? client.dateOfBirth.split('T')[0] : '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        postalCode: client.postalCode || '',
        monthlyIncome: client.monthlyIncome?.toString() || '',
        employmentType: client.employmentType || '',
        employerName: client.employerName || '',
        workAddress: client.workAddress || '',
        yearsEmployed: client.yearsEmployed?.toString() || '',
        creditScore: client.creditScore?.toString() || '',
        bankName: client.bankName || '',
        accountNumber: client.accountNumber || '',
        status: client.status || 'ACTIVE',
        asesorId: client.asesorId || '',
        guarantor: client.guarantor ? {
          fullName: client.guarantor.fullName || '',
          address: client.guarantor.address || '',
          phone: client.guarantor.phone || '',
          relationship: client.guarantor.relationship || 'OTHER'
        } : undefined,
        collaterals: client.collaterals?.map((c: any) => c.description) || []
      });
      
      // Guardar imagen y nombre completo para el componente de imagen
      setClientImage(client.profileImage || null);
      setClientFullName(`${client.firstName} ${client.lastName}`);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast.error('Error al cargar los datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGuarantorChange = (field: keyof GuarantorData, value: string) => {
    setFormData(prev => ({
      ...prev,
      guarantor: {
        fullName: prev.guarantor?.fullName || '',
        address: prev.guarantor?.address || '',
        phone: prev.guarantor?.phone || '',
        relationship: prev.guarantor?.relationship || 'OTHER',
        [field]: value
      }
    }));
  };

  const removeGuarantor = () => {
    setFormData(prev => ({
      ...prev,
      guarantor: undefined
    }));
  };

  const addCollateral = () => {
    if (newCollateral.trim()) {
      setFormData(prev => ({
        ...prev,
        collaterals: [...prev.collaterals, newCollateral.trim()]
      }));
      setNewCollateral('');
    }
  };

  const removeCollateral = (index: number) => {
    setFormData(prev => ({
      ...prev,
      collaterals: prev.collaterals.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    // Validar aval si hay datos parciales
    if (formData.guarantor) {
      const { fullName, phone, address, relationship } = formData.guarantor;
      const hasAnyData = fullName || phone || address || (relationship && relationship !== 'OTHER');
      
      if (hasAnyData && !fullName) {
        toast.error('Si proporciona información del aval, el nombre completo es obligatorio');
        return;
      }
    }

    setSaving(true);

    try {
      // Preparar datos para enviar
      const dataToSend = {
        ...formData,
        // Si el aval no tiene nombre, enviarlo como null para eliminarlo
        guarantor: formData.guarantor?.fullName ? formData.guarantor : null
      };

      const response = await fetch(`/api/clients/${params?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar cliente');
      }

      toast.success('Cliente actualizado exitosamente');
      router.push(`/admin/clients/${params?.id}`);
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast.error(error.message || 'Error al actualizar cliente');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href={`/admin/clients/${params?.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Editar Cliente
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Actualiza la información del cliente
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Datos básicos del cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Imagen de Perfil */}
            {params?.id && (
              <div className="flex justify-center mb-6">
                <ClientProfileImage
                  clientId={params.id as string}
                  currentImage={clientImage}
                  clientName={clientFullName}
                  editable={true}
                  size="xl"
                  onImageUpdate={(newImage) => setClientImage(newImage)}
                />
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Ingresa el nombre"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Ingresa el apellido"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="555-123-4567"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dirección */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Dirección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Calle, número, colonia..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Ciudad"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Estado"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Financiera */}
        <Card>
          <CardHeader>
            <CardTitle>Información Financiera</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthlyIncome">Ingreso Mensual</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                  placeholder="15000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditScore">Score Crediticio</Label>
                <Input
                  id="creditScore"
                  type="number"
                  min="300"
                  max="850"
                  value={formData.creditScore}
                  onChange={(e) => handleInputChange('creditScore', e.target.value)}
                  placeholder="650"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bankName">Banco Principal</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="BBVA, Santander, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Número de Cuenta</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  placeholder="****1234"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Laboral */}
        <Card>
          <CardHeader>
            <CardTitle>Información Laboral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Tipo de Empleo</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => handleInputChange('employmentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo de empleo" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsEmployed">Años de Experiencia</Label>
                <Input
                  id="yearsEmployed"
                  type="number"
                  min="0"
                  value={formData.yearsEmployed}
                  onChange={(e) => handleInputChange('yearsEmployed', e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employerName">Nombre del Empleador</Label>
              <Input
                id="employerName"
                value={formData.employerName}
                onChange={(e) => handleInputChange('employerName', e.target.value)}
                placeholder="Empresa ABC"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workAddress">Dirección de Trabajo</Label>
              <Textarea
                id="workAddress"
                value={formData.workAddress}
                onChange={(e) => handleInputChange('workAddress', e.target.value)}
                placeholder="Dirección de la empresa..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Aval / Guarantor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Aval / Garantía Personal
              </CardTitle>
              {formData.guarantor && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeGuarantor}
                >
                  <X className="h-4 w-4 mr-2" />
                  Quitar Aval
                </Button>
              )}
            </div>
            <CardDescription>
              Información del aval del cliente (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guarantorFullName">Nombre Completo del Aval</Label>
                <Input
                  id="guarantorFullName"
                  value={formData.guarantor?.fullName || ''}
                  onChange={(e) => handleGuarantorChange('fullName', e.target.value)}
                  placeholder="Juan Pérez García"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guarantorPhone">Teléfono del Aval</Label>
                <Input
                  id="guarantorPhone"
                  value={formData.guarantor?.phone || ''}
                  onChange={(e) => handleGuarantorChange('phone', e.target.value)}
                  placeholder="555-987-6543"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guarantorRelationship">Relación con el Cliente</Label>
                <Select
                  value={formData.guarantor?.relationship || 'OTHER'}
                  onValueChange={(value) => handleGuarantorChange('relationship', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona relación" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guarantorAddress">Dirección del Aval</Label>
                <Input
                  id="guarantorAddress"
                  value={formData.guarantor?.address || ''}
                  onChange={(e) => handleGuarantorChange('address', e.target.value)}
                  placeholder="Calle 123, Colonia..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Garantías / Collaterals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Garantías / Bienes
            </CardTitle>
            <CardDescription>
              Bienes o garantías proporcionadas por el cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista de garantías existentes */}
            {formData.collaterals.length > 0 && (
              <div className="space-y-2">
                <Label>Garantías Registradas</Label>
                <div className="space-y-2">
                  {formData.collaterals.map((collateral, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                    >
                      <span className="text-sm">{collateral}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCollateral(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agregar nueva garantía */}
            <div className="space-y-2">
              <Label htmlFor="newCollateral">Agregar Nueva Garantía</Label>
              <div className="flex gap-2">
                <Input
                  id="newCollateral"
                  value={newCollateral}
                  onChange={(e) => setNewCollateral(e.target.value)}
                  placeholder="Ejemplo: Casa en calle principal, valor estimado $500,000"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCollateral();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCollateral}
                  disabled={!newCollateral.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-4">
          <Link href={`/admin/clients/${params?.id}`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
