import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { prisma } from '@/lib/db';

const DEFAULT_SUPPORT_CONTACT = {
  email: 'soporte@escalafin.com',
  whatsapp: '4424000742',
  whatsappDisplay: '442 400 0742',
  workingHours: 'Lunes a Viernes: 9:00 AM - 6:00 PM\nSábados: 9:00 AM - 2:00 PM'
};

const DEFAULT_SUPPORT_SPEI = {
  bank: 'BANCO',
  holder: 'NOMBRE DEL TITULAR',
  clabe: '000000000000000000',
  instructions: '1. Utiliza los datos SPEI proporcionados\n2. Incluye tu número de cliente en el concepto\n3. Envía el comprobante por WhatsApp\n4. Espera la confirmación de recarga'
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const userRole = session.user.role;

    let contactSettings = { ...DEFAULT_SUPPORT_CONTACT };
    let speiSettings = { ...DEFAULT_SUPPORT_SPEI };

    // Si NO es SUPER_ADMIN, intentamos obtener la configuración del TENANT
    if (userRole !== 'SUPER_ADMIN' && tenantId) {
      const tenantPrisma = getTenantPrisma(tenantId);
      
      const [contactConfig, speiConfig] = await Promise.all([
        tenantPrisma.systemConfig.findFirst({
          where: { key: 'SETTINGS_SUPPORT_CONTACT' }
        }),
        tenantPrisma.systemConfig.findFirst({
          where: { key: 'SETTINGS_SUPPORT_SPEI' }
        })
      ]);

      if (contactConfig) {
        try {
          contactSettings = { ...contactSettings, ...JSON.parse(contactConfig.value) };
        } catch (e) { console.error('Error parsing contact config'); }
      }

      if (speiConfig) {
        try {
          speiSettings = { ...speiSettings, ...JSON.parse(speiConfig.value) };
        } catch (e) { console.error('Error parsing spei config'); }
      }
    } 
    // Si es SUPER_ADMIN, obtenemos la configuración GLOBAL (tenantId: null)
    else {
      const [globalContactConfig, globalSpeiConfig] = await Promise.all([
        prisma.systemConfig.findFirst({
          where: { key: 'SETTINGS_SUPPORT_CONTACT', tenantId: null }
        }),
        prisma.systemConfig.findFirst({
          where: { key: 'SETTINGS_SUPPORT_SPEI', tenantId: null }
        })
      ]);

      if (globalContactConfig) {
        try {
          contactSettings = { ...contactSettings, ...JSON.parse(globalContactConfig.value) };
        } catch (e) { console.error('Error parsing global contact config'); }
      }

      if (globalSpeiConfig) {
        try {
          speiSettings = { ...speiSettings, ...JSON.parse(globalSpeiConfig.value) };
        } catch (e) { console.error('Error parsing global spei config'); }
      }
    }

    return NextResponse.json({
      contact: contactSettings,
      spei: speiSettings
    });

  } catch (error: any) {
    console.error('Error fetching support config:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { contact, spei } = await request.json();
    const tenantId = session.user.tenantId;
    const userRole = session.user.role;

    // Determinar qué cliente de prisma usar y qué filtros aplicar
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const targetPrisma = isSuperAdmin ? prisma : (tenantId ? getTenantPrisma(tenantId) : null);

    if (!targetPrisma) {
      return NextResponse.json({ error: 'No se pudo determinar el contexto del tenant' }, { status: 400 });
    }

    // Función helper para guardar config
    const saveConfig = async (key: string, value: any, category: string) => {
      const stringValue = JSON.stringify(value);
      
      // Filtro para búsqueda: para SUPER_ADMIN es explicitly null, para otros lo maneja el proxy de tenant
      const whereFilter = isSuperAdmin ? { key, tenantId: null } : { key };
      
      const existing = await (targetPrisma.systemConfig as any).findFirst({ 
        where: whereFilter 
      });

      if (existing) {
        return (targetPrisma.systemConfig as any).update({
          where: { id: existing.id },
          data: { 
            value: stringValue, 
            updatedBy: session.user.id 
          }
        });
      } else {
        return (targetPrisma.systemConfig as any).create({
          data: {
            key,
            value: stringValue,
            category,
            updatedBy: session.user.id,
            tenantId: isSuperAdmin ? null : undefined // undefined deja que el proxy lo maneje o prisma default
          }
        });
      }
    };

    if (contact) {
      await saveConfig('SETTINGS_SUPPORT_CONTACT', contact, 'SUPPORT_CONTACT');
    }

    if (spei) {
      await saveConfig('SETTINGS_SUPPORT_SPEI', spei, 'SUPPORT_SPEI');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving support config:', error);
    return NextResponse.json({ 
      error: 'Error al guardar la configuración', 
      details: error.message 
    }, { status: 500 });
  }
}
