/**
 * Servicio de White-labeling Dinámico (CSS Variables per Tenant)
 * EscalaFin v3.0.0 - Q4 2026 Milestone
 * 
 * Permite personalizar los colores corporativos, logotipo y variables CSS
 * de la interfaz por cada tenant de forma dinámica en tiempo real.
 */

import { prisma } from './prisma';

export interface TenantThemeConfig {
  tenantId: string;
  brandName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColorHex: string; // Ej: '#003d7a'
  secondaryColorHex: string; // Ej: '#00b4d8'
  accentColorHex?: string;
  presetTheme?: 'ROYAL_NAVY' | 'EMERALD_FINANCE' | 'GOLD_PRESTIGE' | 'CRIMSON_SOVEREIGN' | 'DARK_SAPPHIRE';
}

export const PRESET_THEMES: Record<string, { name: string; primary: string; secondary: string }> = {
  ROYAL_NAVY: { name: 'Royal Navy (Defecto)', primary: '#003d7a', secondary: '#00b4d8' },
  EMERALD_FINANCE: { name: 'Esmeralda Finanzas', primary: '#059669', secondary: '#10b981' },
  GOLD_PRESTIGE: { name: 'Prestigio Dorado', primary: '#b45309', secondary: '#f59e0b' },
  CRIMSON_SOVEREIGN: { name: 'Soberano Carmesí', primary: '#be123c', secondary: '#f43f5e' },
  DARK_SAPPHIRE: { name: 'Zafiro Nocturno', primary: '#4338ca', secondary: '#6366f1' },
};

export const whiteLabelService = {
  /**
   * Convierte un código HEX (#RRGGBB) a formato HSL (H S% L%) para CSS variables
   */
  hexToHsl(hex: string): string {
    let cleaned = hex.replace('#', '');
    if (cleaned.length === 3) {
      cleaned = cleaned.split('').map(c => c + c).join('');
    }

    const r = parseInt(cleaned.substr(0, 2), 16) / 255;
    const g = parseInt(cleaned.substr(2, 2), 16) / 255;
    const b = parseInt(cleaned.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  },

  /**
   * Genera el bloque de código CSS con las variables customizadas del Tenant
   */
  generateCssVariables(config: TenantThemeConfig): string {
    const primaryHsl = this.hexToHsl(config.primaryColorHex);
    const secondaryHsl = this.hexToHsl(config.secondaryColorHex);

    return `
      :root {
        --primary: ${primaryHsl};
        --secondary: ${secondaryHsl};
        --ring: ${primaryHsl};
      }
      .dark {
        --primary: ${primaryHsl};
        --secondary: ${secondaryHsl};
        --ring: ${secondaryHsl};
      }
    `;
  },

  /**
   * Obtiene la configuración de tema de un Tenant
   */
  async getTenantTheme(tenantId: string): Promise<TenantThemeConfig> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    });

    const themeSetting = await prisma.systemConfig.findFirst({
      where: {
        tenantId,
        category: 'THEME_CUSTOMIZATION',
      },
    });

    if (!themeSetting) {
      return {
        tenantId,
        brandName: tenant?.name || 'EscalaFin',
        logoUrl: tenant?.logoUrl || undefined,
        primaryColorHex: PRESET_THEMES.ROYAL_NAVY.primary,
        secondaryColorHex: PRESET_THEMES.ROYAL_NAVY.secondary,
        presetTheme: 'ROYAL_NAVY',
      };
    }

    const parsed = JSON.parse(themeSetting.value);
    return {
      tenantId,
      brandName: tenant?.name || 'EscalaFin',
      logoUrl: tenant?.logoUrl || undefined,
      ...parsed,
    };
  },

  /**
   * Guarda o actualiza la configuración de tema del Tenant
   */
  async saveTenantTheme(tenantId: string, theme: Omit<TenantThemeConfig, 'tenantId' | 'brandName'>): Promise<TenantThemeConfig> {
    const valueStr = JSON.stringify(theme);

    const existing = await prisma.systemConfig.findFirst({
      where: {
        tenantId,
        category: 'THEME_CUSTOMIZATION',
        key: 'theme_settings',
      },
    });

    if (existing) {
      await prisma.systemConfig.update({
        where: { id: existing.id },
        data: { value: valueStr },
      });
    } else {
      await prisma.systemConfig.create({
        data: {
          tenantId,
          category: 'THEME_CUSTOMIZATION',
          key: 'theme_settings',
          value: valueStr,
        },
      });
    }

    return this.getTenantTheme(tenantId);
  },
};

export default whiteLabelService;
