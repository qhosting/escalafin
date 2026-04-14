
'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { PageLoader } from '@/components/ui/page-loader';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
    Save,
    MessageCircle,
    Phone,
    ShieldCheck,
    Zap,
    Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TenantsManagementPage() {
    const { data: tenants, isLoading, mutate } = useSWR('/api/admin/tenants', fetcher);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingTenant, setEditingTenant] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // States for deletion
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [tenantToDelete, setTenantToDelete] = useState<any>(null);
    const [deleteConfirmSlug, setDeleteConfirmSlug] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

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

        // Client-side slug validation
        if (editingTenant.slug && !/^[a-z0-9-]+$/.test(editingTenant.slug)) {
            toast.error('El slug solo puede contener letras minúsculas, números y guiones');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/tenants', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingTenant.id,
                    name: editingTenant.name,
                    slug: editingTenant.slug,
                    domain: editingTenant.domain || null,
                    status: editingTenant.status,
                    logo: editingTenant.logo || null,
                    primaryColor: editingTenant.primaryColor,
                    timezone: editingTenant.timezone,
                    isDemo: editingTenant.isDemo
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Información del tenant actualizada correctamente');
                setIsEditDialogOpen(false);
                mutate();
            } else {
                toast.error(data.error || 'Error al actualizar');
            }
        } catch (error) {
            toast.error('Error de red al actualizar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTenant = async () => {
        if (!tenantToDelete || deleteConfirmSlug !== tenantToDelete.slug) {
            toast.error('El slug no coincide');
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/tenants?id=${tenantToDelete.id}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Organización eliminada completamente');
                setIsDeleteDialogOpen(false);
                setTenantToDelete(null);
                setDeleteConfirmSlug('');
                mutate();
            } else {
                toast.error(data.error || 'Error al eliminar');
            }
        } catch (error) {
            toast.error('Error de red al eliminar');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) return <PageLoader message="Obteniendo organizaciones..." />;

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
                            <TableHead>WhatsApp</TableHead>
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
                                            <div className="flex gap-2 items-center">
                                                <span className="text-xs text-gray-500 font-mono">/{tenant.slug}</span>
                                                {tenant.isDemo && (
                                                    <Badge className="bg-amber-100 text-amber-700 h-4 border-none text-[8px] font-black tracking-widest">DEMO</Badge>
                                                )}
                                            </div>
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
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`h-2 w-2 rounded-full ${tenant.whatsappStatus === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                            <span className={`text-[11px] font-bold ${tenant.whatsappStatus === 'ACTIVE' ? 'text-green-700' : 'text-gray-500'}`}>
                                                {tenant.whatsappStatus === 'ACTIVE' ? 'VINCULADO' : 'NO VINCULADO'}
                                            </span>
                                        </div>
                                        {tenant.whatsappPhone && (
                                            <div className="flex items-center text-[10px] text-gray-500 font-mono">
                                                <Phone className="h-2.5 w-2.5 mr-1" />
                                                +{tenant.whatsappPhone}
                                            </div>
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
                                        <Link href={`/admin/saas/tenants/${tenant.id}/users`}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 py-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                            >
                                                <Users className="h-3 w-3 mr-1" /> Usuarios
                                            </Button>
                                        </Link>
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
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 py-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => {
                                                setTenantToDelete(tenant);
                                                setIsDeleteDialogOpen(true);
                                                setDeleteConfirmSlug('');
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" /> Eliminar
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
                                <div className="col-span-3">
                                    <Input
                                        id="slug"
                                        value={editingTenant.slug}
                                        onChange={(e) => setEditingTenant({ ...editingTenant, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        className="col-span-3"
                                        placeholder="mi-empresa"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Solo minúsculas, números y guiones</p>
                                </div>
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
                                <Label htmlFor="isDemo" className="text-right">Perfil Demo</Label>
                                <div className="col-span-3 flex items-center space-x-2">
                                    <Switch 
                                        id="isDemo"
                                        checked={editingTenant.isDemo}
                                        onCheckedChange={(checked) => setEditingTenant({ ...editingTenant, isDemo: checked })}
                                    />
                                    <span className="text-sm text-gray-500">{editingTenant.isDemo ? 'Excluir de ingresos' : 'Cuenta real'}</span>
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="border-red-100 bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            ¿Eliminar organización permanentemente?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 pt-2">
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-700 text-sm">
                                <strong>ADVERTENCIA CRÍTICA:</strong> Esta acción eliminará permanentemente la organización 
                                <span className="font-bold underline ml-1">{tenantToDelete?.name}</span> y 
                                <strong> TODA</strong> la información relacionada:
                                <ul className="list-disc ml-6 mt-2 space-y-1">
                                    <li>Usuarios y cuentas (con sus sesiones)</li>
                                    <li>Catálogo de clientes y avales</li>
                                    <li>Todos los préstamos e historial de pagos</li>
                                    <li>Configuraciones de WhatsApp y WAHA</li>
                                    <li>Logs de auditoría y reportes generados</li>
                                </ul>
                                <p className="mt-3 font-bold">Esta acción NO se puede deshacer.</p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="confirm-slug" className="text-gray-700">
                                    Para confirmar, escribe el slug de la organización: <span className="font-mono font-bold text-gray-900">{tenantToDelete?.slug}</span>
                                </Label>
                                <Input
                                    id="confirm-slug"
                                    placeholder="Escribe el slug aquí..."
                                    value={deleteConfirmSlug}
                                    onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                                    className="border-red-200 focus:ring-red-500"
                                />
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setTenantToDelete(null);
                            setDeleteConfirmSlug('');
                        }}>
                            Cancelar
                        </AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTenant}
                            disabled={isDeleting || deleteConfirmSlug !== tenantToDelete?.slug}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                            {isDeleting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</>
                            ) : (
                                "Sí, eliminar todo definitivamente"
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
