'use client';

import React, { useState } from 'react';
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
    CardDescription,
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
    MoreHorizontal,
    Save,
    Mail,
    Phone,
    CalendarDays,
    CheckCircle2,
    XCircle,
    Pause,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const roleConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    ADMIN: {
        label: 'Administrador',
        icon: <ShieldCheck className="h-3 w-3" />,
        color: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    ASESOR: {
        label: 'Asesor',
        icon: <Briefcase className="h-3 w-3" />,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    CLIENTE: {
        label: 'Cliente',
        icon: <User className="h-3 w-3" />,
        color: 'bg-gray-100 text-gray-700 border-gray-200',
    },
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    ACTIVE: {
        label: 'Activo',
        icon: <CheckCircle2 className="h-3 w-3" />,
        color: 'bg-green-100 text-green-700',
    },
    INACTIVE: {
        label: 'Inactivo',
        icon: <Pause className="h-3 w-3" />,
        color: 'bg-gray-100 text-gray-500',
    },
    SUSPENDED: {
        label: 'Suspendido',
        icon: <XCircle className="h-3 w-3" />,
        color: 'bg-red-100 text-red-700',
    },
};

export default function TenantUsersPage() {
    const params = useParams();
    const router = useRouter();
    const tenantId = params.id as string;

    const { data, isLoading, mutate } = useSWR(
        `/api/admin/tenants/${tenantId}/users`,
        fetcher
    );

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isResetPwDialogOpen, setIsResetPwDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

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
                    ...editUser
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
                toast.success('Contraseña actualizada');
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
            <div className="flex justify-center p-20">
                <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
            </div>
        );
    }

    if (data?.error) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 font-bold">{data.error}</p>
                <Link href="/admin/saas/tenants">
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
                    </Button>
                </Link>
            </div>
        );
    }

    const tenant = data?.tenant;
    const users = data?.users || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/saas/tenants">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-gray-100">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <UsersIcon className="h-6 w-6 text-indigo-600" />
                            Usuarios de {tenant?.name}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Slug: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{tenant?.slug}</code>
                            <span className="mx-2">·</span>
                            {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <UserPlus className="h-4 w-4 mr-2" /> Crear Usuario
                </Button>
            </div>

            {/* Users Table */}
            <Card className="border-gray-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>2FA</TableHead>
                            <TableHead>Registrado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user: any) => {
                            const rc = roleConfig[user.role] || roleConfig.CLIENTE;
                            const sc = statusConfig[user.status] || statusConfig.ACTIVE;
                            return (
                                <TableRow key={user.id} className="hover:bg-gray-50/50">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900">
                                                {user.firstName} {user.lastName}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Mail className="h-3 w-3" /> {user.email}
                                            </span>
                                            {user.phone && (
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {user.phone}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`${rc.color} font-medium`}>
                                            {rc.icon}
                                            <span className="ml-1">{rc.label}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${sc.color} font-medium border-0`}>
                                            {sc.icon}
                                            <span className="ml-1">{sc.label}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.twoFactorEnabled ? (
                                            <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                                                <Shield className="h-3 w-3 mr-1" /> Activo
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <CalendarDays className="h-3 w-3" />
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                title="Editar Usuario"
                                                onClick={() => handleEditClick(user)}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
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
                                                className={`h-8 px-2 ${user.status === 'ACTIVE'
                                                    ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50'
                                                    : 'text-green-500 hover:text-green-600 hover:bg-green-50'
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
                                                className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
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
                {users.length === 0 && (
                    <div className="text-center py-12">
                        <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                            Este tenant no tiene usuarios
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            Crea el primer administrador para esta organización.
                        </p>
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                        >
                            <UserPlus className="h-4 w-4 mr-2" /> Crear Primer Usuario
                        </Button>
                    </div>
                )}
            </Card>

            {/* Create User Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-indigo-600" />
                            Crear Usuario
                        </DialogTitle>
                        <DialogDescription>
                            Crear un nuevo usuario para <strong>{tenant?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="firstName">Nombre *</Label>
                                <Input
                                    id="firstName"
                                    placeholder="Juan"
                                    value={newUser.firstName}
                                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="lastName">Apellido *</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Pérez"
                                    value={newUser.lastName}
                                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@empresa.com"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Contraseña *</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                placeholder="+52 442 123 4567"
                                value={newUser.phone}
                                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="role">Rol</Label>
                            <Select
                                value={newUser.role}
                                onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-purple-600" /> Administrador
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="ASESOR">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-blue-600" /> Asesor
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="CLIENTE">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-600" /> Cliente
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateUser} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <UserPlus className="mr-2 h-4 w-4" />
                            )}
                            Crear Usuario
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isResetPwDialogOpen} onOpenChange={setIsResetPwDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-amber-600" />
                            Resetear Contraseña
                        </DialogTitle>
                        <DialogDescription>
                            Nueva contraseña para <strong>{selectedUser?.email}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="newPw">Nueva Contraseña</Label>
                        <Input
                            id="newPw"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetPwDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleResetPassword} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Actualizar Contraseña
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5 text-indigo-600" />
                            Editar Usuario
                        </DialogTitle>
                        <DialogDescription>
                            Modificar información de <strong>{selectedUser?.email}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="edit-firstName">Nombre *</Label>
                                <Input
                                    id="edit-firstName"
                                    value={editUser.firstName}
                                    onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-lastName">Apellido *</Label>
                                <Input
                                    id="edit-lastName"
                                    value={editUser.lastName}
                                    onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="edit-phone">Teléfono</Label>
                            <Input
                                id="edit-phone"
                                value={editUser.phone}
                                onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="edit-role">Rol</Label>
                                <Select
                                    value={editUser.role}
                                    onValueChange={(val) => setEditUser({ ...editUser, role: val })}
                                >
                                    <SelectTrigger>
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
                                <Label htmlFor="edit-status">Estado</Label>
                                <Select
                                    value={editUser.status}
                                    onValueChange={(val) => setEditUser({ ...editUser, status: val })}
                                >
                                    <SelectTrigger>
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
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateUser} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
