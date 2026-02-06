
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const modules = [
  // Dashboard Modules
  {
    moduleKey: 'dashboard_overview',
    name: 'Vista General del Dashboard',
    description: 'Panel principal con estadísticas y resumen',
    category: 'DASHBOARD',
    status: 'ENABLED',
    isCore: true,
    requiredFor: ['ADMIN', 'ASESOR', 'CLIENTE'],
    availableFor: ['ADMIN', 'ASESOR', 'CLIENTE'],
    icon: 'BarChart3',
    route: '/dashboard',
    sortOrder: 1,
  },
  {
    moduleKey: 'admin_analytics',
    name: 'Análisis Administrativo',
    description: 'Gráficos y métricas avanzadas para administradores',
    category: 'ANALYTICS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: ['ADMIN'],
    availableFor: ['ADMIN'],
    icon: 'TrendingUp',
    route: '/admin/analytics',
    sortOrder: 2,
  },

  // Client Management Modules
  {
    moduleKey: 'client_list',
    name: 'Lista de Clientes',
    description: 'Gestión y visualización de clientes',
    category: 'CLIENTS',
    status: 'ENABLED',
    isCore: true,
    requiredFor: ['ADMIN', 'ASESOR'],
    availableFor: ['ADMIN', 'ASESOR'],
    icon: 'Users',
    route: '/clients',
    sortOrder: 10,
  },
  {
    moduleKey: 'client_add',
    name: 'Agregar Cliente',
    description: 'Formulario para registrar nuevos clientes',
    category: 'CLIENTS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: ['ADMIN', 'ASESOR'],
    availableFor: ['ADMIN', 'ASESOR'],
    icon: 'UserPlus',
    route: '/clients/add',
    sortOrder: 11,
  },
  {
    moduleKey: 'client_profile',
    name: 'Perfil del Cliente',
    description: 'Vista detallada del cliente y su información',
    category: 'CLIENTS',
    status: 'ENABLED',
    isCore: true,
    requiredFor: ['CLIENTE'],
    availableFor: ['ADMIN', 'ASESOR', 'CLIENTE'],
    icon: 'User',
    route: '/profile',
    sortOrder: 12,
  },

  // Loan Management Modules
  {
    moduleKey: 'loan_list',
    name: 'Gestión de Préstamos',
    description: 'Lista y administración de préstamos',
    category: 'LOANS',
    status: 'ENABLED',
    isCore: true,
    requiredFor: ['ADMIN', 'ASESOR'],
    availableFor: ['ADMIN', 'ASESOR'],
    icon: 'CreditCard',
    route: '/loans',
    sortOrder: 20,
  },
  {
    moduleKey: 'loan_create',
    name: 'Crear Préstamo',
    description: 'Formulario para crear nuevos préstamos',
    category: 'LOANS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: ['ADMIN', 'ASESOR'],
    availableFor: ['ADMIN', 'ASESOR'],
    icon: 'Plus',
    route: '/loans/create',
    sortOrder: 21,
  },
  {
    moduleKey: 'loan_calculator',
    name: 'Calculadora de Préstamos',
    description: 'Herramienta para calcular pagos y intereses',
    category: 'TOOLS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN', 'ASESOR', 'CLIENTE'],
    icon: 'Calculator',
    route: '/calculator',
    sortOrder: 60,
  },
  {
    moduleKey: 'my_loans',
    name: 'Mis Préstamos',
    description: 'Vista de préstamos del cliente',
    category: 'LOANS',
    status: 'ENABLED',
    isCore: true,
    requiredFor: ['CLIENTE'],
    availableFor: ['CLIENTE'],
    icon: 'CreditCard',
    route: '/my-loans',
    sortOrder: 22,
  },

  // Payment Modules
  {
    moduleKey: 'payment_history',
    name: 'Historial de Pagos',
    description: 'Registro completo de pagos realizados',
    category: 'PAYMENTS',
    status: 'ENABLED',
    isCore: true,
    requiredFor: ['ADMIN', 'ASESOR', 'CLIENTE'],
    availableFor: ['ADMIN', 'ASESOR', 'CLIENTE'],
    icon: 'DollarSign',
    route: '/payments',
    sortOrder: 30,
  },
  {
    moduleKey: 'payment_process',
    name: 'Procesar Pago',
    description: 'Interface para procesar pagos manuales',
    category: 'PAYMENTS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: ['ADMIN', 'ASESOR'],
    availableFor: ['ADMIN', 'ASESOR'],
    icon: 'CreditCard',
    route: '/payments/process',
    sortOrder: 31,
  },
  {
    moduleKey: 'payment_online',
    name: 'Pago en Línea',
    description: 'Portal de pagos en línea para clientes',
    category: 'PAYMENTS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['CLIENTE'],
    icon: 'Globe',
    route: '/pay-online',
    sortOrder: 32,
  },
  {
    moduleKey: 'cash_collection',
    name: 'Cobro en Efectivo',
    description: 'Módulo móvil para cobro en campo',
    category: 'PAYMENTS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ASESOR'],
    icon: 'Banknote',
    route: '/cash-collection',
    sortOrder: 33,
  },

  // Report Modules
  {
    moduleKey: 'report_portfolio',
    name: 'Reporte de Cartera',
    description: 'Análisis detallado de la cartera de préstamos',
    category: 'REPORTS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: ['ADMIN'],
    availableFor: ['ADMIN', 'ASESOR'],
    icon: 'FileText',
    route: '/reports/portfolio',
    sortOrder: 40,
  },
  {
    moduleKey: 'report_collections',
    name: 'Reporte de Cobranza',
    description: 'Información sobre pagos vencidos y cobranza',
    category: 'REPORTS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN', 'ASESOR'],
    icon: 'AlertTriangle',
    route: '/reports/collections',
    sortOrder: 41,
  },
  {
    moduleKey: 'report_export',
    name: 'Exportar Reportes',
    description: 'Exportación de datos en diferentes formatos',
    category: 'REPORTS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN', 'ASESOR'],
    icon: 'Download',
    route: '/reports/export',
    sortOrder: 42,
  },

  // Notification Modules
  {
    moduleKey: 'notifications_inapp',
    name: 'Notificaciones In-App',
    description: 'Sistema de notificaciones dentro de la aplicación',
    category: 'NOTIFICATIONS',
    status: 'ENABLED',
    isCore: true,
    requiredFor: ['ADMIN', 'ASESOR', 'CLIENTE'],
    availableFor: ['ADMIN', 'ASESOR', 'CLIENTE'],
    icon: 'Bell',
    route: '/notifications',
    sortOrder: 50,
  },
  {
    moduleKey: 'whatsapp_notifications',
    name: 'Notificaciones WhatsApp',
    description: 'Envío de notificaciones vía WhatsApp',
    category: 'NOTIFICATIONS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN', 'ASESOR'],
    icon: 'MessageSquare',
    route: '/whatsapp',
    sortOrder: 51,
  },

  // Integration Modules
  {
    moduleKey: 'openpay_integration',
    name: 'Integración Openpay',
    description: 'Procesamiento de pagos con Openpay',
    category: 'INTEGRATIONS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN'],
    icon: 'CreditCard',
    route: '/integrations/openpay',
    sortOrder: 70,
  },
  {
    moduleKey: 'evolution_api', // Mantengo la key para evitar romper referencias de base de datos existentes, pero cambio el nombre visual
    name: 'WAHA WhatsApp',
    description: 'Integración con WAHA para WhatsApp',
    category: 'INTEGRATIONS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN'],
    icon: 'MessageCircle',
    route: '/integrations/whatsapp',
    sortOrder: 71,
  },
  {
    moduleKey: 'chatwoot_chat',
    name: 'Chatwoot',
    description: 'Sistema de chat en tiempo real para soporte a clientes',
    category: 'INTEGRATIONS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN'],
    icon: 'MessageSquare',
    route: '/admin/chatwoot',
    sortOrder: 72,
  },

  // Credit Application Modules
  {
    moduleKey: 'credit_applications_admin',
    name: 'Solicitudes de Crédito (Admin)',
    description: 'Gestión completa de solicitudes de crédito',
    category: 'CREDIT',
    status: 'ENABLED',
    isCore: true,
    requiredFor: ['ADMIN'],
    availableFor: ['ADMIN'],
    icon: 'FileCheck',
    route: '/admin/credit-applications',
    sortOrder: 80,
  },
  {
    moduleKey: 'credit_applications_asesor',
    name: 'Solicitudes de Crédito (Asesor)',
    description: 'Revisión y gestión de solicitudes de crédito',
    category: 'CREDIT',
    status: 'ENABLED',
    isCore: true,
    requiredFor: ['ASESOR'],
    availableFor: ['ASESOR'],
    icon: 'FileCheck',
    route: '/asesor/credit-applications',
    sortOrder: 81,
  },
  {
    moduleKey: 'credit_applications_cliente',
    name: 'Mis Solicitudes de Crédito',
    description: 'Crear y consultar solicitudes de crédito',
    category: 'CREDIT',
    status: 'ENABLED',
    isCore: true,
    requiredFor: ['CLIENTE'],
    availableFor: ['CLIENTE'],
    icon: 'FileText',
    route: '/cliente/credit-applications',
    sortOrder: 82,
  },

  // System Management Modules
  {
    moduleKey: 'audit_log',
    name: 'Sistema de Auditoría',
    description: 'Monitoreo completo de actividades y trazabilidad',
    category: 'SYSTEM',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN'],
    icon: 'Shield',
    route: '/admin/audit',
    sortOrder: 90,
  },
  {
    moduleKey: 'system_config',
    name: 'Configuración General',
    description: 'Configuración del sistema y control de registro',
    category: 'SYSTEM',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN'],
    icon: 'Settings',
    route: '/admin/config',
    sortOrder: 91,
  },
  {
    moduleKey: 'message_recharges',
    name: 'Recargas de Mensajes',
    description: 'Gestión de recargas de mensajes WhatsApp',
    category: 'SYSTEM',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN'],
    icon: 'Zap',
    route: '/admin/message-recharges',
    sortOrder: 92,
  },
  {
    moduleKey: 'module_management',
    name: 'Gestión de Módulos PWA',
    description: 'Administración de módulos del sistema PWA',
    category: 'SYSTEM',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN'],
    icon: 'Package',
    route: '/admin/modules',
    sortOrder: 93,
  },
  {
    moduleKey: 'credit_scoring',
    name: 'Scoring Crediticio',
    description: 'Sistema de evaluación automatizada de riesgo crediticio',
    category: 'SYSTEM',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN'],
    icon: 'TrendingUp',
    route: '/admin/scoring',
    sortOrder: 94,
  },
  {
    moduleKey: 'storage_config',
    name: 'Configuración de Almacenamiento',
    description: 'Configuración del sistema de almacenamiento (Local/S3)',
    category: 'SYSTEM',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN'],
    icon: 'HardDrive',
    route: '/admin/storage',
    sortOrder: 95,
  },

  // Tools Modules
  {
    moduleKey: 'file_management',
    name: 'Gestión de Archivos',
    description: 'Subida y administración de documentos',
    category: 'TOOLS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: [],
    availableFor: ['ADMIN', 'ASESOR', 'CLIENTE'],
    icon: 'FileText',
    route: '/files',
    sortOrder: 61,
  },
  {
    moduleKey: 'user_management',
    name: 'Gestión de Usuarios',
    description: 'Administración de usuarios del sistema',
    category: 'TOOLS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: ['ADMIN'],
    availableFor: ['ADMIN'],
    icon: 'Settings',
    route: '/admin/users',
    sortOrder: 62,
  },
  {
    moduleKey: 'system_settings',
    name: 'Configuración del Sistema',
    description: 'Configuraciones generales del sistema',
    category: 'TOOLS',
    status: 'ENABLED',
    isCore: false,
    requiredFor: ['ADMIN'],
    availableFor: ['ADMIN'],
    icon: 'Settings',
    route: '/admin/settings',
    sortOrder: 63,
  },
];

