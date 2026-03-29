
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Key, Smartphone, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordContent() {
  const [step, setStep] = useState(1); // 1: Identifier, 2: OTP + New Password
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Código enviado');
        setStep(2);
      } else {
        toast.error(data.error || 'Error al enviar código');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Contraseña restablecida con éxito');
        window.location.href = '/auth/login';
      } else {
        toast.error(data.error || 'Código inválido o expirado');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
      <div className="w-full max-w-[440px] space-y-8 backdrop-blur-3xl bg-white/[0.03] border border-white/5 rounded-[40px] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
        
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <Key className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h1 className="text-3xl font-black text-white tracking-tight italic">
            RECUPERAR ACCESO
          </h1>
          <p className="text-sm text-white/50">
            {step === 1 
              ? 'Ingresa tu correo o número de celular para recibir un código de acceso.' 
              : 'Ingresa el código que recibiste y tu nueva contraseña.'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                Correo o Celular
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ejemplo@correo.com o celular"
                  className="w-full h-14 px-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Enviar Código'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndReset} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                  Código de 6 dígitos
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  className="w-full h-14 px-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-white text-center text-2xl font-bold tracking-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-14 px-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Restablecer Contraseña'}
            </Button>

            <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
                <ArrowLeft size={12} /> Probé otro método o me equivoqué
            </button>
          </form>
        )}

        <div className="text-center pt-4">
          <Link href="/auth/login" className="text-sm font-bold text-white/70 hover:text-white transition-all flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
