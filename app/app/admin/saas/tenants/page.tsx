
'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ClientListSkeleton } from '@/components/ui/skeletons';
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

    if (isLoading) {
        return <ClientListSkeleton rows={8} />;
    }

    const totalTenants = tenants?.length || 0;
    const activeTenantsCount = tenants?.filter((t: any) => t.status === 'ACTIVE').length || 0;
    const waConnectedCount = tenants?.filter((t: any) => t.whatsappStatus === 'ACTIVE').length || 0;
    const demoCount = tenants?.filter((t: any) => t.isDemo).length || 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Toolbar de Control y Búsqueda */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border/80 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span>Ecosistema Multi-Tenant &bull; Aislamiento PostgreSQL</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-muted-foreground hidden md:inline-flex">
                        Row-Level Security Activo
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o slug..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 pl-8 text-xs bg-background"
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => mutate()}
                        className="h-8 gap-1.5 text-xs font-medium"
                    >
                        <Zap className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Actualizar</span>
                    </Button>
                </div>
            </div>

            {/* 2. KPIs de Organizaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Total Organizaciones</p>
                            <p className="text-2xl font-bold tracking-tight text-foreground">{totalTenants}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-primary" />
                                Base de clientes SaaS
                            </p>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <Building2 className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Tenants Activos</p>
                            <p className="text-2xl font-bold tracking-tight text-foreground">{activeTenantsCount}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                {totalTenants > 0 ? Math.round((activeTenantsCount / totalTenants) * 100) : 0}% de disponibilidad
                            </p>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">WhatsApp Conectado</p>
                            <p className="text-2xl font-bold tracking-tight text-foreground">{waConnectedCount}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <MessageCircle className="h-3 w-3 text-emerald-500" />
                                Canales Meta / Baileys
                            </p>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <MessageCircle className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Entornos Demo / Trial</p>
                            <p className="text-2xl font-bold tracking-tight text-foreground">{demoCount}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Zap className="h-3 w-3 text-amber-500" />
                                Cuentas de evaluación
                            </p>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Zap className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Tabla de Organizaciones */}
            <Card className="border border-border/80 bg-card shadow-xs overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow className="border-border/70 hover:bg-transparent">
                            <TableHead className="text-xs font-semibold text-muted-foreground">Organización</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Estado</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Plan</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">WhatsApp</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Uso (U/P/C)</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Fecha Registro</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-muted-foreground">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTenants?.map((tenant: any) => (
                            <TableRow key={tenant.id} className="hover:bg-muted/40 border-border/60 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        {tenant.logo && (
                                            <img src={tenant.logo} alt={tenant.name} className="w-8 h-8 rounded object-contain border border-border bg-white dark:bg-slate-900 p-0.5" />
                                        )}
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-foreground text-sm tracking-tight">{tenant.name}</span>
                                            <div className="flex gap-2 items-center">
                                                <span className="text-xs text-muted-foreground font-mono">/{tenant.slug}</span>
                                                {tenant.isDemo && (
                                                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 h-4 text-[8px] font-black tracking-widest">DEMO</Badge>
                                                )}
                                            </div>
                                            {tenant.domain && <span className="text-[10px] text-primary/80 font-medium">{tenant.domain}</span>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-semibold text-xs py-0.5' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 font-semibold text-xs py-0.5'}>
                                        {tenant.status === 'ACTIVE' ? (
                                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Activo</>
                                        ) : (
                                            <><AlertCircle className="h-3 w-3 mr-1" /> Suspendido</>
                                        )}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <Badge variant="outline" className="w-fit text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/10 font-medium text-xs">
                                            {tenant.subscription?.plan?.displayName || 'Sin Plan'}
                                        </Badge>
                                        {tenant.subscription?.status === 'TRIALING' && (
                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Trial</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`h-2 w-2 rounded-full ${tenant.whatsappStatus === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
                                            <span className={`text-[11px] font-bold ${tenant.whatsappStatus === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                                {tenant.whatsappStatus === 'ACTIVE' ? 'VINCULADO' : 'NO VINCULADO'}
                                            </span>
                                        </div>
                                        {tenant.whatsappPhone && (
                                            <div className="flex items-center text-[10px] text-muted-foreground font-mono">
                                                <Phone className="h-2.5 w-2.5 mr-1" />
                                                +{tenant.whatsappPhone}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1" title="Usuarios">
                                            <Users className="h-3 w-3 text-muted-foreground/70" />
                                            <span className="text-foreground font-medium">{tenant._count?.users || 0}</span>
                                        </span>
                                        <span className="flex items-center gap-1" title="Préstamos">
                                            <CreditCard className="h-3 w-3 text-muted-foreground/70" />
                                            <span className="text-foreground font-medium">{tenant._count?.loans || 0}</span>
                                        </span>
                                        <span className="flex items-center gap-1" title="Clientes">
                                            <Building2 className="h-3 w-3 text-muted-foreground/70" />
                                            <span className="text-foreground font-medium">{tenant._count?.clients || 0}</span>
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs font-mono">
                                    {new Date(tenant.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1.5">
                                        <Link href={`/admin/saas/tenants/${tenant.id}/users`}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 py-1 text-primary border-primary/30 hover:bg-primary/10 text-xs"
                                            >
                                                <Users className="h-3 w-3 mr-1" /> Usuarios
                                            </Button>
                                        </Link>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 py-1 border-border/80 text-foreground hover:bg-muted text-xs"
                                            onClick={() => handleEditTenant(tenant)}
                                        >
                                            <Edit2 className="h-3 w-3 mr-1" /> Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className={`h-8 py-1 text-xs ${tenant.status === 'ACTIVE' ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'}`}
                                            onClick={() => updateStatus(tenant.id, tenant.status)}
                                        >
                                            {tenant.status === 'ACTIVE' ? 'Suspender' : 'Activar'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 py-1 text-destructive/80 hover:text-destructive hover:bg-destructive/10 text-xs"
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
                        <p className="text-muted-foreground italic text-sm">No se encontraron organizaciones con esos criterios.</p>
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
                                    <span className="text-sm text-muted-foreground">{editingTenant.isDemo ? 'Excluir de ingresos' : 'Cuenta real'}</span>
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
                <AlertDialogContent className="border-destructive/30 bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            ¿Eliminar organización permanentemente?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 pt-2">
                            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 text-destructive text-sm">
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
                                <Label htmlFor="confirm-slug" className="text-foreground">
                                    Para confirmar, escribe el slug de la organización: <span className="font-mono font-bold text-foreground">{tenantToDelete?.slug}</span>
                                </Label>
                                <Input
                                    id="confirm-slug"
                                    placeholder="Escribe el slug aquí..."
                                    value={deleteConfirmSlug}
                                    onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                                    className="border-destructive/30 focus:ring-destructive bg-background text-foreground"
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
                            className="bg-destructive hover:bg-destructive/90 disabled:opacity-50"
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
