
'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, Eye, EyeOff, Building2, TrendingUp, Shield, Users, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';



export function LoginForm() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [mounted, setMounted]           = useState(false);
  const [tenantInfo, setTenantInfo]     = useState<{
    name: string; slug: string; logo: string | null; primaryColor: string | null;
  } | null>(null);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const hostname = window.location.hostname;
    const parts    = hostname.split('.');
    let slug = '';

    if (hostname.includes('localhost')) {
      if (parts.length > 1) slug = parts[0];
    } else {
      if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'app') {
        slug = parts[0];
      }
    }

    if (slug) {
      fetch(`/api/public/tenant/${slug}`)
        .then(r => r.json())
        .then(data => {
          if (data.name) setTenantInfo({ name: data.name, slug: data.slug, logo: data.logo, primaryColor: data.primaryColor });
        })
        .catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        tenantSlug: tenantInfo?.slug || '',
        redirect: false,
      });

      if (result?.error) {
        setError('Correo o contraseña incorrectos');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        const session = await getSession();
        if (!session) {
          setError('Error al crear la sesión. Intenta de nuevo.');
          setLoading(false);
          return;
        }

        switch (session.user.role) {
          case 'SUPER_ADMIN': router.replace('/admin/saas');       break;
          case 'ADMIN':       router.replace('/admin/dashboard');  break;
          case 'ASESOR':      router.replace('/asesor/dashboard'); break;
          case 'CLIENTE':     router.replace('/cliente/dashboard');break;
          default:            router.replace('/');
        }
      } else {
        setError('Error inesperado. Intenta de nuevo.');
        setLoading(false);
      }
    } catch {
      setError('Error de conexión. Verifica tu red.');
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const accentColor = tenantInfo?.primaryColor || '#4f46e5';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200/50">
      
      {/* ── Brand Header ── */}
      <div className="flex flex-col items-center gap-4 mb-8 text-center">
        {tenantInfo?.logo ? (
          <div className="relative h-16 w-48 mb-2">
            <Image src={tenantInfo.logo} alt={tenantInfo.name} fill className="object-contain drop-shadow-sm" />
          </div>
        ) : (
          <div className="p-3 rounded-2xl shadow-sm" style={{ backgroundColor: `${accentColor}15` }}>
            <Building2 className="h-10 w-10" style={{ color: accentColor }} />
          </div>
        )}
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {tenantInfo?.name || 'EscalaFin'}
        </h1>
      </div>

      {/* ── Login Card ── */}
      <div className="w-full max-w-[400px] space-y-6">
          {/* Header */}
          <div className="text-center space-y-1 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Bienvenido de vuelta</h2>
            <p className="text-sm text-gray-500">Ingresa tus credenciales para acceder</p>
          </div>

          {/* Form card */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-xl shadow-black/5 p-8 space-y-5">

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="tu@empresa.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm
                             placeholder:text-gray-400 focus:outline-none focus:ring-2
                             transition-all duration-200"
                  style={{ '--tw-ring-color': `${accentColor}50` } as React.CSSProperties}
                  onFocus={e => { e.target.style.borderColor = accentColor; e.target.style.background = '#fff'; }}
                  onBlur={e =>  { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm
                               placeholder:text-gray-400 focus:outline-none transition-all duration-200"
                    onFocus={e => { e.target.style.borderColor = accentColor; e.target.style.background = '#fff'; }}
                    onBlur={e =>  { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye     className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 text-white text-sm font-semibold rounded-xl
                           shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40
                           focus:outline-none focus:ring-2 focus:ring-offset-2
                           disabled:opacity-60 disabled:cursor-not-allowed
                           transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: accentColor }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verificando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Iniciar Sesión
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">o</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Links */}
            <div className="text-center space-y-2 text-sm text-gray-500">
              <p>
                ¿Eres cliente?{' '}
                <Link href="/auth/register"
                      className="font-semibold transition-colors"
                      style={{ color: accentColor }}>
                  Crear cuenta personal
                </Link>
              </p>
              <p>
                ¿Nueva financiera?{' '}
                <Link href="/auth/register-tenant"
                      className="font-semibold underline underline-offset-2 transition-colors"
                      style={{ color: accentColor }}>
                  Registrar empresa
                </Link>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase font-medium tracking-wider">
              Volver al sitio público
            </Link>
          </div>
        </div>

    </div>
  );
}
