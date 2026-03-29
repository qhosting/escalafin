
'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, ArrowRight, Loader2, KeyRound, MessageSquareCode,
  Mail, Phone, CheckCircle2, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type LoginMode = 'password' | 'otp';
type OtpStep  = 'idle' | 'sent' | 'verified';

export function LoginForm() {
  const [identifier, setIdentifier]     = useState('');
  const [password, setPassword]         = useState('');
  const [otpCode, setOtpCode]           = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode]                 = useState<LoginMode>('password');
  const [otpStep, setOtpStep]           = useState<OtpStep>('idle');
  const [loading, setLoading]           = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [error, setError]               = useState('');
  const [mounted, setMounted]           = useState(false);
  const [tenantInfo, setTenantInfo]     = useState<{
    name: string; slug: string; primaryColor: string | null;
  } | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpDigits, setOtpDigits]       = useState(['', '', '', '', '', '']);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  // Countdown for OTP resend
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  // Tenant info
  useEffect(() => {
    const hostname = window.location.hostname;
    const parts    = hostname.split('.');
    let slug = '';
    if (hostname.includes('localhost')) {
      if (parts.length > 1) slug = parts[0];
    } else {
      if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'app') slug = parts[0];
    }
    if (slug) {
      fetch(`/api/public/tenant/${slug}`)
        .then(r => r.json())
        .then(data => {
          if (data.name) setTenantInfo({ name: data.name, slug: data.slug, primaryColor: data.primaryColor });
        })
        .catch(() => {});
    }
  }, []);

  // OTP digit handlers
  const handleOtpDigit = (idx: number, val: string) => {
    const v = val.replace(/\D/, '').slice(0, 1);
    const next = [...otpDigits];
    next[idx] = v;
    setOtpDigits(next);
    setOtpCode(next.join(''));
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtpDigits(next);
    setOtpCode(next.join(''));
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const sendOtp = async () => {
    if (!identifier) { toast.error('Ingresa tu correo o celular primero'); return; }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Código enviado a tu WhatsApp / Email');
        setOtpStep('sent');
        setOtpCountdown(60);
        setOtpDigits(['', '', '', '', '', '']);
        setOtpCode('');
        setTimeout(() => otpRefs.current[0]?.focus(), 300);
      } else {
        toast.error(data.error || 'Error al enviar código');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const credential = mode === 'otp' ? otpCode : password;

    if (mode === 'otp' && otpCode.length < 6) {
      setError('Ingresa el código completo de 6 dígitos');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email: identifier,
        password: credential,
        tenantSlug: tenantInfo?.slug || '',
        redirect: false,
      });

      if (result?.error) {
        setError(mode === 'otp' ? 'Código inválido o expirado' : 'Correo o contraseña incorrectos');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        const session = await getSession();
        if (!session) { setError('Error al crear la sesión.'); setLoading(false); return; }
        switch (session.user.role) {
          case 'SUPER_ADMIN': router.replace('/admin/saas');        break;
          case 'ADMIN':       router.replace('/admin/dashboard');   break;
          case 'ASESOR':      router.replace('/asesor/dashboard');  break;
          case 'CLIENTE':     router.replace('/cliente/dashboard'); break;
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

  const isEmail = identifier.includes('@');
  const IdentifierIcon = isEmail ? Mail : Phone;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#080a0f]">

      {/* ── Ambient Background ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-blue-700/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-indigo-900/10 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] left-[25%] w-[50%] h-[50%] bg-sky-600/5 rounded-full blur-[120px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">

        {/* ── Brand Mark ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-900/40 mb-4">
            <KeyRound className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {tenantInfo?.name?.toUpperCase() || 'ESCALAFIN'}
          </h1>
          <p className="text-sm text-white/40 mt-1 font-medium">Bienvenido de nuevo</p>
        </div>

        {/* ── Card ── */}
        <div className="backdrop-blur-2xl bg-white/[0.035] border border-white/[0.07] rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">

          {/* Mode Toggle */}
          <div className="flex border-b border-white/[0.06]">
            <button
              type="button"
              onClick={() => { setMode('password'); setError(''); }}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === 'password'
                  ? 'text-white bg-blue-600/15 border-b-2 border-blue-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <KeyRound size={13} />
              Contraseña
            </button>
            <button
              type="button"
              onClick={() => { setMode('otp'); setOtpStep('idle'); setError(''); }}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === 'otp'
                  ? 'text-white bg-blue-600/15 border-b-2 border-blue-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <MessageSquareCode size={13} />
              Código OTP
            </button>
          </div>

          {/* Form Body */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Identifier Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">
                  Correo o Celular
                </label>
                <div className="relative">
                  <IdentifierIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="ejemplo@correo.com o celular"
                    autoComplete="username"
                    className="w-full h-13 pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-800/80 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all duration-200 text-sm"
                    required
                  />
                </div>
              </div>

              {/* ── PASSWORD MODE ── */}
              {mode === 'password' && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Contraseña
                      </label>
                      <Link href="/auth/forgot-password"
                        className="text-[10px] font-bold text-blue-500/80 hover:text-blue-400 transition-colors">
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        autoComplete="current-password"
                        className="w-full h-13 px-4 py-4 bg-slate-900/50 border border-slate-800/80 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all duration-200 text-sm pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors p-1"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 px-1">
                    También puedes{' '}
                    <button type="button" onClick={() => setMode('otp')}
                      className="text-blue-500/80 hover:text-blue-400 font-bold transition-colors">
                      iniciar con código OTP
                    </button>
                    {' '}sin contraseña
                  </p>
                </>
              )}

              {/* ── OTP MODE ── */}
              {mode === 'otp' && (
                <div className="space-y-5">
                  {otpStep === 'idle' && (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={loading || !identifier}
                      className="w-full h-12 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <MessageSquareCode size={16} />}
                      Enviar código a WhatsApp / Email
                    </button>
                  )}

                  {otpStep === 'sent' && (
                    <div className="space-y-4">
                      <div className="text-center space-y-1">
                        <p className="text-xs text-slate-400">Código enviado a</p>
                        <p className="text-sm font-bold text-white">{identifier}</p>
                      </div>

                      {/* OTP Digit Inputs */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">
                          Código de 6 dígitos
                        </label>
                        <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={el => { otpRefs.current[idx] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={e => handleOtpDigit(idx, e.target.value)}
                              onKeyDown={e => handleOtpKeyDown(idx, e)}
                              className={`w-11 h-13 text-center text-xl font-black rounded-xl border transition-all duration-200 bg-slate-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:scale-105 ${
                                digit ? 'border-blue-500/50 bg-blue-900/20' : 'border-slate-800/80'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Resend */}
                      <div className="text-center">
                        {otpCountdown > 0 ? (
                          <p className="text-xs text-slate-600">
                            Reenviar en <span className="text-blue-500 font-bold">{otpCountdown}s</span>
                          </p>
                        ) : (
                          <button type="button" onClick={sendOtp} disabled={loading}
                            className="text-xs text-slate-500 hover:text-blue-400 font-bold transition-colors flex items-center gap-1 mx-auto">
                            <RefreshCw size={11} /> Reenviar código
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Submit */}
              {(mode === 'password' || (mode === 'otp' && otpStep === 'sent')) && (
                <button
                  type="submit"
                  disabled={loading || (mode === 'otp' && otpCode.length < 6)}
                  className="w-full h-13 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:from-slate-700 disabled:to-slate-700 text-white font-black rounded-xl shadow-lg shadow-blue-950/50 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      <span>{mode === 'otp' ? 'Verificar y Acceder' : 'Iniciar Sesión'}</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-0 text-center">
            <p className="text-sm text-slate-500">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register"
                className="text-white font-bold hover:text-blue-400 transition-colors">
                Regístrate
              </Link>
            </p>
          </div>
        </div>

        {/* Back */}
        <div className="text-center mt-6">
          <Link href="/"
            className="text-[10px] font-black text-slate-700 hover:text-slate-400 uppercase tracking-[0.4em] transition-all">
            ← Volver al Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
