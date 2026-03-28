
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

  const accentColor = tenantInfo?.primaryColor || '#7c3aed';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0a0c]">
      {/* ── Space Background Effects ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        {/* ── Glassmorphism Card ── */}
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[40px] shadow-2xl p-8 lg:p-12 space-y-8 overflow-hidden relative group transition-all duration-500 hover:border-white/20">
          
          {/* subtle inside glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-all duration-500" />

          {/* ── Brand ── */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-white tracking-[0.2em] mb-1 italic">
              {tenantInfo?.name?.toUpperCase() || 'ESCALAFIN'}
            </h1>
            <p className="text-lg font-medium text-white/70 tracking-tight">
              Welcome Back
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest px-1">
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest px-1">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors p-2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-start px-1">
              <button type="button" className="text-xs font-bold text-white/40 hover:text-white/80 transition-colors tracking-tight">
                Forget Password ?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs px-4 py-3 rounded-xl animate-shake">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center justify-center gap-3">
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <span className="text-lg">Login</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* ── Footer ── */}
          <div className="text-center pt-4">
            <p className="text-sm text-white/40 font-medium">
              Are You New Member?{' '}
              <Link href="/auth/register" className="text-white font-bold hover:underline underline-offset-4 decoration-purple-500 decoration-2 transition-all">
                Sign UP
              </Link>
            </p>
          </div>
        </div>

        {/* ── Back Link ── */}
        <div className="text-center mt-8">
          <Link href="/" className="text-xs font-black text-white/20 hover:text-white/60 uppercase tracking-[0.3em] transition-all">
            Back to portal
          </Link>
        </div>
      </div>
    </div>
  );
}
