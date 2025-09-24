

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_DIR = path.join(process.cwd(), 'user-settings');
const getSettingsFile = (userId: string) => path.join(SETTINGS_DIR, `notifications-${userId}.json`);

// Default notification settings
const DEFAULT_SETTINGS = {
  emailNotifications: true,
  whatsappNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  paymentReminders: true,
  overdueAlerts: true,
  systemUpdates: true,
  marketingMessages: false
};

async function ensureSettingsDir() {
  try {
    await fs.mkdir(SETTINGS_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await ensureSettingsDir();
    const settingsFile = getSettingsFile(session.user.id);

    try {
      const settingsData = await fs.readFile(settingsFile, 'utf-8');
      const settings = JSON.parse(settingsData);
      return NextResponse.json({ settings });
    } catch (error) {
      // Si no existe el archivo, devolver configuración por defecto
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar estructura de settings
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Configuración inválida' }, { status: 400 });
    }

    await ensureSettingsDir();
    const settingsFile = getSettingsFile(session.user.id);

    // Guardar configuración de notificaciones del usuario
    await fs.writeFile(settingsFile, JSON.stringify(body, null, 2));

    return NextResponse.json({ success: true, message: 'Configuración de notificaciones guardada' });

  } catch (error) {
    console.error('Error saving notification settings:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
