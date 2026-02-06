
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Building2, User, Mail, Lock, Phone, ArrowRight, CheckCircle2, Globe, ShieldCheck } from 'lucide-react';

export default function RegisterTenantPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        orgName: '',
        orgSlug: '',
        adminFirstName: '',
        adminLastName: '',
        adminEmail: '',
        adminPassword: '',
        adminConfirmPassword: '',
        adminPhone: '',
        token: '', // Campo para el token de invitación
    });

    useEffect(() => {
        // Carga inicial del token desde la URL (solo cliente)
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const t = urlParams.get('token');
            if (t) {
                setLoading(true);
                setFormData(prev => ({ ...prev, token: t }));
                fetch(`/api/auth/invitation-data?token=${t}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.email) {
                            setFormData(prev => ({
                                ...prev,
                                adminEmail: data.email,
                                orgName: data.orgName || prev.orgName,
                                orgSlug: (data.orgName || '').toLowerCase().replace(/[^a-z0-9]/g, '-')
                            }));
                            toast.info('Datos de invitación cargados');
                        }
                    })
                    .catch(err => console.error('Error loading invitation:', err))
                    .finally(() => setLoading(false));
            }
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [id]: value };
            // Si cambia el nombre de la org y no se ha modificado manualmente el slug, sugerir uno
            if (id === 'orgName' && !prev.orgSlug) {
                newData.orgSlug = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            }
            return newData;
        });
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.orgName || !formData.orgSlug) {
                toast.error('Por favor completa los datos de la organización');
                return;
            }
            setStep(2);
        }
    };

    const prevStep = () => setStep(1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.adminPassword !== formData.adminConfirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register-tenant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Ocurrió un error al registrar');
            }

            toast.success('¡Registro exitoso! Iniciando sesión...');

            // Auto login
            const result = await signIn('credentials', {
                email: formData.adminEmail,
                password: formData.adminPassword,
                redirect: false,
            });

            if (result?.ok) {
                router.push('/admin/dashboard');
            } else {
                router.push('/auth/login');
            }
        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <Image src="/logoescalafin.png" alt="EscalaFin" width={200} height={60} className="object-contain" />
                </div>
                <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Registra tu Organización
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Comienza a gestionar tus préstamos de manera profesional
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
                <Card className="shadow-xl border-slate-200">
                    <CardHeader className="space-y-1 pb-6 border-b">
                        <div className="flex items-center justify-between mb-2">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'} font-bold text-sm`}>1</div>
                            <div className="flex-1 h-1 mx-4 bg-slate-200">
                                <div className={`h-full bg-primary transition-all duration-300 ${step === 2 ? 'w-full' : 'w-0'}`}></div>
                            </div>
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'} font-bold text-sm`}>2</div>
                        </div>
                        <CardTitle className="text-xl">
                            {step === 1 ? 'Datos de la Empresa' : 'Datos del Administrador'}
                        </CardTitle>
                        <CardDescription>
                            {step === 1
                                ? 'Configura el nombre y subdominio de tu aplicación'
                                : 'Crea tu cuenta de súper usuario administrador'}
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="pt-6 space-y-4">
                            {step === 1 ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2">
                                        <Label htmlFor="orgName">Nombre de la Organización</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="orgName"
                                                placeholder="Mi Financiera S.A."
                                                className="pl-10"
                                                value={formData.orgName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="orgSlug">Subdominio (URL de acceso)</Label>
                                        <div className="relative flex items-center">
                                            <Globe className="absolute left-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="orgSlug"
                                                placeholder="mi-financiera"
                                                className="pl-10 pr-32"
                                                value={formData.orgSlug}
                                                onChange={handleChange}
                                                required
                                            />
                                            <div className="absolute right-3 text-slate-400 text-sm font-medium">
                                                .escalafin.com
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500">
                                            Esta será la URL que tú y tus clientes usarán para acceder.
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
                                        <h4 className="flex items-center text-sm font-semibold text-blue-900 mb-1">
                                            <ShieldCheck className="w-4 h-4 mr-2" /> Seguridad Multi-tenant
                                        </h4>
                                        <p className="text-xs text-blue-800 leading-relaxed">
                                            Tus datos estarán aislados y protegidos bajo tu propio espacio virtual.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="adminFirstName">Nombre</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="adminFirstName"
                                                    placeholder="Juan"
                                                    className="pl-10"
                                                    value={formData.adminFirstName}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="adminLastName">Apellido</Label>
                                            <Input
                                                id="adminLastName"
                                                placeholder="Pérez"
                                                value={formData.adminLastName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="adminEmail">Email Profesional</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="adminEmail"
                                                type="email"
                                                placeholder="juan@mifinanciera.com"
                                                className="pl-10"
                                                value={formData.adminEmail}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="adminPhone">Teléfono (WhatsApp)</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="adminPhone"
                                                placeholder="+52 555 123 4567"
                                                className="pl-10"
                                                value={formData.adminPhone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="adminPassword">Contraseña</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="adminPassword"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="pl-10"
                                                    value={formData.adminPassword}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="adminConfirmPassword">Confirmar</Label>
                                            <Input
                                                id="adminConfirmPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.adminConfirmPassword}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 pt-4 border-t">
                            <div className="flex w-full gap-3">
                                {step === 2 && (
                                    <Button type="button" variant="outline" className="flex-1" onClick={prevStep} disabled={loading}>
                                        Atrás
                                    </Button>
                                )}

                                {step === 1 ? (
                                    <Button type="button" className="w-full h-11" onClick={nextStep}>
                                        Continuar <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button type="submit" className="flex-1 h-11" disabled={loading}>
                                        {loading ? 'Procesando...' : 'Crear Organización'}
                                    </Button>
                                )}
                            </div>

                            <div className="text-center text-sm text-slate-500">
                                ¿Ya tienes una cuenta?{' '}
                                <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                                    Inicia sesión aquí
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>

                <div className="mt-8 flex justify-center items-center gap-8 opacity-60">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Aislamiento de Datos
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Subdominio Propio
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Cloud Ready
                    </div>
                </div>
            </div>
        </div>
    );
}
