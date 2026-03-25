
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Edit, MapPin, User, Users, UserCheck
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
  latitude?: number | null; longitude?: number | null;
  loans: Array<{ id: string; loanNumber: string; principalAmount: number; balanceRemaining: number; status: string; startDate: string; payments: any[] }>;
  creditApplications: any[]; guarantor?: any; collaterals?: any[]; auditLogs?: any[];
}

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/clients/${params.id}`)
        .then(res => res.json())
        .then(data => { setClient(data); setLoading(false); })
        .catch(() => { toast.error('Error'); setLoading(false); });
    }
  }, [params?.id]);

  if (loading) return <div className="p-20 text-center">Cargando...</div>;
  if (!client) return <div className="p-20 text-center">No encontrado</div>;

  const totalLoans = client.loans?.length || 0;
  const totalBorrowed = (client.loans || []).reduce((s, l) => s + (l.principalAmount || 0), 0);
  const totalBalance = (client.loans || []).reduce((s, l) => s + (l.balanceRemaining || 0), 0);
  const totalPaid = totalBorrowed - totalBalance;
  // DIAGNOSTIC MARKER: XYZ123

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/clients"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <ClientProfileImage clientId={client.id} currentImage={client.profileImage} clientName={`${client.firstName}`} size="lg" />
          <div>
            <h1 className="text-2xl font-bold">Detalles: {client.firstName} {client.lastName}</h1>
            <Badge className="mt-1">{client.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <GPSCheckIn clientId={client.id} />
          <Link href={`/admin/clients/${client.id}/edit`}><Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" /> Editar</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs font-bold text-muted-foreground">Préstamos</p><p className="text-xl font-bold">{totalLoans}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-bold text-muted-foreground">Prestado</p><p className="text-xl font-bold">${totalBorrowed.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-bold text-muted-foreground">Saldo</p><p className="text-xl font-bold text-orange-600">${totalBalance.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-bold text-muted-foreground">Pagado</p><p className="text-xl font-bold text-green-600">${totalPaid.toLocaleString()}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="loans">Créditos</TabsTrigger>
          <TabsTrigger value="refs">Referencias</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="grid gap-6 md:grid-cols-2 mt-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Datos Personal/GPS</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm"><strong>Tel:</strong> {client.phone}</p>
              <p className="text-sm"><strong>Dir:</strong> {client.address}</p>
              {client.latitude && (
                <a href={`https://www.google.com/maps?q=${client.latitude},${client.longitude}`} target="_blank" className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                  <MapPin className="h-3 w-3" /> Ver ubicación GPS del Cliente
                </a>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Aval</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {client.guarantor ? (
                <>
                  <p className="text-sm"><strong>Nombre:</strong> {client.guarantor.fullName}</p>
                  <p className="text-sm"><strong>Tel:</strong> {client.guarantor.phone}</p>
                  {client.guarantor.latitude && (
                    <a href={`https://www.google.com/maps?q=${client.guarantor.latitude},${client.guarantor.longitude}`} target="_blank" className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                      <MapPin className="h-3 w-3" /> Ver ubicación GPS del Aval
                    </a>
                  )}
                </>
              ) : <p className="text-xs">Sin aval</p>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="loans" className="mt-6">
          <div className="space-y-4">
            {client.loans.map(loan => (
              <Card key={loan.id} className="p-4 flex justify-between items-center text-left">
                <div><p className="font-bold">{loan.loanNumber}</p><p className="text-xs">{new Date(loan.startDate).toLocaleDateString()}</p></div>
                <div className="text-right"><p className="font-bold">${loan.balanceRemaining.toLocaleString()}</p><Link href={`/admin/loans/${loan.id}`} className="text-xs text-primary underline">Ver detalle</Link></div>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="refs" className="mt-6">
          <PersonalReferencesForm clientId={client.id} readonly={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
