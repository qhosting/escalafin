

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'system-settings.json');

// Default settings
const DEFAULT_SETTINGS = {
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
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    try {
      const settingsData = await fs.readFile(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(settingsData);
      return NextResponse.json({ settings });
    } catch (error) {
      // Si no existe el archivo, devolver configuración por defecto
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
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

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validar estructura de settings
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Datos de configuración inválidos' }, { status: 400 });
    }

    // Guardar configuración en archivo
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(body, null, 2));

    return NextResponse.json({ success: true, message: 'Configuración guardada exitosamente' });

  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
