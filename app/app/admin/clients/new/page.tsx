'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  UserCheck, 
  Package, 
  Plus, 
  X, 
  MapPin, 
  Briefcase, 
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Camera,
  DollarSign,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { GPSCapture } from '@/components/ui/gps-capture';
import { ClientPhotoCapture } from '@/components/clients/client-photo-capture';
import { DigitalVault, DocumentSlot } from '@/components/clients/digital-vault';
import { ExpedientePdfGenerator } from '@/components/clients/expediente-pdf-generator';

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
  asesorId: string;
  latitude: number | null;
  longitude: number | null;
  // Aval
  guarantorFullName: string;
  guarantorAddress: string;
  guarantorPhone: string;
  guarantorRelationship: string;
  guarantorLatitude: number | null;
  guarantorLongitude: number | null;
}

const EMPLOYMENT_TYPES = [
  { value: 'EMPLOYED', label: 'Empleado' },
  { value: 'SELF_EMPLOYED', label: 'Autoempleado' },
  { value: 'UNEMPLOYED', label: 'Desempleado' },
  { value: 'RETIRED', label: 'Jubilado' },
  { value: 'STUDENT', label: 'Estudiante' }
];

const RELATIONSHIP_TYPES = [
  { value: 'FAMILY', label: 'Familiar' },
  { value: 'FRIEND', label: 'Amigo' },
  { value: 'COWORKER', label: 'Compañero de Trabajo' },
  { value: 'NEIGHBOR', label: 'Vecino' },
  { value: 'OTHER', label: 'Otro' }
];

const TABS_ORDER = ['general', 'address', 'financial', 'guarantor', 'vault'];

