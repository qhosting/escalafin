import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { prisma } from '@/lib/prisma';

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

    // Si es CLIENTE o ASESOR, ven el soporte del TENANT al que pertenecen
    if (userRole === 'CLIENTE' || userRole === 'ASESOR') {
      if (tenantId) {
        const tenantPrisma = getTenantPrisma(tenantId);
        
        const contactConfig = await tenantPrisma.systemConfig.findFirst({
          where: { key: 'SETTINGS_SUPPORT_CONTACT' }
        });
        if (contactConfig) {
          contactSettings = { ...contactSettings, ...JSON.parse(contactConfig.value) };
        }

        const speiConfig = await tenantPrisma.systemConfig.findFirst({
          where: { key: 'SETTINGS_SUPPORT_SPEI' }
        });
        if (speiConfig) {
          speiSettings = { ...speiSettings, ...JSON.parse(speiConfig.value) };
        }
      }
    } 
    // Si es ADMIN o SUPER_ADMIN, ven el soporte GLOBAL (del sistema principal / SAAS)
    else {
      const globalContactConfig = await prisma.systemConfig.findFirst({
        where: { key: 'SETTINGS_SUPPORT_CONTACT', tenantId: null }
      });
      if (globalContactConfig) {
        contactSettings = { ...contactSettings, ...JSON.parse(globalContactConfig.value) };
      }

      const globalSpeiConfig = await prisma.systemConfig.findFirst({
        where: { key: 'SETTINGS_SUPPORT_SPEI', tenantId: null }
      });
      if (globalSpeiConfig) {
        speiSettings = { ...speiSettings, ...JSON.parse(globalSpeiConfig.value) };
      }
    }

    return NextResponse.json({
      contact: contactSettings,
      spei: speiSettings
    });

  } catch (error) {
    console.error('Error fetching support config:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
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

    // Guardar Contacto
    if (contact) {
      if (userRole === 'SUPER_ADMIN') {
        const existing = await prisma.systemConfig.findFirst({ where: { key: 'SETTINGS_SUPPORT_CONTACT', tenantId: null } });
        if (existing) {
          await prisma.systemConfig.update({ where: { id: existing.id }, data: { value: JSON.stringify(contact), updatedBy: session.user.id } });
        } else {
          await prisma.systemConfig.create({ data: { key: 'SETTINGS_SUPPORT_CONTACT', tenantId: null, value: JSON.stringify(contact), category: 'SUPPORT_CONTACT', updatedBy: session.user.id } });
        }
      } else if (tenantId) {
        const tenantPrisma = getTenantPrisma(tenantId);
        const existing = await tenantPrisma.systemConfig.findFirst({ where: { key: 'SETTINGS_SUPPORT_CONTACT' } });
        if (existing) {
          await (tenantPrisma.systemConfig as any).update({ where: { id: existing.id }, data: { value: JSON.stringify(contact), updatedBy: session.user.id } });
        } else {
          await (tenantPrisma.systemConfig as any).create({ data: { key: 'SETTINGS_SUPPORT_CONTACT', value: JSON.stringify(contact), category: 'SUPPORT_CONTACT', updatedBy: session.user.id } });
        }
      }
    }

    // Guardar SPEI
    if (spei) {
      if (userRole === 'SUPER_ADMIN') {
        const existing = await prisma.systemConfig.findFirst({ where: { key: 'SETTINGS_SUPPORT_SPEI', tenantId: null } });
        if (existing) {
          await prisma.systemConfig.update({ where: { id: existing.id }, data: { value: JSON.stringify(spei), updatedBy: session.user.id } });
        } else {
          await prisma.systemConfig.create({ data: { key: 'SETTINGS_SUPPORT_SPEI', tenantId: null, value: JSON.stringify(spei), category: 'SUPPORT_SPEI', updatedBy: session.user.id } });
        }
      } else if (tenantId) {
        const tenantPrisma = getTenantPrisma(tenantId);
        const existing = await tenantPrisma.systemConfig.findFirst({ where: { key: 'SETTINGS_SUPPORT_SPEI' } });
        if (existing) {
          await (tenantPrisma.systemConfig as any).update({ where: { id: existing.id }, data: { value: JSON.stringify(spei), updatedBy: session.user.id } });
        } else {
          await (tenantPrisma.systemConfig as any).create({ data: { key: 'SETTINGS_SUPPORT_SPEI', value: JSON.stringify(spei), category: 'SUPPORT_SPEI', updatedBy: session.user.id } });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving support config:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
