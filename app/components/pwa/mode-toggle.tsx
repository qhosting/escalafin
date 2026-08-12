'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export function ModeToggle() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const switchToDesktop = () => {
    document.cookie = 'escalafin-view-mode=desktop; max-age=2592000; path=/';
    toast.success('Cambiando a versión completa...');
    router.push('/admin/dashboard');
  };

  const switchToMobile = () => {
    document.cookie = 'escalafin-view-mode=pwa; max-age=2592000; path=/';
    toast.success('Cambiando a versión móvil...');
    router.push('/pwa');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
      <button
        onClick={switchToDesktop}
        className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg border border-white/10 hover:bg-slate-800 active:scale-95 transition-all"
        title="Ver versión completa de escritorio"
      >
        <Monitor className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Vista Completa</span>
      </button>
    </div>
  );
}

export function DesktopModeToggle() {
  const router = useRouter();

  const switchToMobile = () => {
    document.cookie = 'escalafin-view-mode=pwa; max-age=2592000; path=/';
    toast.success('Cambiando a vista móvil...');
    router.push('/pwa');
  };

  return (
    <button
      onClick={switchToMobile}
      className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
      title="Ver en versión móvil PWA"
    >
      <Smartphone className="h-3.5 w-3.5" />
      Versión Móvil
    </button>
  );
}
