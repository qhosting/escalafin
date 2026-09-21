'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserCheck, LogOut, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function IntrapersonaBanner() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);

  const isImpersonating = !!(session?.user as any)?.isImpersonating;
  const originalUser = (session?.user as any)?.originalUser;

  if (!isImpersonating) return null;

  const handleStopImpersonation = async () => {
    try {
      setLoading(true);
      // Registrar auditoría
      await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stopImpersonate' }),
      }).catch(() => {});

      // Restaurar sesión de SuperAdmin en NextAuth
      await update({ action: 'stopImpersonate' });
      toast.success('Has regresado a tu cuenta de SuperAdmin');
      window.location.reload();
    } catch (error) {
      console.error('Error al salir de intrapersona:', error);
      toast.error('Error al restaurar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-3 py-2 shadow-lg border-b border-amber-400/30 flex items-center justify-between text-xs animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <UserCheck className="h-3.5 w-3.5 text-white animate-pulse" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 font-bold tracking-tight">
            <span className="truncate">Modo Intrapersona</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded text-amber-100 font-mono uppercase">
              {session?.user?.role}
            </span>
          </div>
          <p className="text-[11px] text-amber-100/90 truncate">
            {session?.user?.name} {session?.user?.tenantName ? `• ${session.user.tenantName}` : ''}
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={handleStopImpersonation}
        className="h-7 px-2.5 bg-black/30 hover:bg-black/50 text-white border-white/20 hover:border-white/40 text-[11px] font-bold rounded-lg shrink-0 gap-1 transition-all"
        title="Restaurar tu cuenta de SuperAdmin"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <LogOut className="h-3 w-3" />
        )}
        <span>Salir</span>
      </Button>
    </div>
  );
}
