
'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
    CreditCardIcon,
    BanknotesIcon,
    CurrencyDollarIcon,
    PencilSquareIcon,
    ArrowPathIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    TrendingUp,
    Users,
    Settings,
    Edit3,
    Trash2,
    Copy,
    BarChart3,
    Info,
    HelpCircle,
    History,
    ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    MoreHorizontal,
    LayoutGrid,
    Table as TableIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BillingPage() {
    const { data: plans, mutate: mutatePlans } = useSWR('/api/admin/plans', fetcher);
    const { data: subsData, mutate: mutateSubs } = useSWR('/api/admin/subscriptions-global', fetcher);
    const { data: addons, mutate: mutateAddons } = useSWR('/api/admin/addons', fetcher);
    const { data: auditLogs } = useSWR('/api/admin/audit?resource=PLAN', fetcher);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [selectedAddon, setSelectedAddon] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreateAddonOpen, setIsCreateAddonOpen] = useState(false);
    const [isEditAddonOpen, setIsEditAddonOpen] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [newPlan, setNewPlan] = useState({
        name: '',
        displayName: '',
        description: '',
        priceMonthly: 0,
        priceYearly: 0,
        limits: { users: 3, loans: 100, clients: 500, storageGB: 5 },
        features: ['feature1', 'feature2'],
        trialDays: 14,
        sortOrder: 0
    });

    const [newAddon, setNewAddon] = useState({
        name: '',
        displayName: '',
        description: '',
        priceMonthly: 0,
        type: 'FEATURE',
        config: '{}'
    });

    const handleUpdatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction(true);
        try {
            const res = await fetch('/api/admin/plans', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedPlan)
            });

            if (!res.ok) throw new Error('Error al actualizar plan');

            toast.success('Plan actualizado correctamente');
            setIsEditOpen(false);
            mutatePlans();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction(true);
        try {
            const res = await fetch('/api/admin/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPlan)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al crear plan');
            }

            toast.success('Plan creado exitosamente');
            setIsCreateOpen(false);
            setNewPlan({
                name: '',
                displayName: '',
                description: '',
                priceMonthly: 0,
                priceYearly: 0,
                limits: { users: 3, loans: 100, clients: 500, storageGB: 5 },
                features: ['feature1', 'feature2'],
                trialDays: 14,
                sortOrder: 0
            });
            mutatePlans();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDeletePlan = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de eliminar el plan "${name}"? Esta acción no se puede deshacer y fallará si existen suscripciones activas.`)) {
            return;
        }

        setLoadingAction(true);
        try {
            const res = await fetch(`/api/admin/plans/${id}`, {
                method: 'DELETE'
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al eliminar plan');

            toast.success('Plan eliminado correctamente');
            mutatePlans();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDuplicatePlan = (plan: any) => {
        setNewPlan({
            name: `${plan.name}-copy`,
            displayName: `${plan.displayName} (Copia)`,
            description: plan.description || '',
            priceMonthly: Number(plan.priceMonthly),
            priceYearly: plan.priceYearly ? Number(plan.priceYearly) : 0,
            limits: JSON.parse(plan.limits),
            features: JSON.parse(plan.features),
            trialDays: plan.trialDays || 14,
            sortOrder: (plan.sortOrder || 0) + 1
        });
        setIsCreateOpen(true);
    };

    // Addon Handlers
    const handleCreateAddon = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction(true);
        try {
            const res = await fetch('/api/admin/addons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAddon)
            });
            if (!res.ok) throw new Error('Error al crear addon');
            toast.success('Add-on creado');
            mutateAddons();
            setIsCreateAddonOpen(false);
            setNewAddon({ name: '', displayName: '', description: '', priceMonthly: 0, type: 'FEATURE', config: '{}' });
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleUpdateAddon = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction(true);
        try {
            const res = await fetch(`/api/admin/addons/${selectedAddon.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedAddon)
            });
            if (!res.ok) throw new Error('Error al actualizar addon');
            toast.success('Add-on actualizado');
            mutateAddons();
            setIsEditAddonOpen(false);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDeleteAddon = async (id: string) => {
        if (!confirm('¿Eliminar este add-on?')) return;
        try {
            const res = await fetch(`/api/admin/addons/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }
            toast.success('Add-on eliminado');
            mutateAddons();
        } catch (e: any) {
            toast.error(e.message);
        }
    };



    return (
        <div className="space-y-8 p-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Billing & Monetización</h1>
                    <p className="text-gray-500 mt-1">Gestión centralizada de precios, planes y suscripciones globales.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { mutatePlans(); mutateSubs(); }}>
                        <ArrowPathIcon className="h-4 w-4 mr-2" /> Actualizar
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" size="sm" onClick={() => setIsCreateOpen(true)}>
                        <PlusIcon className="h-4 w-4 mr-2" /> Crear Plan
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-sm border-gray-100 bg-gradient-to-br from-indigo-50 to-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-900 uppercase tracking-wider">MRR Actual</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-indigo-600">
                                ${(subsData?.totalMRR || 0).toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-indigo-400">MXN/mes</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Suscripciones Activas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-900">
                                {subsData?.activeSubCount || 0}
                            </span>
                            <span className="text-xs font-bold text-gray-400">de {subsData?.subscriptions?.length || 0} total</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Plan Más Popular</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-gray-900">
                                {plans?.find((p: any) => p.isPopular)?.displayName || 'N/A'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="plans" className="space-y-6">
                <TabsList className="bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger value="plans" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" /> Planes
                    </TabsTrigger>
                    <TabsTrigger value="addons" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" /> Add-ons
                    </TabsTrigger>
                    <TabsTrigger value="compare" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                        <TableIcon className="w-4 h-4" /> Comparativo
                    </TabsTrigger>
                    <TabsTrigger value="subscriptions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Suscripciones
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                        <History className="w-4 h-4" /> Auditoría
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="plans" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {plans?.map((plan: any) => (
                            <Card key={plan.id} className={`relative overflow-hidden transition-all hover:shadow-lg ${!plan.isActive ? 'opacity-70 grayscale' : ''}`}>
                                {plan.isPopular && (
                                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider z-10">
                                        Popular
                                    </div>
                                )}
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg font-bold">{plan.displayName}</CardTitle>
                                            <CardDescription className="line-clamp-2 h-10 mt-1">{plan.description}</CardDescription>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${plan.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                {plan.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                                                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-gray-100">
                                                    <DropdownMenuLabel className="text-[10px] text-gray-400 uppercase tracking-widest">Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleDuplicatePlan(plan)}>
                                                        <Copy className="h-4 w-4" /> Duplicar Plan
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="cursor-pointer gap-2 text-rose-600 focus:text-rose-700" onClick={() => handleDeletePlan(plan.id, plan.displayName)}>
                                                        <Trash2 className="h-4 w-4" /> Eliminar Plan
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-gray-900">${Number(plan.priceMonthly).toLocaleString()}</span>
                                            <span className="text-sm text-gray-500 font-medium">/mes</span>
                                        </div>
                                        {plan.priceYearly && Number(plan.priceYearly) > 0 && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[10px] font-bold border-emerald-100 text-emerald-600 bg-emerald-50">
                                                    Ahorra {Math.round(100 * (1 - (Number(plan.priceYearly) / (Number(plan.priceMonthly) * 12))))}% anual
                                                </Badge>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    (${Math.round(Number(plan.priceYearly) / 12).toLocaleString()}/mes pagando anual)
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs border-b pb-2">
                                            <span className="text-gray-500">Usuarios</span>
                                            <span className="font-bold">{JSON.parse(plan.limits).users === -1 ? 'Ilimitado' : JSON.parse(plan.limits).users}</span>
                                        </div>
                                        <div className="flex justify-between text-xs border-b pb-2">
                                            <span className="text-gray-500">Préstamos/mes</span>
                                            <span className="font-bold">{JSON.parse(plan.limits).loans === -1 ? 'Ilimitado' : JSON.parse(plan.limits).loans}</span>
                                        </div>
                                        <div className="flex justify-between text-xs border-b pb-2">
                                            <span className="text-gray-500">Clientes</span>
                                            <span className="font-bold">{JSON.parse(plan.limits).clients === -1 ? 'Ilimitado' : JSON.parse(plan.limits).clients}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex flex-col gap-2">
                                        <Button
                                            className="w-full font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100"
                                            onClick={() => {
                                                setSelectedPlan({
                                                    ...plan,
                                                    limits: JSON.parse(plan.limits),
                                                    features: JSON.parse(plan.features)
                                                });
                                                setIsEditOpen(true);
                                            }}
                                        >
                                            <PencilSquareIcon className="h-4 w-4 mr-2" /> Configurar Plan
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full font-medium text-gray-500 hover:text-indigo-600 text-xs"
                                            onClick={() => handleDuplicatePlan(plan)}
                                        >
                                            <Copy className="h-3 w-3 mr-2" /> Usar como Plantilla
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="addons" className="space-y-6">
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <h3 className="font-bold text-gray-900">Marketplace de Módulos</h3>
                            <p className="text-sm text-gray-500">Módulos adicionales que los tenants pueden comprar sobre su plan base.</p>
                        </div>
                        <Button onClick={() => {
                            setNewAddon({ name: '', displayName: '', description: '', priceMonthly: 0, type: 'FEATURE', config: '{}' });
                            setIsCreateAddonOpen(true);
                        }}>
                            <PlusIcon className="h-4 w-4 mr-2" /> Nuevo Add-on
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {addons?.map((addon: any) => (
                            <Card key={addon.id} className="relative overflow-hidden group hover:shadow-lg transition-all border-dashed border-2 border-gray-100 hover:border-indigo-100">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                <LayoutGrid className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-bold">{addon.displayName}</CardTitle>
                                                <CardDescription className="text-xs font-mono">{addon.name}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                                            {addon.type}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-gray-500 h-10 line-clamp-2">{addon.description}</p>

                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-indigo-600">${Number(addon.priceMonthly).toLocaleString()}</span>
                                        <span className="text-xs text-gray-400">/mes</span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-50">
                                        <span>Activo en {addon.activeCount || 0} orgs</span>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                                                onClick={() => {
                                                    setSelectedAddon(addon);
                                                    setIsEditAddonOpen(true);
                                                }}>
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-500"
                                                onClick={() => handleDeleteAddon(addon.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {(!addons || addons.length === 0) && (
                            <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-400 font-medium">No hay add-ons creados.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="compare">
                    <Card className="border-gray-100 shadow-xl overflow-hidden rounded-3xl">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="w-[200px] font-black uppercase text-[10px] tracking-widest text-gray-400">Características</TableHead>
                                    {plans?.filter((p: any) => p.isActive).map((plan: any) => (
                                        <TableHead key={plan.id} className="text-center min-w-[150px]">
                                            <div className="flex flex-col items-center py-2">
                                                {plan.isPopular && <Badge className="mb-1 text-[8px] h-4 bg-indigo-600">POPULAR</Badge>}
                                                <span className="font-black text-gray-900">{plan.displayName}</span>
                                                <span className="text-[10px] text-gray-500 font-mono tracking-tighter">ID: {plan.name}</span>
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-bold text-gray-700 bg-gray-50/20">Precio Mensual</TableCell>
                                    {plans?.filter((p: any) => p.isActive).map((plan: any) => (
                                        <TableCell key={plan.id} className="text-center font-black text-indigo-600">
                                            ${Number(plan.priceMonthly).toLocaleString()}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold text-gray-700 bg-gray-50/20">Límite Usuarios</TableCell>
                                    {plans?.filter((p: any) => p.isActive).map((plan: any) => {
                                        const lim = JSON.parse(plan.limits).users;
                                        return (
                                            <TableCell key={plan.id} className="text-center">
                                                {lim === -1 ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Ilimitado</Badge> : lim}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold text-gray-700 bg-gray-50/20">Límite Préstamos</TableCell>
                                    {plans?.filter((p: any) => p.isActive).map((plan: any) => {
                                        const lim = JSON.parse(plan.limits).loans;
                                        return (
                                            <TableCell key={plan.id} className="text-center">
                                                {lim === -1 ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Ilimitado</Badge> : lim}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold text-gray-700 bg-gray-50/20">Límite Clientes</TableCell>
                                    {plans?.filter((p: any) => p.isActive).map((plan: any) => {
                                        const lim = JSON.parse(plan.limits).clients;
                                        return (
                                            <TableCell key={plan.id} className="text-center">
                                                {lim === -1 ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Ilimitado</Badge> : lim}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold text-gray-700 bg-gray-50/20">Storage (GB)</TableCell>
                                    {plans?.filter((p: any) => p.isActive).map((plan: any) => {
                                        const lim = JSON.parse(plan.limits).storageGB || 5;
                                        return (
                                            <TableCell key={plan.id} className="text-center">
                                                {lim === -1 ? 'Ilimitado' : `${lim} GB`}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold text-gray-700 bg-gray-50/20">Días Trial</TableCell>
                                    {plans?.filter((p: any) => p.isActive).map((plan: any) => (
                                        <TableCell key={plan.id} className="text-center">
                                            {plan.trialDays} días
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold text-gray-700 bg-gray-50/20">Configurable</TableCell>
                                    {plans?.filter((p: any) => p.isActive).map((plan: any) => (
                                        <TableCell key={plan.id} className="text-center">
                                            <Button variant="ghost" size="sm" onClick={() => {
                                                setSelectedPlan({
                                                    ...plan,
                                                    limits: JSON.parse(plan.limits),
                                                    features: JSON.parse(plan.features)
                                                });
                                                setIsEditOpen(true);
                                            }}>
                                                <Edit3 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="subscriptions">
                    <Card className="border-gray-100 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Tenant / Organización</th>
                                        <th className="px-6 py-4">Plan Actual</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4">Ciclo de Facturación</th>
                                        <th className="px-6 py-4 text-right">MRR</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {subsData?.subscriptions?.map((sub: any) => (
                                        <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{sub.tenant.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{sub.tenant.slug}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="font-bold border-gray-200 text-gray-700">
                                                    {sub.plan.displayName}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={sub.status} />
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {format(new Date(sub.currentPeriodStart), 'd MMM', { locale: es })} - {format(new Date(sub.currentPeriodEnd), 'd MMM yyyy', { locale: es })}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                                                ${Number(sub.plan.priceMonthly).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                    <Card className="border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h3 className="font-black text-gray-900 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-indigo-600" /> Registro de Auditoría: Planes
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">Historial de creación, modificación y eliminación de planes de la plataforma.</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow>
                                        <TableHead className="w-[180px]">Fecha / Hora</TableHead>
                                        <TableHead>Acción</TableHead>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Recurso</TableHead>
                                        <TableHead>Detalles</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {auditLogs?.map((log: any) => (
                                        <TableRow key={log.id} className="text-xs group hover:bg-gray-50/50">
                                            <td className="px-4 py-3 font-mono text-gray-400 group-hover:text-indigo-600 transition-colors">
                                                {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={`font-bold text-[10px] ${log.action.includes('CREATE') ? 'border-emerald-200 text-emerald-700 bg-emerald-50/50' :
                                                    log.action.includes('DELETE') ? 'border-rose-200 text-rose-700 bg-rose-50/50' :
                                                        'border-blue-200 text-blue-700 bg-blue-50/50'
                                                    }`}>
                                                    {log.action}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-700">
                                                {log.user?.firstName || log.userEmail}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-gray-900">
                                                {log.resourceId ? (
                                                    <div className="flex flex-col">
                                                        <span>{log.details ? JSON.parse(log.details).displayName : 'Plan'}</span>
                                                        <span className="text-[10px] text-gray-400 font-mono tracking-tighter">ID: {log.resourceId}</span>
                                                    </div>
                                                ) : 'Global'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 italic max-w-xs truncate">
                                                {log.details ? log.details : 'Sin detalles adicionales'}
                                            </td>
                                        </TableRow>
                                    ))}
                                    {(!auditLogs || auditLogs.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-gray-400 italic">
                                                No se encontraron registros de auditoría para los planes.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Plan: {selectedPlan?.displayName}</DialogTitle>
                        <DialogDescription>
                            Modifica los límites y precios. Los cambios afectarán a nuevas suscripciones.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPlan && (
                        <form onSubmit={handleUpdatePlan} className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Precio Mensual (MXN)</Label>
                                    <Input
                                        type="number"
                                        value={selectedPlan.priceMonthly}
                                        onChange={e => setSelectedPlan({ ...selectedPlan, priceMonthly: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Precio Anual (MXN)</Label>
                                    <Input
                                        type="number"
                                        value={selectedPlan.priceYearly || ''}
                                        onChange={e => setSelectedPlan({ ...selectedPlan, priceYearly: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 border-t pt-4">
                                <h4 className="text-sm font-bold text-gray-900">Límites de Uso (-1 para ilimitado)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-500">Usuarios</Label>
                                        <Input
                                            type="number"
                                            value={selectedPlan.limits.users}
                                            onChange={e => setSelectedPlan({
                                                ...selectedPlan,
                                                limits: { ...selectedPlan.limits, users: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-500">Préstamos / mes</Label>
                                        <Input
                                            type="number"
                                            value={selectedPlan.limits.loans}
                                            onChange={e => setSelectedPlan({
                                                ...selectedPlan,
                                                limits: { ...selectedPlan.limits, loans: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-500">Clientes</Label>
                                        <Input
                                            type="number"
                                            value={selectedPlan.limits.clients}
                                            onChange={e => setSelectedPlan({
                                                ...selectedPlan,
                                                limits: { ...selectedPlan.limits, clients: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-500">Storage (GB)</Label>
                                        <Input
                                            type="number"
                                            value={selectedPlan.limits.storageGB}
                                            onChange={e => setSelectedPlan({
                                                ...selectedPlan,
                                                limits: { ...selectedPlan.limits, storageGB: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t pt-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={selectedPlan.isActive}
                                        onCheckedChange={c => setSelectedPlan({ ...selectedPlan, isActive: c })}
                                    />
                                    <Label>Plan Activo (Visible)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={selectedPlan.isPopular}
                                        onCheckedChange={c => setSelectedPlan({ ...selectedPlan, isPopular: c })}
                                    />
                                    <Label>Marcar como Popular</Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={loadingAction}>
                                    {loadingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Cambios
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Plan Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Plan</DialogTitle>
                        <DialogDescription>
                            Define un nuevo plan de suscripción para la plataforma.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreatePlan} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre Interno (ID)*</Label>
                                <Input
                                    placeholder="ej: premium"
                                    value={newPlan.name}
                                    onChange={e => setNewPlan({ ...newPlan, name: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                                    required
                                />
                                <p className="text-xs text-gray-500">Identificador único en minúsculas</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Nombre de Visualización*</Label>
                                <Input
                                    placeholder="ej: Premium"
                                    value={newPlan.displayName}
                                    onChange={e => setNewPlan({ ...newPlan, displayName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Textarea
                                placeholder="Descripción del plan..."
                                value={newPlan.description}
                                onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Precio Mensual (MXN)*</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newPlan.priceMonthly}
                                    onChange={e => setNewPlan({ ...newPlan, priceMonthly: Number(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Precio Anual (MXN)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newPlan.priceYearly}
                                    onChange={e => setNewPlan({ ...newPlan, priceYearly: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h4 className="text-sm font-bold text-gray-900">Límites de Uso (-1 para ilimitado)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Usuarios</Label>
                                    <Input
                                        type="number"
                                        value={newPlan.limits.users}
                                        onChange={e => setNewPlan({
                                            ...newPlan,
                                            limits: { ...newPlan.limits, users: Number(e.target.value) }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Préstamos / mes</Label>
                                    <Input
                                        type="number"
                                        value={newPlan.limits.loans}
                                        onChange={e => setNewPlan({
                                            ...newPlan,
                                            limits: { ...newPlan.limits, loans: Number(e.target.value) }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Clientes</Label>
                                    <Input
                                        type="number"
                                        value={newPlan.limits.clients}
                                        onChange={e => setNewPlan({
                                            ...newPlan,
                                            limits: { ...newPlan.limits, clients: Number(e.target.value) }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Storage (GB)</Label>
                                    <Input
                                        type="number"
                                        value={newPlan.limits.storageGB}
                                        onChange={e => setNewPlan({
                                            ...newPlan,
                                            limits: { ...newPlan.limits, storageGB: Number(e.target.value) }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Días de Prueba</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={newPlan.trialDays}
                                    onChange={e => setNewPlan({ ...newPlan, trialDays: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Orden de Visualización</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={newPlan.sortOrder}
                                    onChange={e => setNewPlan({ ...newPlan, sortOrder: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={loadingAction} className="bg-indigo-600 hover:bg-indigo-700">
                                {loadingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear Plan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Addon Modal */}
            <Dialog open={isCreateAddonOpen} onOpenChange={setIsCreateAddonOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Nuevo Add-on</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateAddon} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ID Interno</Label>
                                <Input value={newAddon.name} onChange={e => setNewAddon({ ...newAddon, name: e.target.value })} placeholder="whatsapp_bot" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Nombre Mostrar</Label>
                                <Input value={newAddon.displayName} onChange={e => setNewAddon({ ...newAddon, displayName: e.target.value })} placeholder="Bot WhatsApp" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input value={newAddon.description} onChange={e => setNewAddon({ ...newAddon, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Precio Mensual</Label>
                                <Input type="number" value={newAddon.priceMonthly} onChange={e => setNewAddon({ ...newAddon, priceMonthly: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newAddon.type} onChange={e => setNewAddon({ ...newAddon, type: e.target.value })}>
                                    <option value="FEATURE">Feature (Switch)</option>
                                    <option value="LIMIT_EXTENSION">Límite Extra</option>
                                    <option value="SERVICE">Servicio</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Config JSON</Label>
                            <Input value={newAddon.config} onChange={e => setNewAddon({ ...newAddon, config: e.target.value })} placeholder='{"storageGB": 10}' />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Crear</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Addon Modal */}
            {selectedAddon && (
                <Dialog open={isEditAddonOpen} onOpenChange={setIsEditAddonOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Editar Add-on</DialogTitle></DialogHeader>
                        <form onSubmit={handleUpdateAddon} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre Mostrar</Label>
                                <Input value={selectedAddon.displayName} onChange={e => setSelectedAddon({ ...selectedAddon, displayName: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Precio Mensual</Label>
                                <Input type="number" value={selectedAddon.priceMonthly} onChange={e => setSelectedAddon({ ...selectedAddon, priceMonthly: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Input value={selectedAddon.description} onChange={e => setSelectedAddon({ ...selectedAddon, description: e.target.value })} />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Guardar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: any = {
        ACTIVE: { color: 'text-emerald-700 bg-emerald-50', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Activa' },
        TRIALING: { color: 'text-blue-700 bg-blue-50', icon: <TrendingUp className="w-3 h-3" />, label: 'Prueba' },
        PAST_DUE: { color: 'text-rose-700 bg-rose-50', icon: <XCircle className="w-3 h-3" />, label: 'Mora' },
        CANCELED: { color: 'text-gray-700 bg-gray-50', icon: <XCircle className="w-3 h-3" />, label: 'Cancelada' },
    };

    const style = config[status] || config.ACTIVE;

    return (
        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${style.color}`}>
            {style.icon}
            <span>{style.label}</span>
        </span>
    );
}
