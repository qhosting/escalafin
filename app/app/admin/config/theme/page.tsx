'use client';

/**
 * Página de Personalización de Tema White-labeling (/admin/config/theme)
 * EscalaFin v3.0.0 - UI/UX Pro Max Standard
 */

import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  Check, 
  Save, 
  RefreshCw, 
  CreditCard, 
  Building2,
  CheckCircle2
} from 'lucide-react';
import { PRESET_THEMES, whiteLabelService } from '@/lib/white-label-service';
import ThemeInjector from '@/components/theme-injector';

export default function ThemeCustomizationPage() {
  const [selectedPreset, setSelectedPreset] = useState<string>('ROYAL_NAVY');
  const [primaryHex, setPrimaryHex] = useState<string>('#003d7a');
  const [secondaryHex, setSecondaryHex] = useState<string>('#00b4d8');
  const [brandName, setBrandName] = useState<string>('Financiera Ejemplo');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const applyPreset = (key: string) => {
    setSelectedPreset(key);
    const preset = PRESET_THEMES[key];
    if (preset) {
      setPrimaryHex(preset.primary);
      setSecondaryHex(preset.secondary);
    }
  };

  const currentConfig = {
    tenantId: 'demo_tenant',
    brandName,
    primaryColorHex: primaryHex,
    secondaryColorHex: secondaryHex,
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8">
      {/* Inyector de Variables CSS en Tiempo Real */}
      <ThemeInjector themeConfig={currentConfig} />

      {/* Hero Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Palette className="w-3.5 h-3.5" />
          <span>White-labeling Engine v3.0</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Personalización de Marca y Tema
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Configure los colores corporativos y la identidad de su organización. Las variables CSS se aplicarán dinámicamente a todos los módulos y portales de clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna de Configuración */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Temas Preestablecidos */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2>Temas Preestablecidos</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(PRESET_THEMES).map(([key, preset]) => {
                const isSelected = selectedPreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/30' 
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex -space-x-1.5">
                        <span className="w-5 h-5 rounded-full border border-slate-900" style={{ backgroundColor: preset.primary }} />
                        <span className="w-5 h-5 rounded-full border border-slate-900" style={{ backgroundColor: preset.secondary }} />
                      </div>
                      <span className="text-sm font-medium text-slate-200">{preset.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector Manual de Colores */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-6">
            <h2 className="text-lg font-bold text-white">Ajuste Fino de Colores (HEX)</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Color Primario:
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={primaryHex}
                    onChange={(e) => {
                      setPrimaryHex(e.target.value);
                      setSelectedPreset('');
                    }}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={primaryHex}
                    onChange={(e) => setPrimaryHex(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm uppercase text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Color Secundario:
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={secondaryHex}
                    onChange={(e) => {
                      setSecondaryHex(e.target.value);
                      setSelectedPreset('');
                    }}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={secondaryHex}
                    onChange={(e) => setSecondaryHex(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm uppercase text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Guardar */}
          <div className="flex items-center justify-end space-x-4 pt-2">
            {savedSuccess && (
              <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tema actualizado correctamente</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-md shadow-indigo-600/20"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Guardar Configuración</span>
            </button>
          </div>

        </div>

        {/* Panel de Previsualización en Tiempo Real */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span>Vista Previa en Vivo</span>
          </h2>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
            {/* Header Tarjeta */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: primaryHex }}
                >
                  EF
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{brandName}</h3>
                  <p className="text-[11px] text-slate-400">Portal del Acreditado</p>
                </div>
              </div>
            </div>

            {/* Simulación de Préstamo Activo */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Préstamo Personal</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: secondaryHex }}
                >
                  ACTIVO
                </span>
              </div>
              <p className="text-2xl font-extrabold font-mono text-white">$15,000.00 MXN</p>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="h-full rounded-full w-3/4" style={{ backgroundColor: primaryHex }} />
              </div>
            </div>

            {/* Botón de Acción Simulado */}
            <button
              type="button"
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-[0.98]"
              style={{ backgroundColor: primaryHex }}
            >
              Realizar Abono en Línea
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
