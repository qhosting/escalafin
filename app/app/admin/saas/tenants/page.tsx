
'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    MoreVertical,
    Search,
    Building2,
    CreditCard,
    Users,
    CheckCircle2,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TenantsManagementPage() {
    const { data: tenants, isLoading, mutate } = useSWR('/api/admin/tenants', fetcher);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTenants = tenants?.filter((t: any) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const updateStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        try {
            const res = await fetch('/api/admin/tenants', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (res.ok) {
                toast.success(`Organización ${newStatus === 'ACTIVE' ? 'activada' : 'suspendida'} correctamente`);
                mutate();
            }
        } catch (error) {
            toast.error("Error al actualizar estado");
        }
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-indigo-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Tenants</h1>
                    <p className="text-gray-500">Administra todas las organizaciones registradas y su estado de facturación.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o slug..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-gray-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Organización</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Uso (U/C/P)</TableHead>
                            <TableHead>Fecha Registro</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTenants?.map((tenant: any) => (
                            <TableRow key={tenant.id} className="hover:bg-gray-50/50">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900">{tenant.name}</span>
                                        <span className="text-xs text-gray-500 font-mono">/{tenant.slug}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'destructive'} className={tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                                        {tenant.status === 'ACTIVE' ? (
                                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Activo</>
                                        ) : (
                                            <><AlertCircle className="h-3 w-3 mr-1" /> Suspendido</>
                                        )}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <Badge variant="outline" className="w-fit text-indigo-700 border-indigo-200">
                                            {tenant.subscription?.plan?.displayName || 'Sin Plan'}
                                        </Badge>
                                        {tenant.subscription?.status === 'TRIALING' && (
                                            <span className="text-[10px] text-amber-600 font-bold uppercase mt-1">Trial</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Users className="h-3 w-3" /> {tenant._count.users}
                                        <CreditCard className="h-3 w-3 ml-2" /> {tenant._count.loans}
                                        <Building2 className="h-3 w-3 ml-2" /> {tenant._count.clients}
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-500 text-sm">
                                    {new Date(tenant.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateStatus(tenant.id, tenant.status)}
                                        >
                                            {tenant.status === 'ACTIVE' ? 'Suspender' : 'Activar'}
                                        </Button>
                                        <Button size="icon" variant="ghost">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {filteredTenants?.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-500 italic">No se encontraron organizaciones con esos criterios.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