export default function NewClientPage() {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [collaterals, setCollaterals] = useState<string[]>([]);
  const [newCollateral, setNewCollateral] = useState('');
  const [clientPhoto, setClientPhoto] = useState<string | null>(null);
  const [vaultDocs, setVaultDocs] = useState<DocumentSlot[]>([]);

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
    asesorId: '',
    latitude: null,
    longitude: null,
    // Aval
    guarantorFullName: '',
    guarantorAddress: '',
    guarantorPhone: '',
    guarantorRelationship: '',
    guarantorLatitude: null,
    guarantorLongitude: null
  });

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCollateral = () => {
    if (newCollateral.trim()) {
      setCollaterals(prev => [...prev, newCollateral.trim()]);
      setNewCollateral('');
    }
  };

  const handleRemoveCollateral = (index: number) => {
    setCollaterals(prev => prev.filter((_, i) => i !== index));
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

    setLoading(true);

    try {
      const clientData = {
        ...formData,
        guarantor: formData.guarantorFullName ? {
          fullName: formData.guarantorFullName,
          address: formData.guarantorAddress,
          phone: formData.guarantorPhone,
          relationship: formData.guarantorRelationship,
          latitude: formData.guarantorLatitude,
          longitude: formData.guarantorLongitude
        } : undefined,
        collaterals: collaterals.length > 0 ? collaterals : undefined
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear cliente');
      }

      const client = await response.json();
      toast.success('Cliente creado exitosamente');
      router.push(`/admin/clients/${client.id}`);
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast.error(error.message || 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/clients">
            <Button variant="outline" size="sm" className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Nuevo Cliente
            </h1>
            <p className="text-sm font-medium text-gray-500">
              Captura estructurada de expediente comercial y crediticio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cliente
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navegación por Pestañas */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden p-1.5 bg-slate-100/70 dark:bg-slate-900/60">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-1.5 bg-transparent h-auto p-0">
              <TabsTrigger 
                value="general" 
                className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
              >
                <User className="h-4 w-4" />
                <span>1. General</span>
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
                <span>3. Financiera & Empleo</span>
              </TabsTrigger>

              <TabsTrigger 
                value="guarantor" 
                className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
              >
                <UserCheck className="h-4 w-4" />
                <span>4. Aval & Garantías</span>
              </TabsTrigger>

              <TabsTrigger 
                value="vault" 
                className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
              >
                <FolderOpen className="h-4 w-4" />
                <span>5. Bóveda Digital</span>
              </TabsTrigger>
            </TabsList>
          </Card>

          {/* ── PESTAÑA 1: GENERAL ── */}
          <TabsContent value="general" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-blue-600" />
                    Información Personal del Cliente
                  </CardTitle>
                  <CardDescription>
                    Datos básicos de identificación principal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="font-bold text-xs">Nombre (s) *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Ej. Juan Carlos"
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
                        placeholder="Ej. Pérez García"
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
                        placeholder="10 dígitos"
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
                        placeholder="cliente@correo.com"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

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
                </CardContent>
              </Card>

              {/* Fotografía de Perfil */}
              <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Camera className="h-5 w-5 text-blue-600" />
                    Fotografía de Perfil
                  </CardTitle>
                  <CardDescription>
                    Captura directa en cámara o archivo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ClientPhotoCapture
                    onPhotoCapture={(dataUrl) => {
                      setClientPhoto(dataUrl);
                    }}
                    currentPhoto={clientPhoto}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── PESTAÑA 2: DOMICILIO & GPS ── */}
          <TabsContent value="address" className="space-y-6 mt-0">
            <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Dirección de Residencia & Geolocalización
                </CardTitle>
                <CardDescription>
                  Ubicación física para comprobación domiciliaria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="font-bold text-xs">Calle y Número *</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Calle, número exterior/interior, colonia..."
                        rows={3}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <GPSCapture
                      label="Ubicación GPS Domicilio"
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
                    <Label htmlFor="city" className="font-bold text-xs">Ciudad / Municipio</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Ej. Querétaro"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="font-bold text-xs">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Ej. Querétaro"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="font-bold text-xs">Código Postal</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="Ej. 76000"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PESTAÑA 3: FINANCIERA & LABORAL ── */}
          <TabsContent value="financial" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Financiera */}
              <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-[#003d7a]" />
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
                        placeholder="Ej. 15000"
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
                        placeholder="Ej. 650"
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
                        placeholder="BBVA, Banorte..."
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber" className="font-bold text-xs">Número de Cuenta / Clabe</Label>
                      <Input
                        id="accountNumber"
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        placeholder="18 dígitos o N° cuenta"
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
                          <SelectValue placeholder="Seleccionar" />
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
                        placeholder="Ej. 3"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employerName" className="font-bold text-xs">Nombre de la Empresa</Label>
                    <Input
                      id="employerName"
                      value={formData.employerName}
                      onChange={(e) => handleInputChange('employerName', e.target.value)}
                      placeholder="Empresa o Negocio"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workAddress" className="font-bold text-xs">Dirección de Trabajo</Label>
                    <Textarea
                      id="workAddress"
                      value={formData.workAddress}
                      onChange={(e) => handleInputChange('workAddress', e.target.value)}
                      placeholder="Dirección laboral..."
                      rows={2}
                      className="rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── PESTAÑA 4: AVAL & GARANTÍAS ── */}
          <TabsContent value="guarantor" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información del Aval */}
              <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                    Información del Aval / Obligado Solidario
                  </CardTitle>
                  <CardDescription>
                    Respaldo opcional de la operación crediticia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="guarantorFullName" className="font-bold text-xs">Nombre Completo del Aval</Label>
                    <Input
                      id="guarantorFullName"
                      value={formData.guarantorFullName}
                      onChange={(e) => handleInputChange('guarantorFullName', e.target.value)}
                      placeholder="Nombre y Apellidos"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="guarantorPhone" className="font-bold text-xs">Teléfono Aval</Label>
                      <Input
                        id="guarantorPhone"
                        type="tel"
                        value={formData.guarantorPhone}
                        onChange={(e) => handleInputChange('guarantorPhone', e.target.value)}
                        placeholder="10 dígitos"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guarantorRelationship" className="font-bold text-xs">Parentesco</Label>
                      <Select
                        value={formData.guarantorRelationship}
                        onValueChange={(value) => handleInputChange('guarantorRelationship', value)}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Seleccionar" />
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guarantorAddress" className="font-bold text-xs">Dirección del Aval</Label>
                    <Textarea
                      id="guarantorAddress"
                      value={formData.guarantorAddress}
                      onChange={(e) => handleInputChange('guarantorAddress', e.target.value)}
                      placeholder="Calle, número, colonia, ciudad..."
                      rows={2}
                      className="rounded-xl"
                    />
                  </div>

                  <GPSCapture
                    label="Ubicación GPS Aval"
                    latitude={formData.guarantorLatitude}
                    longitude={formData.guarantorLongitude}
                    onLocationCapture={(lat, lng) => {
                      setFormData(prev => ({ ...prev, guarantorLatitude: lat, guarantorLongitude: lng }));
                    }}
                  />
                </CardContent>
              </Card>

              {/* Garantías */}
              <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-amber-600" />
                    Garantías en Prenda
                  </CardTitle>
                  <CardDescription>
                    Bienes o prendas otorgadas por el cliente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="newCollateral" className="font-bold text-xs">Descripción de la Garantía</Label>
                      <Input
                        id="newCollateral"
                        value={newCollateral}
                        onChange={(e) => setNewCollateral(e.target.value)}
                        placeholder="Ej. Televisor LG 55 pulgadas / Moto Italika 2024"
                        className="rounded-xl"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCollateral();
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={handleAddCollateral}
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-10 px-4"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </div>

                  {collaterals.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500">Garantías Registradas ({collaterals.length})</Label>
                      <div className="space-y-2">
                        {collaterals.map((collateral, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-medium">{collateral}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCollateral(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm font-medium italic border-2 border-dashed border-slate-100 rounded-2xl">
                      Sin prendas registradas
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── PESTAÑA 5: BÓVEDA DIGITAL & PDF ── */}
          <TabsContent value="vault" className="space-y-6 mt-0">
            <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderOpen className="h-5 w-5 text-emerald-600" />
                  Bóveda Digital de Documentos (KYC)
                </CardTitle>
                <CardDescription>
                  Expediente digitalizado del acreditado para validación PLD/KYC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DigitalVault
                  onChange={(docs) => setVaultDocs(docs)}
                />
              </CardContent>
            </Card>

            {/* Generador PDF */}
            <ExpedientePdfGenerator
              clientData={formData}
              documents={vaultDocs}
              photoUrl={clientPhoto}
            />
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
              {activeTab !== 'vault' ? (
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
                  disabled={loading}
                  className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Finalizar & Crear Cliente
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </form>
    </div>
  );
}
