
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
    Edit3
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
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BillingPage() {
    const { data: plans, mutate: mutatePlans } = useSWR('/api/admin/plans', fetcher);
    const { data: subsData, mutate: mutateSubs } = useSWR('/api/admin/subscriptions-global', fetcher);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
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
                    <TabsTrigger value="plans" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Planes de Precios</TabsTrigger>
                    <TabsTrigger value="subscriptions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Suscripciones Globales</TabsTrigger>
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
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${plan.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {plan.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-gray-900">${plan.priceMonthly}</span>
                                        <span className="text-sm text-gray-500 font-medium">/mes</span>
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

                                    <div className="pt-2">
                                        <Button
                                            variant="outline"
                                            className="w-full font-bold border-gray-200 hover:bg-gray-50 hover:text-indigo-600"
                                            onClick={() => {
                                                setSelectedPlan({
                                                    ...plan,
                                                    limits: JSON.parse(plan.limits), // Parse for form
                                                    features: JSON.parse(plan.features)
                                                });
                                                setIsEditOpen(true);
                                            }}
                                        >
                                            <PencilSquareIcon className="h-4 w-4 mr-2" /> Editar Configuración
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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
