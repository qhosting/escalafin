'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserCheck, LogOut, Loader2, ShieldAlert } from 'lucide-react';
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
      // 1. Registrar fin de auditoría en servidor
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stopImpersonate' }),
      }).catch(() => null);

      let targetRedirect = '/admin/users';
      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.redirectUrl) targetRedirect = data.redirectUrl;
      }

      // 2. Restaurar sesión raíz de SuperAdmin en NextAuth
      await update({ action: 'stopImpersonate' });
      toast.success('Has regresado a tu cuenta de SuperAdmin');
      
      // 3. Redirigir de forma limpia
      window.location.href = targetRedirect;
    } catch (error) {
      console.error('Error al salir de intrapersona:', error);
      toast.error('Error al restaurar sesión');
      setLoading(false);
    }
  };

  return (
    <aside aria-label="Aviso de modo intrapersona" className="sticky top-0 z-[99999] bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-3 py-2 shadow-xl border-b border-amber-400/40 flex items-center justify-between text-xs animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="h-7 w-7 rounded-lg bg-black/20 flex items-center justify-center shrink-0 border border-white/20">
          <UserCheck className="h-4 w-4 text-white animate-pulse" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 font-black tracking-tight">
            <span className="truncate">Modo Intrapersona Activo</span>
            <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded font-mono uppercase text-amber-200 border border-white/10">
              {session?.user?.role}
            </span>
            {originalUser?.name && (
              <span className="hidden md:inline text-[10px] text-amber-200/90 font-normal">
                (SuperAdmin: {originalUser.name})
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-100/90 truncate font-medium">
            {session?.user?.name} {session?.user?.tenantName ? `• ${session.user.tenantName}` : ''} ({session?.user?.email})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={handleStopImpersonation}
          className="h-7 px-3 bg-black/30 hover:bg-black/50 text-white border-white/30 hover:border-white/60 text-xs font-bold rounded-lg shrink-0 gap-1.5 transition-all shadow-sm active:scale-95"
          title="Restaurar tu cuenta de SuperAdmin"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          <span>Salir de Intrapersona</span>
        </Button>
      </div>
    </aside>
  );
}
