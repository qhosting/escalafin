'use client';

/**
 * Componente ThemeInjector
 * EscalaFin v3.0.0 - White-labeling Engine
 * 
 * Inyecta dinámicamente las variables CSS customizadas del Tenant en el elemento <style>
 */

import React, { useEffect } from 'react';
import { whiteLabelService, TenantThemeConfig } from '@/lib/white-label-service';

interface ThemeInjectorProps {
  themeConfig?: TenantThemeConfig;
}

export const ThemeInjector: React.FC<ThemeInjectorProps> = ({ themeConfig }) => {
  useEffect(() => {
    if (!themeConfig) return;

    const cssContent = whiteLabelService.generateCssVariables(themeConfig);
    let styleTag = document.getElementById('tenant-dynamic-theme');

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'tenant-dynamic-theme';
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = cssContent;
  }, [themeConfig]);

  return null;
};

export default ThemeInjector;
