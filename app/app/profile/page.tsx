
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AuthWrapper } from '@/components/auth-wrapper';
import {
    User,
    Mail,
    Phone,
    Shield,
    Building2,
    Calendar,
    Save,
    Lock,
    Loader2,
    Camera,
    CheckCircle2
} from 'lucide-react';

export default function ProfilePage() {
    return (
        <AuthWrapper>
            <ProfileContent />
        </AuthWrapper>
    );
}

function ProfileContent() {
    const { data: session, update } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) {
                    const data = await res.json();
                    setUserData(data);
                    setFormData({
                        ...formData,
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        phone: data.phone || ''
                    });
                }
            } catch (error) {
                toast.error('Error al cargar perfil');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone
                })
            });

            if (res.ok) {
                toast.success('Perfil actualizado correctamente');
                // Update local state and potentially session
                const updated = await res.json();
                setUserData({ ...userData, ...updated });
                await update();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Error al actualizar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            if (res.ok) {
                toast.success('Contraseña actualizada');
                setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const error = await res.json();
                toast.error(error.error || 'Error al cambiar contraseña');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
            {/* Header Premium */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center text-5xl font-bold backdrop-blur-md">
                            {userData?.firstName?.charAt(0)}{userData?.lastName?.charAt(0)}
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 bg-white text-indigo-600 rounded-full shadow-lg hover:scale-110 transition-transform">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold">{userData?.firstName} {userData?.lastName}</h1>
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md px-3 py-1">
                                {userData?.role}
                            </Badge>
                            {userData?.status === 'ACTIVE' && (
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            )}
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-6 text-indigo-100 text-sm">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {userData?.email}
                            </div>
                            {userData?.tenant && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    {userData.tenant.name}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Miembro desde {new Date(userData?.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Información Personal */}
                <div className="lg:col-span-2">
                    <Card className="border-0 shadow-xl shadow-indigo-100/50 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle>Información Personal</CardTitle>
                                    <CardDescription>Actualiza tus datos de contacto básicos</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-8">
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-sm font-semibold">Nombre</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                id="firstName"
                                                className="pl-10 h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-sm font-semibold">Apellidos</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                id="lastName"
                                                className="pl-10 h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-semibold">Correo Electrónico</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                id="email"
                                                disabled
                                                className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl cursor-not-allowed"
                                                value={userData?.email}
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">El correo electrónico no puede ser modificado por seguridad.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm font-semibold">Teléfono</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                id="phone"
                                                className="pl-10 h-11 border-gray-200 rounded-xl"
                                                placeholder="+52 ..."
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-100">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-11 rounded-xl shadow-lg shadow-indigo-100 font-bold transition-all hover:scale-105 active:scale-95"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Seguridad */}
                <div className="lg:col-span-1">
                    <Card className="border-0 shadow-xl shadow-indigo-100/50 rounded-2xl overflow-hidden h-full">
                        <CardHeader className="bg-gray-50/50 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle>Seguridad</CardTitle>
                                    <CardDescription>Cambia tu contraseña de acceso</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-8">
                            <form onSubmit={handleChangePassword} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="current" className="text-sm font-semibold">Contraseña Actual</Label>
                                    <Input
                                        id="current"
                                        type="password"
                                        className="h-11 border-gray-200 rounded-xl"
                                        required
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new" className="text-sm font-semibold">Nueva Contraseña</Label>
                                    <Input
                                        id="new"
                                        type="password"
                                        className="h-11 border-gray-200 rounded-xl"
                                        required
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm" className="text-sm font-semibold">Confirmar Nueva Contraseña</Label>
                                    <Input
                                        id="confirm"
                                        type="password"
                                        className="h-11 border-gray-200 rounded-xl"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                                <div className="pt-4">
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl font-bold transition-all"
                                        disabled={saving}
                                    >
                                        Actualizar Contraseña
                                    </Button>
                                </div>

                                <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <Shield className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                                    <p className="text-[11px] text-blue-700 leading-tight">
                                        Tu contraseña debe ser robusta y contener al menos 8 caracteres, números y caracteres especiales para mayor protección.
                                    </p>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
