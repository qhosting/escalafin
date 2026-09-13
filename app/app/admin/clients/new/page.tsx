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
  FileCheck,
  Building,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Landmark,
  FileText,
  BadgePercent
} from 'lucide-react';
import { toast } from 'sonner';
import { GPSCapture } from '@/components/ui/gps-capture';
import { ClientPhotoCapture } from '@/components/clients/client-photo-capture';
import { DigitalVault, DocumentSlot } from '@/components/clients/digital-vault';
import { ExpedientePdfGenerator } from '@/components/clients/expediente-pdf-generator';
import { cn } from '@/lib/utils';

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

const UPPERCASE_FIELDS = new Set<keyof ClientFormData>([
  'firstName',
  'lastName',
  'address',
  'city',
  'state',
  'employerName',
  'workAddress',
  'bankName',
  'guarantorFullName',
  'guarantorAddress',
]);

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    const finalValue = UPPERCASE_FIELDS.has(field) ? value.toUpperCase() : value;
    setFormData(prev => ({
      ...prev,
      [field]: finalValue
    }));
  };

  const handleAddCollateral = () => {
    if (newCollateral.trim()) {
      setCollaterals(prev => [...prev, newCollateral.trim().toUpperCase()]);
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

  // Cálculo del progreso general del formulario (0 - 100%)
  const calculateProgress = () => {
    let completedSteps = 0;
    // Paso 1: Nombre, Apellido, Teléfono
    if (formData.firstName && formData.lastName && formData.phone) completedSteps += 20;
    if (clientPhoto) completedSteps += 5;
    // Paso 2: Dirección
    if (formData.address) completedSteps += 15;
    if (formData.latitude && formData.longitude) completedSteps += 10;
    // Paso 3: Ingreso mensual
    if (formData.monthlyIncome) completedSteps += 15;
    if (formData.employmentType) completedSteps += 10;
    // Paso 4: Aval o garantías
    if (formData.guarantorFullName || collaterals.length > 0) completedSteps += 15;
    // Paso 5: Documentos
    if (vaultDocs.length > 0) completedSteps += 10;

    return Math.min(100, completedSteps);
  };

  const isStepValid = (step: string) => {
    switch (step) {
      case 'general':
        return !!(formData.firstName && formData.lastName && formData.phone);
      case 'address':
        return !!formData.address;
      case 'financial':
        return !!(formData.monthlyIncome || formData.employmentType);
      case 'guarantor':
        return !!(formData.guarantorFullName || collaterals.length > 0);
      case 'vault':
        return vaultDocs.length > 0;
      default:
        return false;
    }
  };

  const progress = calculateProgress();

  // Cálculo de edad dinámico
  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  };

  const getScoreInterpretation = (scoreStr: string) => {
    const score = parseInt(scoreStr, 10);
    if (isNaN(score) || score <= 0) return null;
    if (score >= 750) return { label: 'Excelente', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    if (score >= 650) return { label: 'Bueno', color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    if (score >= 550) return { label: 'Regular', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    return { label: 'Riesgo Alto', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
  };

  const clientAge = calculateAge(formData.dateOfBirth);
  const scoreInfo = getScoreInterpretation(formData.creditScore);

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-28">
      {/* Barra de Acciones Superior (Sin título redundante, optimizada con UI/UX Pro) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3 sm:p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/clients">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold gap-1.5 transition-all shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Clientes</span>
            </Button>
          </Link>
          
          <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-800 hidden sm:block" />

          {/* Badge de estado del expediente */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Expediente Digital
            </span>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 hidden md:inline">
              {formData.firstName || formData.lastName 
                ? `${formData.firstName} ${formData.lastName}`.trim() 
                : 'Nuevo Acreditado'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Barra de progreso sutil */}
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {progress}%
            </span>
          </div>

          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={loading}
            className="h-9 px-4 sm:px-5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all gap-1.5"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Guardar Cliente</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          {/* Stepper Wizard Interactivo con UI/UX Pro Max */}
          <div className="bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto no-scrollbar">
            <TabsList className="flex items-center gap-1.5 bg-transparent h-auto p-0 min-w-full sm:min-w-0">
              {[
                { id: 'general', label: '1. General', sub: 'Identidad & Contacto', icon: User },
                { id: 'address', label: '2. Domicilio', sub: 'Dirección & GPS', icon: MapPin },
                { id: 'financial', label: '3. Financiera', sub: 'Ingresos & Empleo', icon: Briefcase },
                { id: 'guarantor', label: '4. Aval & Prendas', sub: 'Obligado Solidario', icon: UserCheck },
                { id: 'vault', label: '5. Bóveda Digital', sub: 'Expediente KYC', icon: FolderOpen },
              ].map((step) => {
                const isActive = activeTab === step.id;
                const isDone = isStepValid(step.id);
                const Icon = step.icon;

                return (
                  <TabsTrigger 
                    key={step.id}
                    value={step.id}
                    className={`flex-1 min-w-[130px] sm:min-w-0 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center sm:justify-start gap-2.5 transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                      isActive 
                        ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white shadow-sm shadow-blue-500/20 scale-[1.01]' 
                        : ''
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : isDone 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {isDone && !isActive ? (
                        <FileCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                        {step.label}
                      </div>
                      <div className={`text-[10px] font-medium leading-none mt-0.5 ${isActive ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                        {step.sub}
                      </div>
                    </div>
                    <span className="sm:hidden text-xs font-bold">{step.label.split('.')[1]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* ── PESTAÑA 1: GENERAL ── */}
          <TabsContent value="general" className="space-y-5 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Información Personal */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Identificación & Contacto</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Datos principales requeridos para el expediente del cliente</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Nombre(s) <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Ej. JUAN CARLOS"
                        required
                        className="pl-9 h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl uppercase text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Apellidos <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Ej. PÉREZ GARCÍA"
                        required
                        className="pl-9 h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl uppercase text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Teléfono Móvil <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="10 dígitos (Ej. 4421234567)"
                        required
                        className="pl-9 h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400">Usado para notificaciones de cobranza y WhatsApp</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Correo Electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="cliente@correo.com"
                        className="pl-9 h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dateOfBirth" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Fecha de Nacimiento
                    </Label>
                    {clientAge !== null && (
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900/50">
                        {clientAge} años cumplidos
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="pl-9 h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Fotografía de Perfil Biometría */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Fotografía de Perfil</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Captura biométrica directa</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <ClientPhotoCapture
                      onPhotoCapture={(dataUrl) => {
                        setClientPhoto(dataUrl);
                      }}
                      currentPhoto={clientPhoto}
                    />
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>La fotografía queda vinculada permanentemente al expediente digital y al pagaré comercial.</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── PESTAÑA 2: DOMICILIO & GPS ── */}
          <TabsContent value="address" className="space-y-5 mt-0">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Domicilio de Residencia & Geocodificación</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ubicación física para comprobación domiciliaria y ruta de cobranza</p>
                  </div>
                </div>

                {formData.latitude && formData.longitude ? (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    GPS Verificado
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    GPS Pendiente
                  </span>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Calle, Número Exterior e Interior, Colonia <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="EJ. AV. CONSTITUYENTES #1024 INT 5B, COL. CENTRO"
                      rows={4}
                      className="bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl uppercase text-xs font-semibold focus-visible:ring-primary shadow-2xs resize-none"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Ciudad / Municipio
                      </Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Ej. QUERÉTARO"
                        className="h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl uppercase text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Estado
                      </Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="Ej. QUERÉTARO"
                        className="h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl uppercase text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="postalCode" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Código Postal
                      </Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        placeholder="Ej. 76000"
                        className="h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <GPSCapture
                    label="Geolocalización Satelital Domicilio"
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onLocationCapture={(lat, lng) => {
                      setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                    }}
                  />

                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>La coordenada satelital permite trazar rutas optimizadas en el mapa de cobranza móvil.</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── PESTAÑA 3: FINANCIERA & LABORAL ── */}
          <TabsContent value="financial" className="space-y-5 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Información Financiera & Bancaria */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Perfil Financiero & Bancario</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Capacidad económica declarada y dispersión</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="monthlyIncome" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Ingreso Mensual (MXN)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="monthlyIncome"
                        type="number"
                        value={formData.monthlyIncome}
                        onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                        placeholder="Ej. 18500"
                        className="pl-9 h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="creditScore" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Score Crediticio
                      </Label>
                      {scoreInfo && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${scoreInfo.color}`}>
                          {scoreInfo.label}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="creditScore"
                        type="number"
                        min="300"
                        max="850"
                        value={formData.creditScore}
                        onChange={(e) => handleInputChange('creditScore', e.target.value)}
                        placeholder="300 a 850 (Ej. 680)"
                        className="pl-9 h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="bankName" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Banco Principal
                    </Label>
                    <div className="relative">
                      <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        placeholder="BBVA, SANTANDER..."
                        className="pl-9 h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl uppercase text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="accountNumber" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Cuenta o CLABE (18 dígitos)
                    </Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      placeholder="Cuenta o CLABE para dispersión"
                      className="h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono font-semibold focus-visible:ring-primary shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Perfil Laboral & Ocupación</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Actividad económica y fuente de ingresos</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="employmentType" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Régimen Laboral
                    </Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value) => handleInputChange('employmentType', value)}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 text-xs font-semibold shadow-2xs">
                        <SelectValue placeholder="Seleccionar régimen" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {EMPLOYMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-xs font-semibold">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="yearsEmployed" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Años de Antigüedad
                    </Label>
                    <Input
                      id="yearsEmployed"
                      type="number"
                      min="0"
                      value={formData.yearsEmployed}
                      onChange={(e) => handleInputChange('yearsEmployed', e.target.value)}
                      placeholder="Ej. 3"
                      className="h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="employerName" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Empresa, Razón Social o Negocio Propio
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="employerName"
                      value={formData.employerName}
                      onChange={(e) => handleInputChange('employerName', e.target.value)}
                      placeholder="EMPRESA O NOMBRE DEL NEGOCIO"
                      className="pl-9 h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl uppercase text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="workAddress" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Dirección del Centro de Trabajo
                  </Label>
                  <Textarea
                    id="workAddress"
                    value={formData.workAddress}
                    onChange={(e) => handleInputChange('workAddress', e.target.value)}
                    placeholder="CALLE, NÚMERO, COLONIA DEL TRABAJO..."
                    rows={2}
                    className="bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl uppercase text-xs font-semibold focus-visible:ring-primary shadow-2xs resize-none"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── PESTAÑA 4: AVAL & GARANTÍAS ── */}
          <TabsContent value="guarantor" className="space-y-5 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Información del Aval */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Obligado Solidario (Aval)</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Respaldo legal y garante de la obligación</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                    Opcional
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guarantorFullName" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Nombre Completo del Aval
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="guarantorFullName"
                      value={formData.guarantorFullName}
                      onChange={(e) => handleInputChange('guarantorFullName', e.target.value)}
                      placeholder="NOMBRE Y APELLIDOS DEL AVAL"
                      className="pl-9 h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl uppercase text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="guarantorPhone" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Teléfono Aval
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="guarantorPhone"
                        type="tel"
                        value={formData.guarantorPhone}
                        onChange={(e) => handleInputChange('guarantorPhone', e.target.value)}
                        placeholder="10 dígitos"
                        className="pl-9 h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold focus-visible:ring-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="guarantorRelationship" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Parentesco / Relación
                    </Label>
                    <Select
                      value={formData.guarantorRelationship}
                      onValueChange={(value) => handleInputChange('guarantorRelationship', value)}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 text-xs font-semibold shadow-2xs">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {RELATIONSHIP_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-xs font-semibold">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guarantorAddress" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Dirección Domiciliaria del Aval
                  </Label>
                  <Textarea
                    id="guarantorAddress"
                    value={formData.guarantorAddress}
                    onChange={(e) => handleInputChange('guarantorAddress', e.target.value)}
                    placeholder="CALLE, NÚMERO, COLONIA, CIUDAD..."
                    rows={2}
                    className="bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl uppercase text-xs font-semibold focus-visible:ring-primary shadow-2xs resize-none"
                  />
                </div>

                <GPSCapture
                  label="Ubicación GPS Domicilio del Aval"
                  latitude={formData.guarantorLatitude}
                  longitude={formData.guarantorLongitude}
                  onLocationCapture={(lat, lng) => {
                    setFormData(prev => ({ ...prev, guarantorLatitude: lat, guarantorLongitude: lng }));
                  }}
                />
              </div>

              {/* Garantías en Prenda */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Garantías Prendarias</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Bienes o prendas prendarias dejadas en custodia</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                    {collaterals.length} prendas
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="newCollateral" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Descripción de la Prenda
                    </Label>
                    <Input
                      id="newCollateral"
                      value={newCollateral}
                      onChange={(e) => setNewCollateral(e.target.value.toUpperCase())}
                      placeholder="EJ. PANTALLA SMART TV LG 55 PULGADAS MOD 2024"
                      className="h-11 bg-white dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 rounded-xl uppercase text-xs font-semibold focus-visible:ring-primary shadow-2xs"
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
                      className="h-11 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-bold text-xs gap-1.5 transition-all active:scale-95 shadow-2xs"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Agregar</span>
                    </Button>
                  </div>
                </div>

                {collaterals.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                      <span>Prendas Registradas</span>
                      <span>{collaterals.length} en total</span>
                    </div>
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {collaterals.map((collateral, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800/80 transition-all hover:border-amber-200 dark:hover:border-amber-900/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-black shrink-0">
                              #{index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                {collateral}
                              </p>
                              <span className="text-[10px] text-gray-400 font-medium">
                                Prenda comercial validada
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCollateral(index)}
                            className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            aria-label="Eliminar prenda"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 text-gray-400 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800/60 flex items-center justify-center mx-auto text-gray-400">
                      <Package className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400">Sin garantías en prenda</p>
                    <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                      Si el crédito lo requiere, describe electrodomésticos, vehículos o bienes en garantía.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── PESTAÑA 5: BÓVEDA DIGITAL & PDF ── */}
          <TabsContent value="vault" className="space-y-5 mt-0">
            {/* Bóveda Digital */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Bóveda Digital de Documentos (KYC)</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Expediente digitalizado del acreditado para cumplimiento normativo PLD/FT</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <FileCheck className="h-3.5 w-3.5" />
                  {vaultDocs.length} documentos listos
                </span>
              </div>

              <DigitalVault
                onChange={(docs) => setVaultDocs(docs)}
              />
            </div>

            {/* Generador de Expediente PDF */}
            <ExpedientePdfGenerator
              clientData={formData}
              documents={vaultDocs}
              photoUrl={clientPhoto}
            />

            {/* Resumen de Auditoría Previo al Guardado */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Resumen de Registro del Cliente</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Verifica que los datos capturados sean correctos antes de guardar</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-sm hover:shadow transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Crear y Dar de Alta Cliente</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Titular</span>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate mt-0.5">
                    {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : 'Pendiente'}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Teléfono</span>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate mt-0.5">
                    {formData.phone || 'Pendiente'}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Domicilio & GPS</span>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate mt-0.5">
                    {formData.latitude && formData.longitude ? 'GPS Vinculado ✓' : (formData.address ? 'Dirección s/GPS' : 'Pendiente')}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ingreso Mensual</span>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate mt-0.5">
                    {formData.monthlyIncome ? `$${Number(formData.monthlyIncome).toLocaleString()} MXN` : 'Sin declarar'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Barra Flotante Inferior de Navegación del Stepper */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevTab}
              disabled={activeTab === 'general'}
              className="h-9 px-4 rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold gap-1.5 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </Button>

            {/* Stepper Dots */}
            <div className="flex items-center gap-1.5">
              {TABS_ORDER.map((tab, idx) => {
                const isCurrent = activeTab === tab;
                const isPassed = TABS_ORDER.indexOf(activeTab) > idx;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      isCurrent 
                        ? 'w-6 bg-blue-600' 
                        : isPassed 
                          ? 'w-2 bg-blue-300 dark:bg-blue-800' 
                          : 'w-2 bg-gray-200 dark:bg-gray-700'
                    }`}
                    title={`Paso ${idx + 1}`}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {activeTab !== 'vault' ? (
                <Button
                  type="button"
                  onClick={goToNextTab}
                  className="h-9 px-5 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-bold text-xs rounded-xl gap-1.5 shadow-2xs transition-all active:scale-95"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm hover:shadow transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>Crear Cliente</span>
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </form>
    </div>
  );
}
