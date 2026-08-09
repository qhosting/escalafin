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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Shield, 
  FileText, 
  Plus, 
  X, 
  TrendingUp, 
  MapPin, 
  Briefcase, 
  UserCheck, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ClientProfileImage } from '@/components/clients/client-profile-image';
import { GPSCapture } from '@/components/ui/gps-capture';

interface GuarantorData {
  fullName: string;
  address: string;
  phone: string;
  relationship: string;
  latitude?: number | null;
  longitude?: number | null;
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
  latitude: number | null;
  longitude: number | null;
  guarantor?: GuarantorData;
  collaterals: string[];
  lateFeeType: string;
  lateFeeAmount: string;
  lateFeeMaxWeekly: string;
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
  { value: 'BLACKLISTED', label: 'Lista Negra/Suspendido' }
];

const RELATIONSHIP_TYPES = [
  { value: 'FAMILY', label: 'Familiar' },
  { value: 'FRIEND', label: 'Amigo' },
  { value: 'COWORKER', label: 'Compañero de Trabajo' },
  { value: 'NEIGHBOR', label: 'Vecino' },
  { value: 'OTHER', label: 'Otro' }
];

const TABS_ORDER = ['general', 'address', 'financial', 'guarantor'];

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

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
    latitude: null,
    longitude: null,
    guarantor: undefined,
    collaterals: [],
    lateFeeType: 'DAILY_FIXED',
    lateFeeAmount: '200',
    lateFeeMaxWeekly: '800'
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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Error al cargar cliente');
      }

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
        latitude: client.latitude || null,
        longitude: client.longitude || null,
        guarantor: client.guarantor ? {
          fullName: client.guarantor.fullName || '',
          address: client.guarantor.address || '',
          phone: client.guarantor.phone || '',
          relationship: client.guarantor.relationship || 'OTHER',
          latitude: client.guarantor.latitude || null,
          longitude: client.guarantor.longitude || null
        } : undefined,
        collaterals: client.collaterals?.map((c: any) => c.description) || [],
        lateFeeType: client.lateFeeType || 'DAILY_FIXED',
        lateFeeAmount: client.lateFeeAmount?.toString() || '200',
        lateFeeMaxWeekly: client.lateFeeMaxWeekly?.toString() || '800'
      });
      
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

  const handleGuarantorChange = (field: keyof GuarantorData, value: any) => {
    setFormData(prev => ({
      ...prev,
      guarantor: {
        fullName: prev.guarantor?.fullName || '',
        address: prev.guarantor?.address || '',
        phone: prev.guarantor?.phone || '',
        relationship: prev.guarantor?.relationship || 'OTHER',
        latitude: prev.guarantor?.latitude || null,
        longitude: prev.guarantor?.longitude || null,
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

  const goToNextTab = () => {
    const currentIndex = TABS_ORDER.indexOf(activeTab);
    if (currentIndex < TABS_ORDER.length - 1) {
      setActiveTab(TABS_ORDER[currentIndex + 1]);
    }
  };

  const goToPrevTab = () => {
    const currentIndex = TABS_ORDER.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS_ORDER[currentIndex - 1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Por favor complete los campos requeridos (Nombre, Apellido y Teléfono)');
      setActiveTab('general');
      return;
    }

    if (formData.guarantor) {
      const { fullName, phone, address, relationship } = formData.guarantor;
      const hasAnyData = fullName || phone || address || (relationship && relationship !== 'OTHER');
      
      if (hasAnyData && !fullName) {
        toast.error('Si proporciona información del aval, el nombre completo es obligatorio');
        setActiveTab('guarantor');
        return;
      }
    }

    setSaving(true);

    try {
      const dataToSend = {
        ...formData,
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
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-sm font-semibold text-slate-500">Cargando expediente del cliente...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/admin/clients/${params?.id}`}>
            <Button variant="outline" size="sm" className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Editar Cliente: {clientFullName || 'Cargando...'}
            </h1>
            <p className="text-sm font-medium text-gray-500">
              Actualización estructurada del expediente comercial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            type="button"
            onClick={handleSubmit} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navegación por Pestañas */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden p-1.5 bg-slate-100/70 dark:bg-slate-900/60">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-1.5 bg-transparent h-auto p-0">
              <TabsTrigger 
                value="general" 
                className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
              >
                <User className="h-4 w-4" />
                <span>1. General & Estado</span>
              </TabsTrigger>

              <TabsTrigger 
                value="address" 
                className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
              >
                <MapPin className="h-4 w-4" />
                <span>2. Domicilio & GPS</span>
              </TabsTrigger>

              <TabsTrigger 
                value="financial" 
                className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
              >
                <Briefcase className="h-4 w-4" />
                <span>3. Financiera & Moratorios</span>
              </TabsTrigger>

              <TabsTrigger 
                value="guarantor" 
                className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
              >
                <UserCheck className="h-4 w-4" />
                <span>4. Aval & Garantías</span>
              </TabsTrigger>
            </TabsList>
          </Card>

          {/* ── PESTAÑA 1: GENERAL & ESTADO ── */}
          <TabsContent value="general" className="space-y-6 mt-0">
            <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-blue-600" />
                  Información Personal & Estado del Cliente
                </CardTitle>
                <CardDescription>
                  Identificación principal y foto de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Foto de Perfil */}
                {params?.id && (
                  <div className="flex justify-center pb-4 border-b border-slate-100 dark:border-slate-800">
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
                    <Label htmlFor="firstName" className="font-bold text-xs">Nombre (s) *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Ingresa el nombre"
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="font-bold text-xs">Apellidos *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Ingresa el apellido"
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-bold text-xs">Teléfono Móvil *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="555-123-4567"
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold text-xs">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="font-bold text-xs">Fecha de Nacimiento</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="font-bold text-xs">Estatus en Sistema</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger className="rounded-xl">
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
          </TabsContent>

          {/* ── PESTAÑA 2: DOMICILIO & GPS ── */}
          <TabsContent value="address" className="space-y-6 mt-0">
            <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Dirección de Residencia & Coordenadas GPS
                </CardTitle>
                <CardDescription>
                  Ubicación domiciliaria para validación de cobranza
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="font-bold text-xs">Dirección Completa</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Calle, número, colonia..."
                        rows={3}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <GPSCapture
                      label="Ubicación Residencia"
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationCapture={(lat, lng) => {
                        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="font-bold text-xs">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Ciudad"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="font-bold text-xs">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Estado"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="font-bold text-xs">Código Postal</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="12345"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PESTAÑA 3: FINANCIERA, EMPLEO & MORATORIOS ── */}
          <TabsContent value="financial" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Financiera */}
              <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    Información Financiera & Bancaria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyIncome" className="font-bold text-xs">Ingreso Mensual (MXN)</Label>
                      <Input
                        id="monthlyIncome"
                        type="number"
                        value={formData.monthlyIncome}
                        onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                        placeholder="15000"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="creditScore" className="font-bold text-xs">Score Crediticio</Label>
                      <Input
                        id="creditScore"
                        type="number"
                        min="300"
                        max="850"
                        value={formData.creditScore}
                        onChange={(e) => handleInputChange('creditScore', e.target.value)}
                        placeholder="650"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bankName" className="font-bold text-xs">Banco Principal</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        placeholder="BBVA, Santander, etc."
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber" className="font-bold text-xs">Número de Cuenta</Label>
                      <Input
                        id="accountNumber"
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        placeholder="****1234"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información Laboral */}
              <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                    Información Laboral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="employmentType" className="font-bold text-xs">Tipo de Empleo</Label>
                      <Select
                        value={formData.employmentType}
                        onValueChange={(value) => handleInputChange('employmentType', value)}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecciona tipo" />
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
                      <Label htmlFor="yearsEmployed" className="font-bold text-xs">Años de Antigüedad</Label>
                      <Input
                        id="yearsEmployed"
                        type="number"
                        min="0"
                        value={formData.yearsEmployed}
                        onChange={(e) => handleInputChange('yearsEmployed', e.target.value)}
                        placeholder="5"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employerName" className="font-bold text-xs">Nombre del Empleador</Label>
                    <Input
                      id="employerName"
                      value={formData.employerName}
                      onChange={(e) => handleInputChange('employerName', e.target.value)}
                      placeholder="Empresa ABC"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workAddress" className="font-bold text-xs">Dirección de Trabajo</Label>
                    <Textarea
                      id="workAddress"
                      value={formData.workAddress}
                      onChange={(e) => handleInputChange('workAddress', e.target.value)}
                      placeholder="Dirección de la empresa..."
                      rows={2}
                      className="rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuración de Moratorios */}
            <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Configuración de Moratorios (Multas por Mora)
                </CardTitle>
                <CardDescription>
                  Reglas de cobranza por penalizaciones diarias o porcentaje
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="lateFeeType" className="font-bold text-xs">Tipo de Moratorio</Label>
                    <Select
                      value={formData.lateFeeType}
                      onValueChange={(value) => handleInputChange('lateFeeType', value)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY_FIXED">Monto Fijo por Día</SelectItem>
                        <SelectItem value="PERCENTAGE">Porcentaje sobre Saldo</SelectItem>
                        <SelectItem value="NONE">Sin Moratorios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.lateFeeType !== 'NONE' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="lateFeeAmount" className="font-bold text-xs">
                          {formData.lateFeeType === 'DAILY_FIXED' ? 'Monto Pesos/Día' : 'Porcentaje (%)'}
                        </Label>
                        <Input
                          id="lateFeeAmount"
                          type="number"
                          value={formData.lateFeeAmount}
                          onChange={(e) => handleInputChange('lateFeeAmount', e.target.value)}
                          placeholder={formData.lateFeeType === 'DAILY_FIXED' ? "200" : "5"}
                          className="rounded-xl"
                        />
                      </div>
                      
                      {formData.lateFeeType === 'DAILY_FIXED' && (
                        <div className="space-y-2">
                          <Label htmlFor="lateFeeMaxWeekly" className="font-bold text-xs">Máximo por Semana ($)</Label>
                          <Input
                            id="lateFeeMaxWeekly"
                            type="number"
                            value={formData.lateFeeMaxWeekly}
                            onChange={(e) => handleInputChange('lateFeeMaxWeekly', e.target.value)}
                            placeholder="800"
                            className="rounded-xl"
                          />
                          <p className="text-xs text-muted-foreground italic">
                            💡 Ejemplo: $200/día, máximo semanal ${formData.lateFeeMaxWeekly || '800'}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PESTAÑA 4: AVAL & GARANTÍAS ── */}
          <TabsContent value="guarantor" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aval / Guarantor */}
              <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Aval / Garantía Personal
                    </CardTitle>
                    {formData.guarantor && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeGuarantor}
                        className="rounded-xl text-xs text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Quitar Aval
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    Información de la persona garante
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="guarantorFullName" className="font-bold text-xs">Nombre Completo del Aval</Label>
                        <Input
                          id="guarantorFullName"
                          value={formData.guarantor?.fullName || ''}
                          onChange={(e) => handleGuarantorChange('fullName', e.target.value)}
                          placeholder="Juan Pérez García"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guarantorPhone" className="font-bold text-xs">Teléfono del Aval</Label>
                        <Input
                          id="guarantorPhone"
                          value={formData.guarantor?.phone || ''}
                          onChange={(e) => handleGuarantorChange('phone', e.target.value)}
                          placeholder="555-987-6543"
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <GPSCapture
                        label="Ubicación Aval"
                        latitude={formData.guarantor?.latitude}
                        longitude={formData.guarantor?.longitude}
                        onLocationCapture={(lat, lng) => {
                          handleGuarantorChange('latitude', lat);
                          handleGuarantorChange('longitude', lng);
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="guarantorRelationship" className="font-bold text-xs">Relación con el Cliente</Label>
                      <Select
                        value={formData.guarantor?.relationship || 'OTHER'}
                        onValueChange={(value) => handleGuarantorChange('relationship', value)}
                      >
                        <SelectTrigger className="rounded-xl">
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
                      <Label htmlFor="guarantorAddress" className="font-bold text-xs">Dirección del Aval</Label>
                      <Input
                        id="guarantorAddress"
                        value={formData.guarantor?.address || ''}
                        onChange={(e) => handleGuarantorChange('address', e.target.value)}
                        placeholder="Calle 123, Colonia..."
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Garantías / Collaterals */}
              <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-amber-600" />
                    Garantías / Bienes Registrados
                  </CardTitle>
                  <CardDescription>
                    Bienes prendarios otorgados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formData.collaterals.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500">Garantías Actuales ({formData.collaterals.length})</Label>
                      <div className="space-y-2">
                        {formData.collaterals.map((collateral, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          >
                            <span className="text-sm font-medium">{collateral}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCollateral(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-sm font-medium italic border-2 border-dashed border-slate-100 rounded-2xl">
                      Sin prendas registradas
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="newCollateral" className="font-bold text-xs">Agregar Nueva Garantía</Label>
                    <div className="flex gap-2">
                      <Input
                        id="newCollateral"
                        value={newCollateral}
                        onChange={(e) => setNewCollateral(e.target.value)}
                        placeholder="Ej: Vehículo Sedán Nissan 2018..."
                        className="rounded-xl"
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
                        className="rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Controls Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevTab}
              disabled={activeTab === 'general'}
              className="rounded-xl gap-2 font-semibold text-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-3">
              {activeTab !== 'guarantor' ? (
                <Button
                  type="button"
                  onClick={goToNextTab}
                  className="rounded-xl gap-2 bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs px-6"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar Cambios
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </form>
    </div>
  );
}
