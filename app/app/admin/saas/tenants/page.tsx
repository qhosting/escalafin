
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Loader2,
    MoreVertical,
    Search,
    Building2,
    CreditCard,
    Users,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Edit2,
    Save
} from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TenantsManagementPage() {
    const { data: tenants, isLoading, mutate } = useSWR('/api/admin/tenants', fetcher);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingTenant, setEditingTenant] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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

    const handleEditTenant = (tenant: any) => {
        setEditingTenant({ ...tenant });
        setIsEditDialogOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!editingTenant) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/tenants', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingTenant.id,
                    name: editingTenant.name,
                    slug: editingTenant.slug,
                    domain: editingTenant.domain,
                    status: editingTenant.status,
                    logo: editingTenant.logo,
                    primaryColor: editingTenant.primaryColor,
                    timezone: editingTenant.timezone
                })
            });

            if (res.ok) {
                toast.success("Información del tenant actualizada");
                setIsEditDialogOpen(false);
                mutate();
            } else {
                const error = await res.json();
                toast.error(error.error || "Error al actualizar");
            }
        } catch (error) {
            toast.error("Error de red al actualizar");
        } finally {
            setIsSaving(false);
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
                                    <div className="flex items-center gap-3">
                                        {tenant.logo && (
                                            <img src={tenant.logo} alt={tenant.name} className="w-8 h-8 rounded object-contain border bg-white" />
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{tenant.name}</span>
                                            <span className="text-xs text-gray-500 font-mono">/{tenant.slug}</span>
                                            {tenant.domain && <span className="text-[10px] text-indigo-500 font-medium">{tenant.domain}</span>}
                                        </div>
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
                                        <Users className="h-3 w-3" /> {tenant._count?.users || 0}
                                        <CreditCard className="h-3 w-3 ml-2" /> {tenant._count?.loans || 0}
                                        <Building2 className="h-3 w-3 ml-2" /> {tenant._count?.clients || 0}
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
                                            className="h-8 py-1"
                                            onClick={() => handleEditTenant(tenant)}
                                        >
                                            <Edit2 className="h-3 w-3 mr-1" /> Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className={`h-8 py-1 ${tenant.status === 'ACTIVE' ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'}`}
                                            onClick={() => updateStatus(tenant.id, tenant.status)}
                                        >
                                            {tenant.status === 'ACTIVE' ? 'Suspender' : 'Activar'}
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

            {/* Edit Tenant Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Organización</DialogTitle>
                        <DialogDescription>
                            Modifica los datos principales y de identidad de {editingTenant?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    {editingTenant && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Nombre</Label>
                                <Input
                                    id="name"
                                    value={editingTenant.name}
                                    onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="slug" className="text-right">Slug</Label>
                                <Input
                                    id="slug"
                                    value={editingTenant.slug}
                                    onChange={(e) => setEditingTenant({ ...editingTenant, slug: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="domain" className="text-right">Dominio</Label>
                                <Input
                                    id="domain"
                                    value={editingTenant.domain || ''}
                                    placeholder="ej. empresa.escalafin.com"
                                    onChange={(e) => setEditingTenant({ ...editingTenant, domain: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">Estado</Label>
                                <div className="col-span-3">
                                    <Select
                                        value={editingTenant.status}
                                        onValueChange={(val) => setEditingTenant({ ...editingTenant, status: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">Activo</SelectItem>
                                            <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                                            <SelectItem value="INACTIVE">Inactivo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="logo" className="text-right">Logo URL</Label>
                                <Input
                                    id="logo"
                                    value={editingTenant.logo || ''}
                                    onChange={(e) => setEditingTenant({ ...editingTenant, logo: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="color" className="text-right">Color</Label>
                                <div className="col-span-3 flex gap-2">
                                    <Input
                                        id="color"
                                        type="color"
                                        value={editingTenant.primaryColor || '#4f46e5'}
                                        onChange={(e) => setEditingTenant({ ...editingTenant, primaryColor: e.target.value })}
                                        className="w-12 p-1 h-10"
                                    />
                                    <Input
                                        value={editingTenant.primaryColor || '#4f46e5'}
                                        onChange={(e) => setEditingTenant({ ...editingTenant, primaryColor: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="timezone" className="text-right">Horario</Label>
                                <div className="col-span-3">
                                    <Select
                                        value={editingTenant.timezone || 'America/Mexico_City'}
                                        onValueChange={(val) => setEditingTenant({ ...editingTenant, timezone: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Zona Horaria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="America/Mexico_City">Ciudad de México</SelectItem>
                                            <SelectItem value="America/Tijuana">Tijuana / Pacífico</SelectItem>
                                            <SelectItem value="America/Cancun">Cancún / Este</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
