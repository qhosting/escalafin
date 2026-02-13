
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

// Default settings
interface SettingsStructure {
  [key: string]: any;
}

const DEFAULT_SETTINGS: any = {
  general: {
    siteName: 'EscalaFin',
    siteDescription: 'Sistema de Gestión de Créditos y Préstamos',
    supportEmail: 'soporte@escalafin.com',
    timezone: 'America/Mexico_City',
    currency: 'MXN',
    language: 'es'
  },
  notifications: {
    emailEnabled: true,
    whatsappEnabled: true,
    smsEnabled: false,
    pushNotifications: true,
    reminderDays: 3,
    overdueNotifications: true
  },
  security: {
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordExpiration: 90,
    twoFactorAuth: false,
    auditLogging: true
  },
  system: {
    maintenanceMode: false,
    debugMode: false,
    autoBackup: true,
    backupFrequency: 'daily',
    maxFileSize: 50
  },
  support_spei: {
    bank: 'BANCO',
    holder: 'NOMBRE DEL TITULAR',
    clabe: '000000000000000000',
    instructions: '1. Utiliza los datos SPEI proporcionados\n2. Incluye tu número de cliente en el concepto\n3. Envía el comprobante por WhatsApp\n4. Espera la confirmación de recarga'
  },
  support_contact: {
    email: 'soporte@escalafin.com',
    whatsapp: '+525512345678',
    whatsappDisplay: '+52 55 1234 5678',
    workingHours: 'Lunes a Viernes: 9:00 AM - 6:00 PM\nSábados: 9:00 AM - 2:00 PM'
  }
};

const getSettingsKey = (category: string) => `SETTINGS_${category.toUpperCase()}`;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const userRole = session.user.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Fetch from database
    if (category) {
      const config = await tenantPrisma.systemConfig.findFirst({
        where: { key: getSettingsKey(category) }
      });

      const settings = config ? JSON.parse(config.value) : (DEFAULT_SETTINGS[category] || {});
      return NextResponse.json({ settings });
    } else {
      // Fetch all categories
      const configs = await tenantPrisma.systemConfig.findMany({
        where: { key: { startsWith: 'SETTINGS_' } }
      });

      const allSettings: any = { ...DEFAULT_SETTINGS };
      configs.forEach(c => {
        const cat = c.key.replace('SETTINGS_', '').toLowerCase();
        allSettings[cat] = JSON.parse(c.value);
      });

      return NextResponse.json({ settings: allSettings });
    }

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const userRole = session.user.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Datos de configuración inválidos' }, { status: 400 });
    }

    // Si se especifica una categoría, actualizar solo esa categoría
    if (body.category && body.settings) {
      const key = getSettingsKey(body.category);
      const existing = await tenantPrisma.systemConfig.findFirst({
        where: { key }
      });

      if (existing) {
        await tenantPrisma.systemConfig.update({
          where: { id: existing.id },
          data: {
            value: JSON.stringify(body.settings),
            updatedBy: session.user.id
          }
        });
      } else {
        await tenantPrisma.systemConfig.create({
          data: {
            key,
            value: JSON.stringify(body.settings),
            category: body.category.toUpperCase(),
            updatedBy: session.user.id
          }
        });
      }
    } else {
      // Guardar múltiples categorías (si vienen en el body)
      for (const [cat, settings] of Object.entries(body)) {
        if (typeof settings === 'object') {
          const key = getSettingsKey(cat);
          const existing = await tenantPrisma.systemConfig.findFirst({
            where: { key }
          });

          if (existing) {
            await tenantPrisma.systemConfig.update({
              where: { id: existing.id },
              data: {
                value: JSON.stringify(settings),
                updatedBy: session.user.id
              }
            });
          } else {
            await tenantPrisma.systemConfig.create({
              data: {
                key,
                value: JSON.stringify(settings),
                category: cat.toUpperCase(),
                updatedBy: session.user.id
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Configuración guardada exitosamente' });

  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
