
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
    BuildingOfficeIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    PlusIcon,
    EllipsisVerticalIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
    ArrowPathIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline';
import {
    Users,
    Receipt,
    Mail,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    ExternalLink,
    AlertCircle,
    Activity,
    Search,
    Download,
    Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdminTenant {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    status: string;
    logo?: string | null;
    primaryColor?: string | null;
    createdAt: string;
    subscription?: {
        plan: {
            name: string;
            displayName: string;
            priceMonthly: number;
        }
        status: string;
    }
    _count?: {
        users: number;
        clients: number;
        loans: number;
    }
}

interface Plan {
    id: string;
    name: string;
    displayName: string;
    priceMonthly: number;
    isActive: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TenantsPageV2() {
    const router = useRouter();
    const { data: tenants, error, mutate, isLoading } = useSWR<AdminTenant[]>('/api/admin/tenants', fetcher);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        domain: '',
        status: 'ACTIVE',
        planName: 'starter'
    });

    const { data: plans, isLoading: isLoadingPlans } = useSWR<Plan[]>('/api/admin/plans', fetcher);

    // Debugging plans
    useEffect(() => {
        if (plans) {
            console.log('Plans loaded:', plans);
        }
    }, [plans]);

    useEffect(() => {
        if (plans && plans.length > 0) {
            const activePlans = plans.filter(p => p.isActive);

            // Si no hay plan seleccionado, o el seleccionado no es válido/activo
            const currentPlan = plans.find(p => p.name === formData.planName);
            const isValidSelection = currentPlan && currentPlan.isActive;

            if (!isValidSelection && activePlans.length > 0) {
                // Auto-seleccionar el primer plan activo (ej. 'planes-sol')
                setFormData(prev => ({ ...prev, planName: activePlans[0].name }));
            }
        }
    }, [plans, formData.planName]);

    const generateSlug = (name: string) => {
        return name.toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction('create');

        try {
            const res = await fetch('/api/admin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al crear');
            }

            toast.success('Organización creada exitosamente');
            setIsCreateOpen(false);
            setFormData({ name: '', slug: '', domain: '', status: 'ACTIVE', planName: 'starter' });
            mutate();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setLoadingAction(id);
        try {
            const res = await fetch('/api/admin/tenants', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (!res.ok) throw new Error('Error al actualizar estado');

            toast.success(`Organización ${newStatus === 'ACTIVE' ? 'activada' : 'suspendida'}`);
            mutate();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleExportBackup = async (id: string, name: string) => {
        setLoadingAction(`export-${id}`);
        try {
            const res = await fetch(`/api/admin/tenants/${id}/export`);

            if (!res.ok) throw new Error('Error al exportar backup');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-${generateSlug(name)}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Backup exportado exitosamente');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleImportBackup = async (id: string, name: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!confirm(`⚠️ ADVERTENCIA: Esto eliminará TODOS los datos actuales de "${name}" y los reemplazará con el backup.\n\n¿Estás seguro de continuar?`)) {
                return;
            }

            setLoadingAction(`import-${id}`);
            try {
                const text = await file.text();
                const backup = JSON.parse(text);

                const res = await fetch(`/api/admin/tenants/${id}/import`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        backup,
                        options: {
                            skipUsers: false,
                            overwriteTenantConfig: confirm('¿Sobrescribir también la configuración del tenant (nombre, logo, colores)?')
                        }
                    })
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Error al importar backup');
                }

                const result = await res.json();
                toast.success(`Backup importado: ${result.stats.counts.clients} clientes, ${result.stats.counts.loans} préstamos`);
                mutate();
            } catch (err: any) {
                console.error('Import error:', err);
                toast.error(err.message || 'Error al importar backup');
            } finally {
                setLoadingAction(null);
            }
        };

        input.click();
    };


    const filteredTenants = tenants?.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-red-50 rounded-2xl border border-red-100 m-4">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-900">Error critical de conexión</h3>
            <p className="text-red-600 max-w-md mt-2">No pudimos conectar con el registro central de organizaciones. Por favor verifica tus permisos o intenta de nuevo.</p>
            <Button variant="outline" className="mt-6 border-red-200 text-red-700 hover:bg-red-100" onClick={() => mutate()}>Reintentar conexión</Button>
        </div>
    );

    return (
        <div className="space-y-8 p-1">
            {/* Header Strategico */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ecosistema Global</h1>
                    <p className="text-gray-500 mt-1">Monitoreo y administración de instancias aisladas de EscalaFin.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <Input
                            placeholder="Filtrar por nombre o slug..."
                            className="pl-10 w-64 border-gray-200 focus:ring-indigo-500 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 rounded-xl font-bold">
                                <PlusIcon className="h-4 w-4 mr-2" /> Nueva Instancia
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Desplegar Nueva Instancia</DialogTitle>
                                <DialogDescription>
                                    Define los parámetros de la nueva organización. Se creará una base de datos aislada automáticamente.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-6 py-4">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold uppercase text-gray-400">Nombre de la Empresa</Label>
                                        <Input
                                            id="name"
                                            className="rounded-xl border-gray-200"
                                            value={formData.name}
                                            onChange={(e) => {
                                                const name = e.target.value;
                                                setFormData(prev => ({ ...prev, name, slug: generateSlug(name) }))
                                            }}
                                            placeholder="Ej. Financiera del Norte"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="slug" className="text-xs font-bold uppercase text-gray-400">Identificador (Slug)</Label>
                                        <div className="flex items-center group">
                                            <span className="bg-gray-50 border border-r-0 border-gray-200 text-gray-400 px-3 py-2 rounded-l-xl text-sm font-medium leading-none flex items-center h-[40px]">
                                                https://
                                            </span>
                                            <Input
                                                id="slug"
                                                className="rounded-none border-gray-200 h-[40px]"
                                                value={formData.slug}
                                                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                                placeholder="slug-unico"
                                                required
                                            />
                                            <span className="bg-gray-50 border border-l-0 border-gray-200 text-gray-400 px-3 py-2 rounded-r-xl text-sm font-medium leading-none flex items-center h-[40px]">
                                                .escalafin.com
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="plan" className="text-xs font-bold uppercase text-gray-400">Plan Inicial</Label>
                                            <Select
                                                value={formData.planName}
                                                onValueChange={(val) => setFormData(prev => ({ ...prev, planName: val }))}
                                            >
                                                <SelectTrigger className="rounded-xl border-gray-200">
                                                    <SelectValue placeholder="Plan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {plans?.filter(p => p.isActive).map((plan) => (
                                                        <SelectItem key={plan.id} value={plan.name}>
                                                            {plan.displayName}
                                                        </SelectItem>
                                                    ))}
                                                    {!plans?.length && !isLoadingPlans && (
                                                        <SelectItem value="starter">Starter (Auto-generado)</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status" className="text-xs font-bold uppercase text-gray-400">Estado</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                            >
                                                <SelectTrigger className="rounded-xl border-gray-200">
                                                    <SelectValue placeholder="Estado" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">Activo</SelectItem>
                                                    <SelectItem value="PENDING">Pendiente</SelectItem>
                                                    <SelectItem value="TRIAL">Prueba</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="ghost" className="rounded-xl font-bold" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold" disabled={!!loadingAction}>
                                        {loadingAction === 'create' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Provisionar Instancia
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Main Content Area */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 bg-gray-50 rounded-3xl animate-pulse border border-gray-100"></div>
                    ))}
                </div>
            ) : filteredTenants.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No hay organizaciones activas</h3>
                    <p className="text-gray-500 mt-1">Comienza desplegando el primer tenant para la plataforma.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTenants.map((tenant) => (
                        <ModernTenantCard
                            key={tenant.id}
                            tenant={tenant}
                            onUpdateStatus={handleStatusUpdate}
                            onExportBackup={handleExportBackup}
                            onImportBackup={handleImportBackup}
                            isLoading={loadingAction === tenant.id || loadingAction === `export-${tenant.id}` || loadingAction === `import-${tenant.id}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ModernTenantCard({
    tenant,
    onUpdateStatus,
    onExportBackup,
    onImportBackup,
    isLoading
}: {
    tenant: AdminTenant,
    onUpdateStatus: (id: string, s: string) => void,
    onExportBackup: (id: string, name: string) => void,
    onImportBackup: (id: string, name: string) => void,
    isLoading: boolean
}) {
    const router = useRouter();
    const isSuspended = tenant.status === 'SUSPENDED' || tenant.status === 'PAST_DUE';
    const planColors: any = {
        starter: 'bg-amber-50 text-amber-700 border-amber-100',
        professional: 'bg-blue-50 text-blue-700 border-blue-100',
        business: 'bg-purple-50 text-purple-700 border-purple-100',
        enterprise: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        legacy: 'bg-gray-50 text-gray-700 border-gray-100'
    };

    const statusConfig: any = {
        ACTIVE: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Activo', color: 'text-emerald-600 bg-emerald-50' },
        TRIAL: { icon: <Clock className="w-3 h-3" />, label: 'Prueba', color: 'text-blue-600 bg-blue-50' },
        PAST_DUE: { icon: <AlertCircle className="w-3 h-3" />, label: 'Mora', color: 'text-rose-600 bg-rose-50' },
        SUSPENDED: { icon: <XCircle className="w-3 h-3" />, label: 'Suspendido', color: 'text-gray-600 bg-gray-50' },
        PENDING: { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Provisionando', color: 'text-amber-600 bg-amber-50' }
    };

    const status = statusConfig[tenant.status] || statusConfig.ACTIVE;

    return (
        <Card className="hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-300 group border-gray-100 rounded-3xl overflow-hidden shadow-sm relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            )}
            <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-indigo-600 text-lg font-black uppercase ring-4 ring-gray-50">
                            {tenant.name[0]}
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {tenant.name}
                            </CardTitle>
                            <span className="text-[10px] font-mono text-gray-400 bg-white border border-gray-100 px-1.5 py-0.5 rounded leading-none">{tenant.slug}</span>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-white border border-transparent hover:border-gray-100">
                                <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl w-48 shadow-xl border-gray-100">
                            <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-widest px-4 py-2">Administrar</DropdownMenuLabel>
                            <DropdownMenuItem
                                className="cursor-pointer gap-2 px-4 py-2.5"
                                onClick={() => window.open(`https://${tenant.slug}.escalafin.com`, '_blank')}
                            >
                                <ExternalLink className="w-4 h-4" /> Ir a Subdominio
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer gap-2 px-4 py-2.5"
                                onClick={() => router.push(`/admin/audit?tenantId=${tenant.id}`)}
                            >
                                <Activity className="w-4 h-4" /> Ver Auditoría
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-widest px-4 py-2">Respaldos</DropdownMenuLabel>
                            <DropdownMenuItem className="cursor-pointer gap-2 px-4 py-2.5 text-blue-600 focus:text-blue-700" onClick={() => onExportBackup(tenant.id, tenant.name)}>
                                <Download className="w-4 h-4" /> Exportar Backup
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer gap-2 px-4 py-2.5 text-amber-600 focus:text-amber-700" onClick={() => onImportBackup(tenant.id, tenant.name)}>
                                <Upload className="w-4 h-4" /> Importar Backup
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-widest px-4 py-2">Estado Operativo</DropdownMenuLabel>
                            {tenant.status !== 'ACTIVE' && (
                                <DropdownMenuItem className="cursor-pointer gap-2 px-4 py-2.5 text-emerald-600 focus:text-emerald-700" onClick={() => onUpdateStatus(tenant.id, 'ACTIVE')}>
                                    <CheckCircle2 className="w-4 h-4" /> Activar Tenant
                                </DropdownMenuItem>
                            )}
                            {tenant.status === 'ACTIVE' && (
                                <DropdownMenuItem className="cursor-pointer gap-2 px-4 py-2.5 text-rose-600 focus:text-rose-700" onClick={() => onUpdateStatus(tenant.id, 'SUSPENDED')}>
                                    <XCircle className="w-4 h-4" /> Suspender Acceso
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
                <div className="flex items-center gap-2">
                    <Badge className={`${planColors[tenant.subscription?.plan?.name || 'starter'] || 'bg-gray-50 text-gray-700 border-gray-100'} border px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight`}>
                        {tenant.subscription?.plan?.displayName || 'Starter'}
                    </Badge>
                    <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border border-transparent ${status.color} font-bold text-[10px] uppercase tracking-tight`}>
                        {status.icon}
                        {status.label}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <StatItem icon={<Users className="w-3.5 h-3.5 text-blue-500" />} label="Usuarios" value={tenant._count?.users || 0} />
                    <StatItem icon={<Receipt className="w-3.5 h-3.5 text-emerald-500" />} label="Préstamos" value={tenant._count?.loans || 0} />
                    <StatItem icon={<Search className="w-3.5 h-3.5 text-amber-500" />} label="Clientes" value={tenant._count?.clients || 0} />
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">MRR Generado</span>
                        <span className="text-sm font-black text-gray-900">${(tenant.subscription?.plan?.priceMonthly || 0).toLocaleString()} MXN</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Antigüedad</span>
                        <p className="text-[11px] text-gray-600 font-medium">
                            {format(new Date(tenant.createdAt), "d MMM yyyy", { locale: es })}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatItem({ icon, label, value }: any) {
    return (
        <div className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-50 text-center flex flex-col items-center">
            {icon}
            <span className="text-lg font-black text-gray-900 mt-1">{value}</span>
            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">{label}</span>
        </div>
    );
}
