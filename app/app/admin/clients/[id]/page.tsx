'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn, formatShortLoanNumber } from '@/lib/utils';
import {
  ArrowLeft, Edit, MapPin, User, Phone, Mail, Calendar,
  Briefcase, ShieldCheck, Package, ExternalLink,
  DollarSign, Navigation, Building2, CreditCard, TrendingUp,
  UserCheck, Shield, FileText, CheckCircle2, Clock, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { PersonalReferencesForm } from '@/components/clients/personal-references-form';
import { ClientProfileImage } from '@/components/clients/client-profile-image';
import { GPSCheckIn } from '@/components/collections/check-in-button';

interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string | null;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  monthlyIncome: number;
  creditScore: number;
  bankName?: string | null;
  accountNumber?: string | null;
  status: string;
  employmentType: string;
  employerName: string;
  workAddress: string;
  yearsEmployed: number;
  lateFeeType?: string | null;
  lateFeeAmount?: number | null;
  lateFeeMaxWeekly?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  asesor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  loans: Array<{
    id: string;
    loanNumber: string;
    principalAmount: number;
    balanceRemaining: number;
    status: string;
    startDate: string;
    payments: any[];
  }>;
  creditApplications: any[];
  guarantor?: {
    id: string;
    fullName: string;
    phone: string;
    address: string;
    relationship: string;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  collaterals?: Array<{ id: string; description: string; createdAt: string }>;
  auditLogs?: any[];
}

const relationshipLabels: Record<string, string> = {
  FAMILY: 'Familiar',
  FRIEND: 'Amigo(a)',
  COWORKER: 'Compañero de trabajo',
  NEIGHBOR: 'Vecino(a)',
  OTHER: 'Otro',
};

const employmentLabels: Record<string, string> = {
  EMPLOYED: 'Empleado',
  SELF_EMPLOYED: 'Independiente / Autoempleado',
  BUSINESS_OWNER: 'Dueño de negocio',
  UNEMPLOYED: 'Desempleado',
  RETIRED: 'Jubilado',
  STUDENT: 'Estudiante',
  OTHER: 'Otro',
};

const lateFeeTypeLabels: Record<string, string> = {
  DAILY_FIXED: 'Monto Fijo por Día',
  PERCENTAGE: 'Porcentaje sobre Saldo',
  NONE: 'Sin Moratorios',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/clients/${params.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Error al cargar cliente');
          return res.json();
        })
        .then(data => { setClient(data); setLoading(false); })
        .catch(err => { console.error(err); toast.error('Error al cargar los datos del cliente'); setLoading(false); });
    }
  }, [params?.id]);

  if (loading) return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-16 w-16 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
        ))}
      </div>
      <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
    </div>
  );

  if (!client) return (
    <div className="p-20 text-center space-y-4">
      <User className="h-12 w-12 text-slate-300 mx-auto" />
      <h3 className="text-xl font-black text-slate-700 dark:text-slate-300">Cliente no encontrado</h3>
      <Link href="/admin/clients">
        <Button variant="outline" className="rounded-xl">Volver a Clientes</Button>
      </Link>
    </div>
  );

  const totalLoans = client.loans?.length || 0;
  const totalBorrowed = (client.loans || []).reduce((s, l) => s + (l.principalAmount || 0), 0);
  const totalBalance = (client.loans || []).reduce((s, l) => s + (l.balanceRemaining || 0), 0);
  const totalPaid = Math.max(0, totalBorrowed - totalBalance);

  const hasGPS = Boolean(client.latitude && client.longitude);
  const hasGuarantorGPS = Boolean(client.guarantor?.latitude && client.guarantor?.longitude);

  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const age = calculateAge(client.dateOfBirth);

  return (
    <div className="space-y-6 text-left pb-20 max-w-7xl mx-auto">
      {/* ── HEADER SUPERIOR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-4">
          <Link href="/admin/clients">
            <Button variant="outline" size="icon" className="rounded-2xl h-11 w-11 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          <ClientProfileImage clientId={client.id} currentImage={client.profileImage} clientName={`${client.firstName || ''}`} size="lg" />
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {client.firstName} {client.lastName}
              </h1>
              <Badge className={cn('uppercase text-[10px] font-black rounded-full px-2.5 py-0.5 border-0',
                client.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                client.status === 'BLACKLISTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              )}>
                {client.status === 'ACTIVE' ? 'Activo' : client.status === 'BLACKLISTED' ? 'Lista Negra' : client.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-blue-600 font-semibold">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {client.phone}
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-blue-600 font-semibold">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> {client.email}
                </a>
              )}
              {client.asesor && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                  <UserCheck className="h-3.5 w-3.5" /> Asesor: {client.asesor.firstName} {client.asesor.lastName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GPSCheckIn clientId={client.id} />
          <Link href={`/admin/clients/${client.id}/edit`}>
            <Button variant="default" size="sm" className="rounded-2xl h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20">
              <Edit className="h-4 w-4 mr-2" /> Editar Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* ── TARJETAS DE ESTADÍSTICAS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5 text-blue-500" /> Total Créditos
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalLoans}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-indigo-500" /> Monto Prestado
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalBorrowed)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-orange-50/40 dark:bg-orange-950/20 border-orange-200/50">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-widest flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> Saldo Pendiente
            </p>
            <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{formatCurrency(totalBalance)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Total Pagado
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── SISTEMA DE PESTAÑAS ESTRUCTURADAS (1:1 CON EDITAR CLIENTE) ── */}
      <Tabs defaultValue="general" className="space-y-6">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden p-1.5 bg-slate-100/70 dark:bg-slate-900/60">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-1.5 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="general" 
              className="py-3 px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/30 data-[state=active]:scale-[1.02]"
            >
              <User className="h-4 w-4" />
              <span>1. General</span>
            </TabsTrigger>

            <TabsTrigger 
              value="address" 
              className="py-3 px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 data-[state=active]:bg-red-600 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-red-500/30 data-[state=active]:scale-[1.02]"
            >
              <MapPin className="h-4 w-4" />
              <span>2. Domicilio</span>
            </TabsTrigger>

            <TabsTrigger 
              value="financial" 
              className="py-3 px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:bg-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/30 data-[state=active]:scale-[1.02]"
            >
              <Briefcase className="h-4 w-4" />
              <span>3. Financiera</span>
            </TabsTrigger>

            <TabsTrigger 
              value="guarantor" 
              className="py-3 px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-purple-500/30 data-[state=active]:scale-[1.02]"
            >
              <UserCheck className="h-4 w-4" />
              <span>4. Aval & Bienes</span>
            </TabsTrigger>

            <TabsTrigger 
              value="loans" 
              className="py-3 px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 data-[state=active]:bg-emerald-600 data-[state=active]:text-white dark:data-[state=active]:bg-emerald-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-500/30 data-[state=active]:scale-[1.02]"
            >
              <CreditCard className="h-4 w-4" />
              <span>5. Créditos ({totalLoans})</span>
            </TabsTrigger>

            <TabsTrigger 
              value="refs" 
              className="py-3 px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 data-[state=active]:bg-amber-600 data-[state=active]:text-white dark:data-[state=active]:bg-amber-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-amber-500/30 data-[state=active]:scale-[1.02]"
            >
              <FileText className="h-4 w-4" />
              <span>6. Referencias</span>
            </TabsTrigger>
          </TabsList>
        </Card>

        {/* ═══════════════════ PESTAÑA 1: GENERAL & ESTADO ═══════════════════ */}
        <TabsContent value="general" className="space-y-6 mt-0">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-6">
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Información Personal & Identificación del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Nombre Completo</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{client.firstName} {client.lastName}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Teléfono Móvil</p>
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="text-lg font-bold text-blue-600 hover:underline flex items-center gap-1.5">
                      <Phone className="h-4 w-4" /> {client.phone}
                    </a>
                  ) : <p className="text-sm font-semibold text-slate-400">Sin teléfono registrado</p>}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Correo Electrónico</p>
                  {client.email ? (
                    <a href={`mailto:${client.email}`} className="text-lg font-bold text-blue-600 hover:underline flex items-center gap-1.5 truncate">
                      <Mail className="h-4 w-4" /> {client.email}
                    </a>
                  ) : <p className="text-sm font-semibold text-slate-400">Sin correo electrónico</p>}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Fecha de Nacimiento</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {client.dateOfBirth ? `${new Date(client.dateOfBirth).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}${age ? ` (${age} años)` : ''}` : 'No registrada'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Estatus en Sistema</p>
                  <div className="pt-0.5">
                    <Badge className={cn('uppercase font-black text-xs px-3 py-1 rounded-full border-0',
                      client.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      client.status === 'BLACKLISTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    )}>
                      {client.status === 'ACTIVE' ? 'Activo' : client.status === 'BLACKLISTED' ? 'Lista Negra' : client.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Asesor Comercial Asignado</p>
                  {client.asesor ? (
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      {client.asesor.firstName} {client.asesor.lastName}
                    </p>
                  ) : <p className="text-sm font-semibold text-slate-400">Sin asesor asignado</p>}
                </div>
              </div>

              {client.notes && (
                <>
                  <Separator />
                  <div className="space-y-2 bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-900/30">
                    <p className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">Notas & Observaciones del Expediente</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{client.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════ PESTAÑA 2: DOMICILIO & GPS ═══════════════════ */}
        <TabsContent value="address" className="space-y-6 mt-0">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-6">
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Dirección Residencial & Geolocalización GPS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Dirección Completa</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{client.address || 'No registrada'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Código Postal</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">{client.postalCode || 'No registrado'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Ciudad</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">{client.city || 'No registrada'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Estado</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">{client.state || 'No registrado'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Coordenadas GPS</p>
                  {hasGPS ? (
                    <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {client.latitude?.toFixed(6)}, {client.longitude?.toFixed(6)}
                    </p>
                  ) : <p className="text-sm font-semibold text-slate-400">Sin GPS guardado</p>}
                </div>
              </div>

              {/* Mapa Google Embed */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                {hasGPS ? (
                  <div className="space-y-0">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Ubicación Residencial Capturada</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${client.latitude},${client.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="default" size="sm" className="rounded-xl gap-1.5 bg-blue-600 text-white font-bold text-xs">
                          <Navigation className="h-3.5 w-3.5" /> Abrir Navegación en Google Maps
                        </Button>
                      </a>
                    </div>
                    <div className="w-full h-[360px] bg-slate-100">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://maps.google.com/maps?q=${client.latitude},${client.longitude}&z=16&output=embed`}
                        title="Ubicación del cliente"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-3 bg-slate-50 dark:bg-slate-900/40">
                    <MapPin className="h-12 w-12 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Sin ubicación GPS georreferenciada</p>
                      <p className="text-xs text-slate-400 mt-1">Usa el botón &quot;Check-in GPS&quot; en la parte superior para registrar la ubicación exacta.</p>
                    </div>
                    {client.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address + (client.city ? ', ' + client.city : '') + (client.state ? ', ' + client.state : ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline pt-2"
                      >
                        <MapPin className="h-3.5 w-3.5" /> Buscar dirección postal en Google Maps
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════ PESTAÑA 3: FINANCIERA, EMPLEO & MORATORIOS ═══════════════════ */}
        <TabsContent value="financial" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Financiera y Bancaria */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-6">
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Información Financiera & Bancaria
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                    <p className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">Ingreso Mensual</p>
                    <p className="text-xl font-black text-emerald-800 dark:text-emerald-300">
                      {client.monthlyIncome ? formatCurrency(client.monthlyIncome) : 'No declarado'}
                    </p>
                  </div>

                  <div className="space-y-1 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                    <p className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400">Score Crediticio</p>
                    <p className="text-xl font-black text-blue-800 dark:text-blue-300">
                      {client.creditScore ? `${client.creditScore} pts` : 'No asignado'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-blue-500" /> Banco Principal
                    </p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{client.bankName || 'No especificado'}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-blue-500" /> Número de Cuenta / Clabe
                    </p>
                    <p className="text-base font-bold font-mono text-slate-900 dark:text-white">{client.accountNumber || 'No especificado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información Laboral */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-6">
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                  Información Laboral & Ocupación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Tipo de Empleo</p>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {employmentLabels[client.employmentType] || client.employmentType || 'No registrado'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Antigüedad Laboral</p>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {client.yearsEmployed !== undefined && client.yearsEmployed !== null ? `${client.yearsEmployed} años` : 'No registrada'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Empresa / Empleador</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{client.employerName || 'No registrado'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Dirección de Trabajo</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">{client.workAddress || 'No registrada'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuración de Moratorios (NUEVO CAMPO) */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-6">
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Reglas de Moratorios & Penalización por Mora
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-orange-50/40 dark:bg-orange-950/20 p-5 rounded-2xl border border-orange-200/50 dark:border-orange-900/40">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-orange-700 dark:text-orange-400 tracking-wider">Tipo de Moratorio</p>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">
                    {lateFeeTypeLabels[client.lateFeeType || 'DAILY_FIXED'] || client.lateFeeType || 'Monto Fijo por Día'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-orange-700 dark:text-orange-400 tracking-wider">Monto / Porcentaje</p>
                  <p className="text-xl font-black text-orange-600 dark:text-orange-400">
                    {client.lateFeeType === 'PERCENTAGE' 
                      ? `${client.lateFeeAmount || 5}%` 
                      : `${formatCurrency(client.lateFeeAmount || 200)} / día`}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-orange-700 dark:text-orange-400 tracking-wider">Máximo Semanal Permitido</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    {client.lateFeeMaxWeekly ? formatCurrency(client.lateFeeMaxWeekly) : '$800.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════ PESTAÑA 4: AVAL & GARANTÍAS ═══════════════════ */}
        <TabsContent value="guarantor" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aval Personal */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-6">
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-purple-600" />
                  Información del Aval / Garantía Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {client.guarantor ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-1">
                        <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Nombre del Aval</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{client.guarantor.fullName}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Relación / Parentesco</p>
                        <Badge variant="outline" className="text-xs font-extrabold uppercase rounded-full px-3 py-0.5 border-purple-200 text-purple-700 bg-purple-50">
                          {relationshipLabels[client.guarantor.relationship] || client.guarantor.relationship}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Teléfono de Contacto</p>
                        <a href={`tel:${client.guarantor.phone}`} className="text-base font-bold text-purple-600 hover:underline flex items-center gap-1.5">
                          <Phone className="h-4 w-4" /> {client.guarantor.phone}
                        </a>
                      </div>

                      {client.guarantor.address && (
                        <div className="col-span-2 space-y-1">
                          <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Domicilio del Aval</p>
                          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{client.guarantor.address}</p>
                        </div>
                      )}
                    </div>

                    {hasGuarantorGPS && (
                      <a
                        href={`https://www.google.com/maps?q=${client.guarantor!.latitude},${client.guarantor!.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/40 hover:bg-purple-100 transition-colors mt-2"
                      >
                        <Navigation className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider">Ver Ubicación GPS del Aval en Google Maps</span>
                        <ExternalLink className="h-3.5 w-3.5 text-purple-500 ml-auto" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <Shield className="h-12 w-12 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-base font-bold text-slate-600 dark:text-slate-400">Sin aval registrado</p>
                      <p className="text-xs text-slate-400">Puedes registrar la información completa del aval desde la sección de edición.</p>
                    </div>
                    <Link href={`/admin/clients/${client.id}/edit`}>
                      <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs mt-2">
                        + Agregar Aval
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Garantías / Bienes */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-6">
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  Garantías Prendarias & Bienes Registrados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {client.collaterals && client.collaterals.length > 0 ? (
                  <div className="space-y-3">
                    {client.collaterals.map((col, idx) => (
                      <div key={col.id} className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-orange-600">{idx + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{col.description}</p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                            Registrado el {new Date(col.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <Package className="h-12 w-12 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-base font-bold text-slate-600 dark:text-slate-400">Sin garantías registradas</p>
                      <p className="text-xs text-slate-400">Puedes agregar garantías o bienes desde la sección de edición.</p>
                    </div>
                    <Link href={`/admin/clients/${client.id}/edit`}>
                      <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs mt-2">
                        + Agregar Garantía
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════ PESTAÑA 5: HISTORIAL DE CRÉDITOS ═══════════════════ */}
        <TabsContent value="loans" className="space-y-6 mt-0">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Historial de Préstamos ({client.loans.length})
              </CardTitle>
              <Link href="/admin/loans/new">
                <Button size="sm" className="rounded-xl font-bold bg-blue-600 text-white">
                  + Nuevo Préstamo
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              {client.loans.length > 0 ? (
                <div className="space-y-4">
                  {client.loans.map(loan => (
                    <Card key={loan.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-xl font-black text-sm border border-blue-200/60">
                              #{formatShortLoanNumber(loan.loanNumber)}
                            </span>
                            <Badge className={cn('text-[10px] font-black uppercase rounded-full border-0 px-2.5',
                              loan.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                              loan.status === 'PAID_OFF' ? 'bg-blue-100 text-blue-800' :
                              loan.status === 'DEFAULTED' ? 'bg-rose-100 text-rose-800' :
                              'bg-slate-100 text-slate-700'
                            )}>
                              {loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'PAID_OFF' ? 'Liquidado' : loan.status}
                            </Badge>
                          </div>
                          <p className="text-xs font-semibold text-slate-500">
                            Otorgado: {new Date(loan.startDate).toLocaleDateString('es-MX')} • Original: {formatCurrency(loan.principalAmount)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-slate-400">Saldo Restante</p>
                            <p className="text-lg font-black text-orange-600 dark:text-orange-400">{formatCurrency(loan.balanceRemaining)}</p>
                          </div>
                          <Link href={`/admin/loans/${loan.id}`}>
                            <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs h-10 px-4">
                              Ver Detalle →
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <CreditCard className="h-12 w-12 text-slate-300 mx-auto" />
                  <p className="text-base font-bold text-slate-600 dark:text-slate-400">Sin préstamos registrados</p>
                  <p className="text-xs text-slate-400">Este cliente aún no tiene un historial de microcréditos.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════ PESTAÑA 6: REFERENCIAS & EXPEDIENTE ═══════════════════ */}
        <TabsContent value="refs" className="space-y-6 mt-0">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-6">
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Referencias Personales del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <PersonalReferencesForm clientId={client.id} readonly={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
