
'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, Eye, EyeOff, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5 px-4 py-12 relative">
      {/* Botón volver al inicio */}
      <Link 
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-700 hover:text-primary transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Volver al inicio</span>
      </Link>

      {/* Formulario de Login */}
      <div className="w-full max-w-md">
        {/* Card con fondo */}
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
              Iniciar Sesión
            </h1>
            <p className="text-gray-600 text-sm">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo de Email */}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                placeholder="tu@email.com"
              />
            </div>
            
            {/* Campo de Contraseña */}
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
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="••••••••"
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

            {/* Mensaje de Error */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Botón de Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3.5 px-4 rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verificando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </div>
              )}
            </button>

            {/* Link de Registro */}
            <div className="text-center pt-2">
              <p className="text-gray-600 text-sm">
                ¿No tienes cuenta?{' '}
                <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Registrarse
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Texto adicional debajo del formulario */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Sistema de Gestión de Préstamos y Créditos
        </p>
      </div>
    </div>
  );
}
