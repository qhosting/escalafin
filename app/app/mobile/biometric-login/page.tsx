'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Fingerprint, Loader2, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * /mobile/biometric-login
 * Biometric authentication page for native Capacitor app.
 * Falls back to standard session check if biometric is unavailable.
 * Uses @capacitor-community/biometric-auth when available (native only).
 */
export default function BiometricLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [biometricState, setBiometricState] = useState<'idle' | 'checking' | 'success' | 'error' | 'unavailable'>('idle');
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Detect if running inside Capacitor native shell
    const runningInCapacitor = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();
    setIsCapacitor(runningInCapacitor);

    if (!runningInCapacitor) {
      setBiometricState('unavailable');
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session?.user) {
      // If session already exists, proceed to the right dashboard
      redirectToDashboard();
    }
  }, [status, session]);

  const redirectToDashboard = () => {
    const role = session?.user?.role;
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') router.push('/mobile/dashboard');
    else if (role === 'ASESOR') router.push('/pwa/asesor');
    else router.push('/pwa/client');
  };

  const triggerBiometric = async () => {
    if (!isCapacitor) {
      toast.info('Biometría solo disponible en la app nativa Android/iOS');
      return;
    }

    setBiometricState('checking');
    try {
      // Dynamically check and use Capacitor Plugins bridge — no static import needed
      const cap = (window as any).Capacitor;
      const BiometricAuth = cap?.Plugins?.BiometricAuth;

      if (!BiometricAuth) {
        setBiometricState('unavailable');
        toast.error('Biometría no disponible en este dispositivo');
        return;
      }

      const checkResult = await BiometricAuth.checkBiometry();

      if (!checkResult.isAvailable) {
        setBiometricState('unavailable');
        toast.error('Biometría no disponible en este dispositivo');
        return;
      }

      await BiometricAuth.authenticate({
        reason: 'Confirma tu identidad para acceder a EscalaFin',
        cancelTitle: 'Cancelar',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Usar contraseña',
      });

      setBiometricState('success');
      toast.success('¡Identidad verificada!');
      setTimeout(redirectToDashboard, 1000);
    } catch (error: any) {
      setBiometricState('error');
      toast.error('Autenticación biométrica fallida');
      setTimeout(() => setBiometricState('idle'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center px-6 safe-area-top safe-area-bottom">
      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-blue-600/40">
          <Shield className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">EscalaFin</h1>
        <p className="text-blue-300 text-sm mt-2">Sistema Financiero Seguro</p>
      </div>

      {/* Biometric Card */}
      <Card className="w-full max-w-sm rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <CardContent className="p-8 flex flex-col items-center gap-5">
          {biometricState === 'success' ? (
            <>
              <CheckCircle2 className="h-20 w-20 text-emerald-400" />
              <p className="text-white font-bold text-lg">¡Acceso Concedido!</p>
              <p className="text-white/60 text-sm">Redirigiendo...</p>
            </>
          ) : biometricState === 'error' ? (
            <>
              <XCircle className="h-20 w-20 text-red-400" />
              <p className="text-white font-bold text-lg">Verificación fallida</p>
              <p className="text-white/60 text-sm">Intenta de nuevo</p>
            </>
          ) : biometricState === 'checking' ? (
            <>
              <Loader2 className="h-20 w-20 text-blue-400 animate-spin" />
              <p className="text-white font-bold text-lg">Verificando...</p>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-white/80 text-sm mb-2">Bienvenido de vuelta,</p>
                <p className="text-white font-black text-xl">{session?.user?.name?.split(' ')[0] || 'Usuario'}</p>
              </div>

              <button
                onClick={triggerBiometric}
                disabled={biometricState === 'unavailable'}
                className={`w-28 h-28 rounded-full flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                  biometricState === 'unavailable'
                    ? 'bg-white/10 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/40 cursor-pointer'
                }`}
              >
                <Fingerprint className="h-14 w-14 text-white" />
              </button>

              {biometricState === 'unavailable' ? (
                <p className="text-white/40 text-xs text-center">
                  Biometría no disponible.<br />Usa la app nativa Android/iOS.
                </p>
              ) : (
                <p className="text-white/60 text-xs text-center">
                  Toca el ícono para autenticar<br />con huella digital o FaceID
                </p>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={redirectToDashboard}
                className="text-white/40 hover:text-white/70 text-xs"
              >
                Continuar sin biometría →
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-white/20 text-[10px] mt-8">EscalaFin · Protegido por cifrado AES-256</p>
    </div>
  );
}
