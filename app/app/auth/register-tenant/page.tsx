
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Building2, UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RegisterTenantPage() {
    const [formData, setFormData] = useState({
        companyName: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/register-tenant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorText = await res.text();
                toast.error(errorText || 'Error al registrar la empresa');
                setLoading(false);
                return;
            }

            toast.success('Empresa registrada exitosamente');

            // Auto login
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.ok) {
                router.replace('/admin/dashboard'); // Redirigir al dashboard administrativo
            } else {
                router.replace('/auth/login');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error de conexión');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8 relative">
            <Link
                href="/"
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors z-10"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Volver al inicio</span>
            </Link>

            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                {/* Lateral Izquierdo (Info) */}
                <div className="hidden md:flex flex-col justify-center bg-indigo-600 p-8 text-white w-1/3">
                    <Building2 className="h-12 w-12 mb-6" />
                    <h2 className="text-2xl font-bold mb-4">Empieza con EscalaFin</h2>
                    <p className="text-indigo-100 mb-6 text-sm">
                        La plataforma completa para gestionar tu negocio de préstamos y cobranza.
                    </p>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-300" /> 14 días de prueba gratis
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-300" /> Sin tarjeta de crédito
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-300" /> Soporte prioritario
                        </li>
                    </ul>
                </div>

                {/* Formulario */}
                <div className="w-full md:w-2/3 p-8 sm:p-10">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Registrar mi Empresa</h1>
                        <p className="text-gray-500 text-sm">Crea tu cuenta administrativa para gestionar tu organización.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Nombre de la Empresa / Organización</Label>
                            <Input
                                id="companyName"
                                placeholder="Financiera Ejemplo S.A."
                                required
                                value={formData.companyName}
                                onChange={(e) => handleChange('companyName', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nombre</Label>
                                <Input
                                    id="firstName"
                                    placeholder="Juan"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellido</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Pérez"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico (Admin)</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@empresa.com"
                                required
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                            {loading ? 'Creando cuenta...' : 'Comenzar Prueba Gratis'}
                        </Button>

                        <div className="text-center pt-2">
                            <p className="text-gray-600 text-sm">
                                ¿Ya tienes cuenta?{' '}
                                <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                                    Iniciar Sesión
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
