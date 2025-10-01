
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus, Building2, AlertTriangle, ArrowLeft } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando disponibilidad del registro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero Section */}
      <div className="lg:flex-1 bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 flex flex-col justify-center px-8 lg:px-12 py-12 relative">
        {/* Botón volver */}
        <Link 
          href="/auth/login"
          className="absolute top-6 left-6 flex items-center gap-2 text-indigo-100 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Volver al login</span>
        </Link>

        <div className="max-w-md mx-auto text-white">
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="w-10 h-10" />
            <h1 className="text-3xl font-bold">EscalaFin</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-4">
            {registrationEnabled ? 'Registro de Clientes' : 'Registro Temporalmente Deshabilitado'}
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            {registrationEnabled 
              ? 'Crea tu cuenta como cliente y accede a la plataforma. Solicita préstamos, consulta tu historial crediticio y gestiona tus pagos de manera fácil y segura.'
              : 'El registro de nuevos clientes está temporalmente deshabilitado. Si necesitas acceso a la plataforma, contacta al administrador del sistema.'
            }
          </p>
          {registrationEnabled && (
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                <span className="text-blue-100">Solicita préstamos de forma digital</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                <span className="text-blue-100">Consulta tu historial crediticio</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                <span className="text-blue-100">Gestiona tus pagos online</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Register Form or Disabled Message */}
      <div className="lg:flex-1 flex items-center justify-center px-8 py-12 bg-gray-50">
        {!registrationEnabled ? (
          <Card className="w-full max-w-md shadow-lg border-0">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-amber-500" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Registro No Disponible
              </CardTitle>
              <CardDescription className="text-gray-600">
                El registro está temporalmente deshabilitado
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                El administrador ha deshabilitado temporalmente el registro de nuevos usuarios. 
                Esta medida es temporal y el registro será habilitado nuevamente pronto.
              </p>
              <div className="space-y-3">
                <Button 
                  asChild 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
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
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Crear Cuenta de Cliente</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Completa tus datos para registrarte como cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                    placeholder="Juan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+52 555 123 4567"
                />
              </div>

              {/* Rol fijo como CLIENTE - no seleccionable */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Tipo de Usuario</Label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                  Cliente - Registro público solo para clientes
                </div>
                <p className="text-xs text-gray-500">
                  Los administradores y asesores se crean desde el panel de administración
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creando cuenta...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Crear Cuenta
                  </div>
                )}
              </Button>

              <div className="text-center">
                <p className="text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Iniciar Sesión
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