// Default role permissions for each module
const rolePermissionsTemplate = [
  { role: 'ADMIN', permissions: ['read', 'write', 'delete', 'manage'] },
  { role: 'ASESOR', permissions: ['read', 'write'] },
  { role: 'CLIENTE', permissions: ['read'] },
];

export async function seedModules() {
  console.log('🌱 Seeding PWA modules (idempotent - safe for production)...');

  try {
    let modulesCreated = 0;
    let modulesUpdated = 0;

    for (const moduleData of modules) {
      console.log(`Processing module: ${moduleData.name} (${moduleData.moduleKey})`);

      // Upsert the module (create if new, update if exists)
      const module = await prisma.pWAModule.upsert({
        where: {
          moduleKey: moduleData.moduleKey
        },
        update: {
          name: moduleData.name,
          description: moduleData.description,
          category: moduleData.category as any,
          status: moduleData.status as any,
          isCore: moduleData.isCore,
          requiredFor: moduleData.requiredFor,
          availableFor: moduleData.availableFor,
          icon: moduleData.icon,
          route: moduleData.route,
          sortOrder: moduleData.sortOrder,
        },
        create: {
          moduleKey: moduleData.moduleKey,
          name: moduleData.name,
          description: moduleData.description,
          category: moduleData.category as any,
          status: moduleData.status as any,
          isCore: moduleData.isCore,
          requiredFor: moduleData.requiredFor,
          availableFor: moduleData.availableFor,
          icon: moduleData.icon,
          route: moduleData.route,
          sortOrder: moduleData.sortOrder,
        },
      });

      // Check if it was created or updated
      const existingModule = await prisma.pWAModule.findUnique({
        where: { moduleKey: moduleData.moduleKey },
        select: { createdAt: true, updatedAt: true }
      });

      if (existingModule && existingModule.createdAt.getTime() === existingModule.updatedAt.getTime()) {
        modulesCreated++;
        console.log(`  ✨ Created new module: ${moduleData.name}`);
      } else {
        modulesUpdated++;
        console.log(`  🔄 Updated existing module: ${moduleData.name}`);
      }

      // Upsert role permissions for each available role
      for (const role of moduleData.availableFor) {
        const permissionTemplate = rolePermissionsTemplate.find(p => p.role === role);
        const enabled = moduleData.requiredFor.includes(role) || moduleData.isCore;

        // Check if permission already exists
        const existingPermission = await prisma.moduleRolePermission.findFirst({
          where: {
            moduleId: module.id,
            role: role as any,
          },
        });

        if (existingPermission) {
          // Update existing permission
          await prisma.moduleRolePermission.update({
            where: { id: existingPermission.id },
            data: {
              enabled,
              permissions: JSON.stringify(permissionTemplate?.permissions || ['read']),
            },
          });
        } else {
          // Create new permission
          await prisma.moduleRolePermission.create({
            data: {
              moduleId: module.id,
              role: role as any,
              enabled,
              permissions: JSON.stringify(permissionTemplate?.permissions || ['read']),
            },
          });
        }
      }

      console.log(`  ✅ Permissions configured for ${moduleData.availableFor.length} roles`);
    }

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('🎉 PWA modules seeded successfully!');
    console.log(`  ✨ New modules created: ${modulesCreated}`);
    console.log(`  🔄 Existing modules updated: ${modulesUpdated}`);
    console.log(`  📊 Total modules: ${modules.length}`);
    console.log('═══════════════════════════════════════════');
  } catch (error) {
    console.error('❌ Error seeding modules:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedModules()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
