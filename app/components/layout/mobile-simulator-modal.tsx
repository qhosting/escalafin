'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Smartphone,
  RotateCw,
  X,
  ExternalLink,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Monitor,
  Check,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useMobileSimulator, DEVICE_SPECS, SimulatedDevice } from '@/hooks/use-mobile-simulator';
import { cn } from '@/lib/utils';

export function MobileSimulatorModal() {
  const {
    isOpen,
    device,
    isLandscape,
    zoom,
    close,
    setDevice,
    toggleOrientation,
    setZoom
  } = useMobileSimulator();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [currentTime, setCurrentTime] = useState('09:41');

  // Reloj de la barra de estado del teléfono
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Atajo de teclado: Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const currentSpecs = DEVICE_SPECS[device];
  const width = isLandscape ? currentSpecs.height : currentSpecs.width;
  const height = isLandscape ? currentSpecs.width : currentSpecs.height;

  // URL a cargar dentro del iframe
  const targetUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(targetUrl, '_blank', `width=${width},height=${height}`);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
      {/* ─── BARRA DE CONTROL SUPERIOR ─────────────────────────────────────── */}
      <header className="h-14 bg-slate-900/90 border-b border-white/10 px-4 md:px-6 flex items-center justify-between shrink-0 select-none">
        {/* Lado Izquierdo: Info y Dispositivo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  Simulador Móvil
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-0">
                  Touch Mode
                </Badge>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                {width} × {height} px • Escala {Math.round(zoom * 100)}%
              </p>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Selector de Dispositivo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 gap-1.5 bg-slate-800/80 border-white/10 hover:bg-slate-700 text-slate-200 text-xs rounded-lg"
              >
                <span className="font-semibold">{currentSpecs.name}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-slate-200">
              <DropdownMenuLabel className="text-[11px] text-slate-400">
                Seleccionar Dispositivo
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {(Object.keys(DEVICE_SPECS) as SimulatedDevice[]).map((key) => {
                const spec = DEVICE_SPECS[key];
                const isSelected = device === key;
                return (
                  <DropdownMenuItem
                    key={key}
                    className="flex items-center justify-between text-xs cursor-pointer focus:bg-slate-800 focus:text-white"
                    onClick={() => setDevice(key)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{spec.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {spec.width} × {spec.height} px
                      </span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-2" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Lado Central/Derecho: Controles de vista */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Rotar Orientación */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2.5 gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs",
              isLandscape && "bg-primary/20 text-primary hover:bg-primary/30"
            )}
            onClick={toggleOrientation}
            title={isLandscape ? "Cambiar a modo Vertical" : "Cambiar a modo Horizontal"}
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span className="hidden md:inline">
              {isLandscape ? 'Horizontal' : 'Vertical'}
            </span>
          </Button>

          {/* Selector de Zoom */}
          <div className="hidden sm:flex items-center bg-slate-800/80 rounded-lg border border-white/10 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-white rounded"
              onClick={() => setZoom(Math.max(0.7, Number((zoom - 0.1).toFixed(1))))}
              title="Reducir Zoom"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] font-mono text-slate-300 px-2 min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-white rounded"
              onClick={() => setZoom(Math.min(1.1, Number((zoom + 0.1).toFixed(1))))}
              title="Aumentar Zoom"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Recargar Iframe */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            onClick={handleRefresh}
            title="Recargar vista móvil"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          {/* Abrir en ventana externa */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hidden sm:flex"
            onClick={handleOpenExternal}
            title="Abrir en ventana emergente móvil"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          {/* Cerrar y Volver a Escritorio */}
          <Button
            variant="default"
            size="sm"
            className="h-8 px-3 gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-md"
            onClick={close}
            title="Cerrar simulador (Esc)"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Volver a Escritorio</span>
          </Button>
        </div>
      </header>

      {/* ─── ÁREA DE DISPOSITIVO MÓVIL ─────────────────────────────────────── */}
      <main className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8">
        <div
          className="transition-all duration-300 ease-out origin-center"
          style={{
            transform: `scale(${zoom})`,
          }}
        >
          {/* Chasis Exterior del Smartphone */}
          <div
            className={cn(
              "relative bg-slate-900 border-[8px] border-slate-800 shadow-[0_25px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)]",
              isLandscape ? "rounded-[42px]" : "rounded-[52px]",
              "flex flex-col overflow-hidden"
            )}
            style={{
              width: `${width + 16}px`,
              height: `${height + 16}px`,
            }}
          >
            {/* Marco de Pantalla Interior */}
            <div className="relative flex-1 bg-black flex flex-col overflow-hidden rounded-[40px]">
              {/* Barra de Estado Móvil Superior (Hora, Dynamic Island / Notch, Batería) */}
              <div className="h-9 w-full bg-slate-950 text-white flex items-center justify-between px-6 select-none shrink-0 z-20">
                <span className="text-[12px] font-semibold tracking-tight">
                  {currentTime}
                </span>

                {/* Dynamic Island / Notch */}
                {currentSpecs.frameType === 'dynamic-island' && (
                  <div className="h-4 w-28 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 border border-white/5">
                    <div className="h-2 w-2 rounded-full bg-[#0a1128] border border-blue-500/30" />
                  </div>
                )}
                {currentSpecs.frameType === 'punch-hole' && (
                  <div className="h-3 w-3 rounded-full bg-black border border-white/10" />
                )}
                {currentSpecs.frameType === 'notch' && (
                  <div className="h-3.5 w-32 bg-slate-900 rounded-b-xl" />
                )}

                {/* Iconos de Estado (WiFi, Batería) */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="font-semibold text-[10px]">5G</span>
                  <div className="h-2.5 w-5 border border-white/80 rounded-xs p-0.5 flex items-center">
                    <div className="h-full w-full bg-emerald-400 rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Iframe con la Aplicación */}
              <div className="flex-1 relative w-full h-full bg-white dark:bg-gray-950 overflow-hidden">
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={targetUrl}
                  title="Vista Móvil EscalaFin"
                  className="w-full h-full border-0"
                  style={{
                    width: `${width}px`,
                    height: `${height - 56}px`, // Descontando status bar y home indicator
                  }}
                />
              </div>

              {/* Barra Inferior Home Indicator (Estilo iOS / Android) */}
              <div className="h-5 w-full bg-slate-950 flex items-center justify-center shrink-0 z-20">
                <div className="h-1 w-32 bg-white/40 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
