'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Loader2,
    ArrowLeft,
    UserPlus,
    Shield,
    ShieldCheck,
    Users as UsersIcon,
    Briefcase,
    User,
    Trash2,
    KeyRound,
    Save,
    Mail,
    Phone,
    CalendarDays,
    CheckCircle2,
    XCircle,
    Pause,
    Edit,
    RefreshCw,
    Search,
    X,
    UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const roleConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    ADMIN: {
        label: 'Administrador',
        icon: <ShieldCheck className="h-3 w-3" />,
        color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25',
    },
    ASESOR: {
        label: 'Asesor',
        icon: <Briefcase className="h-3 w-3" />,
        color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25',
    },
    CLIENTE: {
        label: 'Cliente',
        icon: <User className="h-3 w-3" />,
        color: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25',
    },
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    ACTIVE: {
        label: 'Activo',
        icon: <CheckCircle2 className="h-3 w-3" />,
        color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    },
    INACTIVE: {
        label: 'Inactivo',
        icon: <Pause className="h-3 w-3" />,
        color: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/25',
    },
    SUSPENDED: {
        label: 'Suspendido',
        icon: <XCircle className="h-3 w-3" />,
        color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25',
    },
};

export default function TenantUsersPage() {
    const params = useParams();
    const router = useRouter();
    const tenantId = params.id as string;

    const { data, isLoading, isValidating, mutate } = useSWR(
        `/api/admin/tenants/${tenantId}/users`,
        fetcher
    );

    const { data: session, update } = useSession();
    const isSuperAdmin = (session?.user?.role as string) === 'SUPER_ADMIN' || (session?.user as any)?.originalUser?.role === 'SUPER_ADMIN';
    const [impersonateTarget, setImpersonateTarget] = useState<any>(null);
    const [impersonatingLoading, setImpersonatingLoading] = useState(false);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isResetPwDialogOpen, setIsResetPwDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const handleConfirmImpersonate = async () => {
        if (!impersonateTarget) return;
        try {
            setImpersonatingLoading(true);
            const res = await fetch('/api/admin/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'impersonate',
                    targetUserId: impersonateTarget.id,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Error al iniciar intrapersona');
            }

            await update({ action: 'impersonate', targetUserId: impersonateTarget.id });
            toast.success(`Modo Intrapersona activado como ${impersonateTarget.firstName} ${impersonateTarget.lastName}`);
            setImpersonateTarget(null);

            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else {
                window.location.reload();
            }
        } catch (error: any) {
            console.error('Error al iniciar intrapersona:', error);
            toast.error(error.message || 'Error al iniciar intrapersona');
        } finally {
            setImpersonatingLoading(false);
        }
    };

    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'ADMIN',
    });
    const [editUser, setEditUser] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        role: '',
        status: '',
    });
    const [newPassword, setNewPassword] = useState('');

    const tenant = data?.tenant;
    const users: any[] = useMemo(() => data?.users || [], [data?.users]);

    // KPI Metrics calculation
    const totalUsers = users.length;
    const activeUsers = useMemo(() => users.filter((u) => u.status === 'ACTIVE').length, [users]);
    const adminUsers = useMemo(() => users.filter((u) => u.role === 'ADMIN').length, [users]);
    const twoFaUsers = useMemo(() => users.filter((u) => u.twoFactorEnabled).length, [users]);
    const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    const twoFaPercentage = totalUsers > 0 ? Math.round((twoFaUsers / totalUsers) * 100) : 0;

    // Filtered users list
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const query = searchTerm.toLowerCase().trim();
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
            const matchesSearch =
                !query ||
                fullName.includes(query) ||
                (user.email || '').toLowerCase().includes(query) ||
                (user.phone || '').toLowerCase().includes(query);

            const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
            toast.error('Por favor completa todos los campos requeridos');
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/tenants/${tenantId}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });

            if (res.ok) {
                toast.success(`Usuario ${newUser.email} creado exitosamente`);
                setIsCreateDialogOpen(false);
                setNewUser({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'ADMIN' });
                mutate();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Error al crear usuario');
            }
        } catch {
            toast.error('Error de red al crear usuario');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (user: any) => {
        const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        try {
            const res = await fetch(`/api/admin/tenants/${tenantId}/users`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, status: newStatus }),
            });
            if (res.ok) {
                toast.success(`Usuario ${newStatus === 'ACTIVE' ? 'activado' : 'suspendido'}`);
                mutate();
            }
        } catch {
            toast.error('Error al actualizar estado');
        }
    };

    const handleEditClick = (user: any) => {
        setSelectedUser(user);
        setEditUser({
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || '',
            role: user.role,
            status: user.status,
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!editUser.firstName || !editUser.lastName) {
            toast.error('Nombre y Apellido son requeridos');
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/tenants/${tenantId}/users`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    ...editUser,
                }),
            });

            if (res.ok) {
                toast.success('Usuario actualizado exitosamente');
                setIsEditDialogOpen(false);
                mutate();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Error al actualizar usuario');
            }
        } catch {
            toast.error('Error de red al actualizar usuario');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/tenants/${tenantId}/users`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUser.id, password: newPassword }),
            });
            if (res.ok) {
                toast.success('Contraseña actualizada exitosamente');
                setIsResetPwDialogOpen(false);
                setNewPassword('');
            }
        } catch {
            toast.error('Error al resetear contraseña');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async (user: any) => {
        if (!confirm(`¿Estás seguro de eliminar a ${user.firstName} ${user.lastName} (${user.email})? Esta acción es irreversible.`)) return;
        try {
            const res = await fetch(`/api/admin/tenants/${tenantId}/users?userId=${user.id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Usuario eliminado');
                mutate();
            }
        } catch {
            toast.error('Error al eliminar usuario');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-14 bg-muted/60 rounded-2xl w-full" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-muted/50 rounded-2xl border border-border/50" />
                    ))}
                </div>
                <div className="h-96 bg-muted/40 rounded-2xl border border-border/50" />
            </div>
        );
    }

    if (data?.error) {
        return (
            <div className="text-center py-20 bg-card/40 rounded-2xl border border-border/70 p-8">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-rose-500/10 text-rose-600 mb-3">
                    <XCircle className="h-8 w-8" />
                </div>
                <p className="text-destructive font-semibold text-lg">{data.error}</p>
                <p className="text-muted-foreground text-sm mt-1">No se pudo recuperar la información del inquilino solicitado.</p>
                <Link href="/admin/saas/tenants">
                    <Button variant="outline" className="mt-4 gap-2 border-border/80">
                        <ArrowLeft className="h-4 w-4" /> Volver al Directorio
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Executive Toolbar - Zero Redundant Titles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card/60 backdrop-blur-sm border border-border/80 p-3 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2 flex-wrap">
                    <Link href="/admin/saas/tenants">
                        <Button variant="ghost" size="sm" className="h-8 px-2.5 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                            <span className="text-xs font-medium">Organizaciones</span>
                        </Button>
                    </Link>
                    <span className="text-muted-foreground/30 text-xs">/</span>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Usuarios de {tenant?.name || 'Organización'}</span>
                        {tenant?.slug && (
                            <span className="font-mono text-[10px] bg-emerald-500/15 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300">
                                {tenant.slug}
                            </span>
                        )}
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono font-normal text-muted-foreground border-border/70 hidden md:inline-flex">
                        {users.length} {users.length === 1 ? 'cuenta' : 'cuentas'}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => mutate()}
                        disabled={isValidating}
                        className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground border-border/70"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="h-8 text-xs font-medium shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        Crear Usuario
                    </Button>
                </div>
            </div>

            {/* High-Density KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="border border-border/80 bg-card/60 shadow-xs rounded-2xl hover:border-border transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3.5 px-4 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Total Cuentas
                        </CardTitle>
                        <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <UsersIcon className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3.5 pt-1">
                        <div className="text-2xl font-bold tracking-tight text-foreground">{totalUsers}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            Asignados a este inquilino
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-card/60 shadow-xs rounded-2xl hover:border-border transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3.5 px-4 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Usuarios Activos
                        </CardTitle>
                        <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3.5 pt-1">
                        <div className="text-2xl font-bold tracking-tight text-foreground">{activeUsers}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activePercentage}%</span> disponibilidad operativa
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-card/60 shadow-xs rounded-2xl hover:border-border transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3.5 px-4 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Administradores
                        </CardTitle>
                        <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3.5 pt-1">
                        <div className="text-2xl font-bold tracking-tight text-foreground">{adminUsers}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Privilegios de gestión de tenant
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-card/60 shadow-xs rounded-2xl hover:border-border transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3.5 px-4 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Seguridad 2FA
                        </CardTitle>
                        <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Shield className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3.5 pt-1">
                        <div className="text-2xl font-bold tracking-tight text-foreground">{twoFaUsers}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            <span className="font-semibold text-amber-600 dark:text-amber-400">{twoFaPercentage}%</span> doble factor activo
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table Container with Integrated Filter Toolbar */}
            <Card className="border-border/80 bg-card/60 shadow-xs rounded-2xl overflow-hidden">
                <div className="p-3 border-b border-border/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-muted/20">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, correo o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 pl-8 text-xs bg-background/80 border-border/80 rounded-xl focus-visible:ring-1"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="h-8 text-xs w-[130px] bg-background/80 border-border/80 rounded-xl">
                                <SelectValue placeholder="Rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los roles</SelectItem>
                                <SelectItem value="ADMIN">Administrador</SelectItem>
                                <SelectItem value="ASESOR">Asesor</SelectItem>
                                <SelectItem value="CLIENTE">Cliente</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-8 text-xs w-[130px] bg-background/80 border-border/80 rounded-xl">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los estados</SelectItem>
                                <SelectItem value="ACTIVE">Activo</SelectItem>
                                <SelectItem value="INACTIVE">Inactivo</SelectItem>
                                <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                            </SelectContent>
                        </Select>

                        {(searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setRoleFilter('ALL');
                                    setStatusFilter('ALL');
                                }}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Limpiar
                            </Button>
                        )}

                        <span className="text-[11px] font-mono text-muted-foreground ml-1">
                            {filteredUsers.length} de {users.length}
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow className="border-border/70 hover:bg-transparent">
                                <TableHead className="text-xs font-semibold text-muted-foreground py-3">Usuario</TableHead>
                                <TableHead className="text-xs font-semibold text-muted-foreground py-3">Rol</TableHead>
                                <TableHead className="text-xs font-semibold text-muted-foreground py-3">Estado</TableHead>
                                <TableHead className="text-xs font-semibold text-muted-foreground py-3">Seguridad 2FA</TableHead>
                                <TableHead className="text-xs font-semibold text-muted-foreground py-3">Fecha Alta</TableHead>
                                <TableHead className="text-xs font-semibold text-muted-foreground py-3 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user: any) => {
                                const rc = roleConfig[user.role] || roleConfig.CLIENTE;
                                const sc = statusConfig[user.status] || statusConfig.ACTIVE;
                                const initials = `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || 'U';

                                return (
                                    <TableRow key={user.id} className="hover:bg-muted/30 border-border/60 transition-colors">
                                        <TableCell className="py-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0 border border-primary/20">
                                                    {initials}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-medium text-xs text-foreground truncate">
                                                        {user.firstName} {user.lastName}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                                                        <Mail className="h-3 w-3 shrink-0" /> {user.email}
                                                    </span>
                                                    {user.phone && (
                                                        <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1 font-mono">
                                                            <Phone className="h-2.5 w-2.5 shrink-0" /> {user.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <Badge variant="outline" className={`${rc.color} text-[11px] font-medium gap-1 py-0.5 rounded-lg`}>
                                                {rc.icon}
                                                <span>{rc.label}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <Badge variant="outline" className={`${sc.color} text-[11px] font-medium gap-1 py-0.5 rounded-lg`}>
                                                {sc.icon}
                                                <span>{sc.label}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            {user.twoFactorEnabled ? (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-normal gap-1">
                                                    <Shield className="h-3 w-3" /> Protegido
                                                </Badge>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground/60 font-mono pl-2">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-2.5 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1 font-mono text-[11px]">
                                                <CalendarDays className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {isSuperAdmin && user.id !== session?.user?.id && user.status === 'ACTIVE' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 px-2 text-[11px] font-bold gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-300 dark:border-amber-800 rounded-lg transition-all shadow-2xs active:scale-95"
                                                        title={`Iniciar sesión intrapersona como ${user.firstName} ${user.lastName}`}
                                                        onClick={() => setImpersonateTarget(user)}
                                                    >
                                                        <UserCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                                        <span className="hidden xl:inline">Intrapersona</span>
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                                    title="Editar Usuario"
                                                    onClick={() => handleEditClick(user)}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 rounded-lg"
                                                    title="Resetear Contraseña"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsResetPwDialogOpen(true);
                                                    }}
                                                >
                                                    <KeyRound className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className={`h-7 w-7 p-0 rounded-lg ${
                                                        user.status === 'ACTIVE'
                                                            ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-500/10'
                                                            : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10'
                                                    }`}
                                                    title={user.status === 'ACTIVE' ? 'Suspender' : 'Activar'}
                                                    onClick={() => handleToggleStatus(user)}
                                                >
                                                    {user.status === 'ACTIVE' ? (
                                                        <Pause className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                                    title="Eliminar Usuario"
                                                    onClick={() => handleDeleteUser(user)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12 px-4">
                        <UsersIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2.5" />
                        <p className="text-foreground font-medium text-sm">
                            {users.length === 0
                                ? 'Este inquilino no tiene usuarios registrados'
                                : 'No se encontraron usuarios coincidentes'}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto">
                            {users.length === 0
                                ? 'Comienza dando de alta al primer usuario administrador para este tenant.'
                                : 'Intenta ajustar los filtros de búsqueda o criterios de selección.'}
                        </p>
                        {users.length === 0 ? (
                            <Button
                                onClick={() => setIsCreateDialogOpen(true)}
                                size="sm"
                                className="mt-3.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                            >
                                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Crear Primer Usuario
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setRoleFilter('ALL');
                                    setStatusFilter('ALL');
                                }}
                                className="mt-3 text-xs"
                            >
                                Restablecer filtros
                            </Button>
                        )}
                    </div>
                )}
            </Card>

            {/* Create User Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[480px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <UserPlus className="h-4 w-4" />
                            </div>
                            Nuevo Usuario
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Asignar un nuevo usuario a <strong>{tenant?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3.5 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="firstName" className="text-xs">Nombre *</Label>
                                <Input
                                    id="firstName"
                                    placeholder="Juan"
                                    value={newUser.firstName}
                                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                    className="h-8 text-xs mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="lastName" className="text-xs">Apellido *</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Pérez"
                                    value={newUser.lastName}
                                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                    className="h-8 text-xs mt-1"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="email" className="text-xs">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@empresa.com"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                className="h-8 text-xs mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" className="text-xs">Contraseña Inicial *</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                className="h-8 text-xs mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone" className="text-xs">Teléfono</Label>
                            <Input
                                id="phone"
                                placeholder="+52 442 123 4567"
                                value={newUser.phone}
                                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                className="h-8 text-xs mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="role" className="text-xs">Rol Asignado</Label>
                            <Select
                                value={newUser.role}
                                onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                            >
                                <SelectTrigger className="h-8 text-xs mt-1">
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Administrador
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="ASESOR">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Asesor
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="CLIENTE">
                                        <div className="flex items-center gap-2">
                                            <User className="h-3.5 w-3.5 text-slate-500" /> Cliente
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)} className="text-xs h-8">
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateUser} disabled={isSaving} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8">
                            {isSaving ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Crear Usuario
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isResetPwDialogOpen} onOpenChange={setIsResetPwDialogOpen}>
                <DialogContent className="sm:max-w-[400px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                                <KeyRound className="h-4 w-4" />
                            </div>
                            Resetear Contraseña
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Asignar nueva clave a <strong>{selectedUser?.email}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label htmlFor="newPw" className="text-xs">Nueva Contraseña</Label>
                        <Input
                            id="newPw"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-8 text-xs mt-1"
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setIsResetPwDialogOpen(false)} className="text-xs h-8">
                            Cancelar
                        </Button>
                        <Button onClick={handleResetPassword} disabled={isSaving} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8">
                            {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                            Actualizar Contraseña
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[480px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <Edit className="h-4 w-4" />
                            </div>
                            Editar Usuario
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Modificar cuenta de <strong>{selectedUser?.email}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3.5 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="edit-firstName" className="text-xs">Nombre *</Label>
                                <Input
                                    id="edit-firstName"
                                    value={editUser.firstName}
                                    onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                                    className="h-8 text-xs mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-lastName" className="text-xs">Apellido *</Label>
                                <Input
                                    id="edit-lastName"
                                    value={editUser.lastName}
                                    onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                                    className="h-8 text-xs mt-1"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="edit-phone" className="text-xs">Teléfono</Label>
                            <Input
                                id="edit-phone"
                                value={editUser.phone}
                                onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                                className="h-8 text-xs mt-1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="edit-role" className="text-xs">Rol</Label>
                                <Select
                                    value={editUser.role}
                                    onValueChange={(val) => setEditUser({ ...editUser, role: val })}
                                >
                                    <SelectTrigger className="h-8 text-xs mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADMIN">Administrador</SelectItem>
                                        <SelectItem value="ASESOR">Asesor</SelectItem>
                                        <SelectItem value="CLIENTE">Cliente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="edit-status" className="text-xs">Estado</Label>
                                <Select
                                    value={editUser.status}
                                    onValueChange={(val) => setEditUser({ ...editUser, status: val })}
                                >
                                    <SelectTrigger className="h-8 text-xs mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Activo</SelectItem>
                                        <SelectItem value="INACTIVE">Inactivo</SelectItem>
                                        <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)} className="text-xs h-8">
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateUser} disabled={isSaving} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8">
                            {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Intrapersona Confirmation Dialog */}
            <Dialog open={!!impersonateTarget} onOpenChange={(open) => !open && setImpersonateTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
                            <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <span>Iniciar Modo Intrapersona</span>
                        </DialogTitle>
                    </DialogHeader>
                    {impersonateTarget && (
                        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                            <p>
                                ¿Deseas iniciar sesión temporalmente con el perfil de{' '}
                                <strong className="text-gray-900 dark:text-white font-black">
                                    {impersonateTarget.firstName} {impersonateTarget.lastName}
                                </strong>{' '}
                                ({roleConfig[impersonateTarget.role]?.label || impersonateTarget.role}) de este inquilino?
                            </p>
                            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs space-y-1.5 text-amber-900 dark:text-amber-300">
                                <div className="font-bold flex items-center gap-1.5 text-amber-950 dark:text-amber-200">
                                    <Shield className="w-4 h-4 text-amber-600" />
                                    <span>Seguridad y Auditoría Activa</span>
                                </div>
                                <p className="text-[11px] text-amber-800/90 dark:text-amber-400 leading-relaxed">
                                    Todas las acciones quedarán auditadas bajo tu ID de Super Admin. La sesión cuenta con firma criptográfica HMAC y expiración automática. Podrás volver a tu cuenta en cualquier momento con el botón «Salir de Intrapersona».
                                </p>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={impersonatingLoading}
                                    onClick={() => setImpersonateTarget(null)}
                                    className="text-xs h-8"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={impersonatingLoading}
                                    onClick={handleConfirmImpersonate}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 text-xs h-8"
                                >
                                    {impersonatingLoading ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <UserCheck className="w-3.5 h-3.5" />
                                    )}
                                    <span>Confirmar e Iniciar</span>
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
