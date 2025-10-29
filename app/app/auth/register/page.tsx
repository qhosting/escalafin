
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'CLIENTE', // Siempre será CLIENTE para registro público
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch('/api/config/registration-status');
      const data = await response.json();
      setRegistrationEnabled(data.registrationEnabled);
    } catch (error) {
      console.error('Error checking registration status:', error);
      // En caso de error, permitir el registro por defecto
      setRegistrationEnabled(true);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones básicas
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Error al crear la cuenta');
        setLoading(false);
        return;
      }

      toast.success('Cuenta creada exitosamente');
      
      // Iniciar sesión automáticamente
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        // Solo clientes pueden registrarse públicamente, así que redirigir al dashboard de cliente
        router.replace('/cliente/dashboard');
      }
    } catch (error) {
      toast.error('Error al crear la cuenta');
      setLoading(false);
    }
  };

  if (checkingRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando disponibilidad del registro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5 px-4 py-12 relative">
      {/* Botón volver al inicio */}
      <Link 
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-700 hover:text-primary transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Volver al inicio</span>
      </Link>

      {/* Formulario de Registro */}
      <div className="w-full max-w-lg">
        {!registrationEnabled ? (
          /* Mensaje cuando el registro está deshabilitado */
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 sm:p-10">
            {/* Logotipo */}
            <div className="flex justify-center mb-6">
              <div className="relative h-16 w-64">
                <Image 
                  src="/logoescalafin.png" 
                  alt="EscalaFin Logo" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Icono de advertencia */}
            <div className="flex justify-center mb-6">
              <AlertTriangle className="h-16 w-16 text-amber-500" />
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-3">
              Registro No Disponible
            </h1>
            <p className="text-center text-gray-600 mb-6">
              El registro está temporalmente deshabilitado
            </p>

            {/* Contenido */}
            <div className="text-center space-y-6">
              <p className="text-sm text-gray-600">
                El administrador ha deshabilitado temporalmente el registro de nuevos usuarios. 
                Esta medida es temporal y el registro será habilitado nuevamente pronto.
              </p>
              
              <Button 
                asChild 
                className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 shadow-lg hover:shadow-xl transition-all"
              >
                <Link href="/auth/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Login
                </Link>
              </Button>
              
              <p className="text-xs text-gray-500">
                Si necesitas una cuenta, contacta al administrador del sistema.
              </p>
            </div>
          </div>
        ) : (
          /* Formulario de registro cuando está habilitado */
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 sm:p-10">
            {/* Logotipo centrado */}
            <div className="flex justify-center mb-8">
              <div className="relative h-16 w-64">
                <Image 
                  src="/logoescalafin.png" 
                  alt="EscalaFin Logo" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Título y subtítulo */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Crear Cuenta
              </h1>
              <p className="text-gray-600 text-sm">
                Completa tus datos para registrarte como cliente
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    Nombre
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                    placeholder="Juan"
                    className="px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Apellido
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                    placeholder="Pérez"
                    className="px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+52 555 123 4567"
                  className="px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Tipo de Usuario - Fijo como CLIENTE */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Tipo de Usuario
                </Label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 text-sm">
                  Cliente - Registro público solo para clientes
                </div>
                <p className="text-xs text-gray-500">
                  Los administradores y asesores se crean desde el panel de administración
                </p>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    placeholder="••••••••"
                    className="px-4 py-3 pr-12 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                    placeholder="••••••••"
                    className="px-4 py-3 pr-12 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Botón Submit */}
              <Button
                type="submit"
                className="w-full bg-primary text-white py-3.5 px-4 rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creando cuenta...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    <span>Crear Cuenta</span>
                  </div>
                )}
              </Button>

              {/* Link de Login */}
              <div className="text-center pt-2">
                <p className="text-gray-600 text-sm">
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Iniciar Sesión
                  </Link>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Texto adicional debajo del formulario */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Sistema de Gestión de Préstamos y Créditos
        </p>
      </div>
    </div>
  );
}
