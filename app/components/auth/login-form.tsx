
'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Building2, LogIn, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function LoginForm() {
  const [email, setEmail] = useState('admin@escalafin.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔄 Iniciando login con:', { email });

    try {
      console.log('Attempting login with email:', email);
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('📊 Resultado de signIn:', result);

      if (result?.error) {
        console.error('❌ Error de login:', result.error);
        setError('Credenciales incorrectas');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        console.log('✅ Login exitoso, obteniendo sesión...');
        
        // Verificar que la sesión se creó correctamente
        const session = await getSession();
        console.log('📊 Sesión obtenida:', session);
        
        if (!session) {
          console.error('❌ No se pudo obtener la sesión');
          setError('Error al crear sesión');
          setLoading(false);
          return;
        }
        
        // Redirigir según el rol
        let redirectUrl = '/';
        
        if (session?.user?.role === 'ADMIN') {
          redirectUrl = '/admin/dashboard';
          console.log('🔄 Redirigiendo a admin dashboard...');
        } else if (session?.user?.role === 'ASESOR') {
          redirectUrl = '/asesor/dashboard';
          console.log('🔄 Redirigiendo a asesor dashboard...');
        } else if (session?.user?.role === 'CLIENTE') {
          redirectUrl = '/cliente/dashboard';
          console.log('🔄 Redirigiendo a cliente dashboard...');
        } else {
          console.log('🔄 Redirigiendo a dashboard genérico...');
        }
        
        // Usar router.replace en lugar de router.push para evitar volver atrás
        window.location.href = redirectUrl;
        return;
      } else {
        console.log('⚠️ Login sin error pero no ok:', result);
        setError('Error inesperado en el login');
        setLoading(false);
      }
    } catch (err) {
      console.error('💥 Excepción durante el login:', err);
      setError('Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero Section - Brand Colors */}
      <div className="lg:flex-1 bg-gradient-to-br from-primary via-primary/90 to-secondary flex flex-col justify-center px-8 lg:px-12 py-12">
        <div className="max-w-md mx-auto text-white">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 inline-block">
            <div className="relative h-16 w-64">
              <Image 
                src="/logoescalafin.png" 
                alt="EscalaFin Logo" 
                fill
                className="object-contain brightness-0 invert"
                priority
              />
            </div>
          </div>
          <h2 className="text-2xl font-semibold mb-4">
            Sistema de Gestión de Préstamos y Créditos
          </h2>
          <p className="text-white/90 text-lg leading-relaxed">
            Plataforma integral para administrar tu cartera de clientes, procesar solicitudes de crédito 
            y gestionar préstamos de manera eficiente y segura.
          </p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              <span className="text-white/90">Gestión completa de clientes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              <span className="text-white/90">Workflow de solicitudes automatizado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              <span className="text-white/90">Tablas de amortización dinámicas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="lg:flex-1 flex items-center justify-center px-8 py-12 bg-gray-50 relative">
        {/* Botón volver */}
        <Link 
          href="/"
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Volver al inicio</span>
        </Link>

        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border-0 p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative h-12 w-56">
                <Image 
                  src="/logoescalafin.png" 
                  alt="EscalaFin Logo" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">Iniciar Sesión</h2>
            <p className="text-muted-foreground">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Verificando...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </div>
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-600">
                ¿No tienes cuenta?{' '}
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Registrarse
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
