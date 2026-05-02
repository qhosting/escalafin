
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Edit, MapPin, User, Phone,
  Briefcase, ShieldCheck, Package, ExternalLink,
  DollarSign, Navigation
} from 'lucide-react';
import { toast } from 'sonner';
import { PersonalReferencesForm } from '@/components/clients/personal-references-form';
import { ClientProfileImage } from '@/components/clients/client-profile-image';
import { GPSCheckIn } from '@/components/collections/check-in-button';

interface ClientData {
  id: string; firstName: string; lastName: string; email: string; phone: string;
  profileImage?: string | null; dateOfBirth: string; address: string; city: string; state: string;
  postalCode: string; monthlyIncome: number; creditScore: number; status: string;
  employmentType: string; employerName: string; workAddress: string; yearsEmployed: number;
  latitude?: number | null; longitude?: number | null; notes?: string | null;
  loans: Array<{ id: string; loanNumber: string; principalAmount: number; balanceRemaining: number; status: string; startDate: string; payments: any[] }>;
  creditApplications: any[];
  guarantor?: {
    id: string; fullName: string; phone: string; address: string;
    relationship: string; latitude?: number | null; longitude?: number | null;
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
  SELF_EMPLOYED: 'Independiente',
  BUSINESS_OWNER: 'Dueño de negocio',
  UNEMPLOYED: 'Desempleado',
  RETIRED: 'Jubilado',
  STUDENT: 'Estudiante',
  OTHER: 'Otro',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/clients/${params.id}`)
        .then(res => res.json())
        .then(data => { setClient(data); setLoading(false); })
        .catch(() => { toast.error('Error al cargar el cliente'); setLoading(false); });
    }
  }, [params?.id]);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-gray-100 rounded-xl" />
        <div className="h-16 w-16 bg-gray-100 rounded-2xl" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-100 rounded-lg" />
          <div className="h-4 w-32 bg-gray-100 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-50 rounded-2xl border border-gray-100" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-50 rounded-2xl border border-gray-100" />
        <div className="h-64 bg-gray-50 rounded-2xl border border-gray-100" />
      </div>
    </div>
  );
  if (!client) return <div className="p-20 text-center">No encontrado</div>;

  const totalLoans = client.loans?.length || 0;
  const totalBorrowed = (client.loans || []).reduce((s, l) => s + (l.principalAmount || 0), 0);
  const totalBalance = (client.loans || []).reduce((s, l) => s + (l.balanceRemaining || 0), 0);
  const totalPaid = totalBorrowed - totalBalance;

  const hasGPS = client.latitude && client.longitude;
  const hasGuarantorGPS = client.guarantor?.latitude && client.guarantor?.longitude;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/clients"><Button variant="outline" size="icon" className="rounded-xl h-10 w-10 shrink-0"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <ClientProfileImage clientId={client.id} currentImage={client.profileImage} clientName={`${client.firstName || ''}`} size="lg" />
          <div>
            <h1 className="text-xl md:text-2xl font-black">{client.firstName} {client.lastName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn('uppercase text-[10px] font-black rounded-full',
                client.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              )}>{client.status === 'ACTIVE' ? 'Activo' : client.status}</Badge>
              {client.phone && (
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {client.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <GPSCheckIn clientId={client.id} />
          <Link href={`/admin/clients/${client.id}/edit`}><Button variant="outline" size="sm" className="rounded-xl"><Edit className="h-4 w-4 mr-1" /> Editar</Button></Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-gray-100"><CardContent className="p-4 space-y-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Préstamos</p>
          <p className="text-2xl font-black">{totalLoans}</p>
        </CardContent></Card>
        <Card className="rounded-2xl border-gray-100"><CardContent className="p-4 space-y-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Prestado</p>
          <p className="text-2xl font-black">{formatCurrency(totalBorrowed)}</p>
        </CardContent></Card>
        <Card className="rounded-2xl border-gray-100"><CardContent className="p-4 space-y-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Saldo</p>
          <p className="text-2xl font-black text-orange-600">{formatCurrency(totalBalance)}</p>
        </CardContent></Card>
        <Card className="rounded-2xl border-gray-100"><CardContent className="p-4 space-y-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pagado</p>
          <p className="text-2xl font-black text-green-600">{formatCurrency(totalPaid)}</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="loans">Créditos</TabsTrigger>
          <TabsTrigger value="refs">Referencias</TabsTrigger>
        </TabsList>

        {/* ═══════════════════ TAB: INFO ═══════════════════ */}
        <TabsContent value="info" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">

            {/* ── Datos Personales ── */}
            <Card className="rounded-2xl border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg"><User className="h-4 w-4 text-blue-600" /></div>
                  Datos Personales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Teléfono</p>
                    <p className="text-sm font-semibold">{client.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Email</p>
                    <p className="text-sm font-semibold truncate">{client.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">F. Nacimiento</p>
                    <p className="text-sm font-semibold">{client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString('es-MX') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Score</p>
                    <p className="text-sm font-semibold">{client.creditScore || '—'}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Dirección</p>
                  <p className="text-sm font-semibold">{client.address || '—'}</p>
                  {(client.city || client.state) && (
                    <p className="text-xs text-muted-foreground">{[client.city, client.state, client.postalCode].filter(Boolean).join(', ')}</p>
                  )}
                </div>
                {client.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Notas / Observaciones</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* ── Empleo ── */}
            <Card className="rounded-2xl border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg"><Briefcase className="h-4 w-4 text-purple-600" /></div>
                  Información Laboral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Tipo de Empleo</p>
                    <p className="text-sm font-semibold">{employmentLabels[client.employmentType] || client.employmentType || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Ingreso Mensual</p>
                    <p className="text-sm font-semibold">{client.monthlyIncome ? formatCurrency(client.monthlyIncome) : '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Empleador</p>
                    <p className="text-sm font-semibold">{client.employerName || '—'}</p>
                  </div>
                  {client.workAddress && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Dir. Trabajo</p>
                      <p className="text-sm font-semibold">{client.workAddress}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Años Empleado</p>
                    <p className="text-sm font-semibold">{client.yearsEmployed ?? '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Aval / Garantía Personal ── */}
            <Card className="rounded-2xl border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 rounded-lg"><ShieldCheck className="h-4 w-4 text-green-600" /></div>
                  Aval / Garantía Personal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.guarantor ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Nombre Completo</p>
                        <p className="text-sm font-bold">{client.guarantor.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Relación</p>
                        <Badge variant="outline" className="mt-0.5 text-[10px] font-bold uppercase rounded-full">
                          {relationshipLabels[client.guarantor.relationship] || client.guarantor.relationship}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Teléfono</p>
                        <a href={`tel:${client.guarantor.phone}`} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {client.guarantor.phone}
                        </a>
                      </div>
                      {client.guarantor.address && (
                        <div className="col-span-2">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Dirección</p>
                          <p className="text-sm font-semibold">{client.guarantor.address}</p>
                        </div>
                      )}
                    </div>
                    {hasGuarantorGPS && (
                      <a
                        href={`https://www.google.com/maps?q=${client.guarantor!.latitude},${client.guarantor!.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                      >
                        <Navigation className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-wider">Ver Ubicación GPS del Aval</span>
                        <ExternalLink className="h-3 w-3 text-green-500 ml-auto" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <ShieldCheck className="h-10 w-10 text-gray-200 mx-auto" />
                    <p className="text-xs font-bold text-muted-foreground">Sin aval registrado</p>
                    <p className="text-[10px] text-muted-foreground">El aval se puede agregar desde la sección de edición.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Garantías / Bienes ── */}
            <Card className="rounded-2xl border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <div className="p-1.5 bg-orange-100 rounded-lg"><Package className="h-4 w-4 text-orange-600" /></div>
                  Garantías / Bienes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.collaterals && client.collaterals.length > 0 ? (
                  <div className="space-y-3">
                    {client.collaterals.map((col, idx) => (
                      <div key={col.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-orange-600">{idx + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-snug">{col.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Registrado: {new Date(col.createdAt).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <Package className="h-10 w-10 text-gray-200 mx-auto" />
                    <p className="text-xs font-bold text-muted-foreground">Sin garantías registradas</p>
                    <p className="text-[10px] text-muted-foreground">Las garantías se pueden agregar desde la sección de edición.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Mapa de Ubicación del Cliente ── */}
          <Card className="rounded-2xl border-gray-100 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg"><MapPin className="h-4 w-4 text-red-600" /></div>
                Ubicación del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {hasGPS ? (
                <div className="space-y-0">
                  <div className="px-6 pb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Coordenadas: <span className="font-mono font-bold">{client.latitude}, {client.longitude}</span></p>
                      <p className="text-xs text-muted-foreground">{client.address}</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${client.latitude},${client.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="rounded-xl gap-1">
                        <Navigation className="h-3.5 w-3.5" /> Navegar
                      </Button>
                    </a>
                  </div>
                  <div className="w-full h-[350px] bg-gray-100">
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
                <div className="px-6 pb-6 text-center py-12 space-y-3">
                  <MapPin className="h-12 w-12 text-gray-200 mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-muted-foreground">Sin ubicación GPS registrada</p>
                    <p className="text-xs text-muted-foreground">Usa el botón &quot;Check-in GPS&quot; para registrar la ubicación de este cliente.</p>
                  </div>
                  {client.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address + (client.city ? ', ' + client.city : '') + (client.state ? ', ' + client.state : ''))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <MapPin className="h-3 w-3" /> Buscar dirección en Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════ TAB: CRÉDITOS ═══════════════════ */}
        <TabsContent value="loans" className="mt-6">
          <div className="space-y-4">
            {client.loans.length > 0 ? client.loans.map(loan => (
              <Card key={loan.id} className="rounded-2xl border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-black text-sm">{loan.loanNumber}</p>
                    <p className="text-xs text-muted-foreground">{new Date(loan.startDate).toLocaleDateString('es-MX')}</p>
                    <Badge className={cn('mt-1 text-[10px] font-bold uppercase rounded-full',
                      loan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      loan.status === 'PAID_OFF' ? 'bg-blue-100 text-blue-700' :
                      loan.status === 'DEFAULTED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    )}>{loan.status}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-black">{formatCurrency(loan.balanceRemaining)}</p>
                    <Link href={`/admin/loans/${loan.id}`} className="text-xs font-bold text-primary hover:underline">Ver detalle →</Link>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12">
                <DollarSign className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm font-bold text-muted-foreground">Sin préstamos registrados</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══════════════════ TAB: REFERENCIAS ═══════════════════ */}
        <TabsContent value="refs" className="mt-6">
          <PersonalReferencesForm clientId={client.id} readonly={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
