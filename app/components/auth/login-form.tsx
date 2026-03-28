
'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, Eye, EyeOff, Building2, TrendingUp, Shield, Users, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
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

  // Blue theme colors
  const accentColor = tenantInfo?.primaryColor || '#2563eb'; // blue-600

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0c10]">
      {/* ── Blue/Gray/Black Background Effects ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-slate-700/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        {/* ── Glassmorphism Card ── */}
        <div className="backdrop-blur-3xl bg-white/[0.03] border border-white/5 rounded-[40px] shadow-2xl p-8 lg:p-12 space-y-8 overflow-hidden relative group transition-all duration-500 hover:border-white/10">
          
          {/* subtle inside glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-all duration-500" />

          {/* ── Brand ── */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-white tracking-[0.2em] mb-1 italic">
              {tenantInfo?.name?.toUpperCase() || 'ESCALAFIN'}
            </h1>
            <p className="text-lg font-medium text-white/50 tracking-tight">
              Bienvenido de nuevo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full h-14 px-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                Contraseña
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-14 px-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors p-2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-start px-1">
              <button type="button" className="text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors tracking-tight">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-4 py-3 rounded-xl animate-shake">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-blue-950/40 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center justify-center gap-3">
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <span className="text-lg">Iniciar Sesión</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* ── Footer ── */}
          <div className="text-center pt-2">
            <p className="text-sm text-slate-500 font-medium">
              ¿Aún no eres miembro?{' '}
              <Link href="/auth/register" className="text-white font-black hover:text-blue-400 decoration-blue-500/30 hover:underline underline-offset-4 transition-all">
                Regístrate
              </Link>
            </p>
          </div>
        </div>

        {/* ── Back Link ── */}
        <div className="text-center mt-8">
          <Link href="/" className="text-[10px] font-black text-slate-700 hover:text-slate-500 uppercase tracking-[0.4em] transition-all">
            Volver al Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
