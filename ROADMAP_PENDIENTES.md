# 📋 Roadmap de Pendientes y Tareas Técnicas

Este documento detalla las tareas específicas pendientes de implementación para la Fase 2 en adelante.

## 🚀 FASE 2: Automatización y Operatividad (EN PROGRESO)

### 1. WhatsApp (Waha) Configuración
**Estado: Código implementado ✅ | Pendiente: Configuración Prod ⏳**

- [ ] **Variables de Entorno**: Configurar en EasyPanel:
    - `WAHA_API_KEY`: Clave API de Waha (si aplica).
    - `WAHA_BASE_URL`: URL de la instancia Waha (ej. `https://waha.tudominio.com`).
    - `NEXT_PUBLIC_APP_URL`: URL de tu aplicación para webhooks.
- [ ] **Waha Session**: Verificar que la sesión "default" esté escaneada y activa en el dashboard de Waha.
- [ ] **Webhooks**: Configurar en Waha (Dashboard -> Webhooks) la URL: `https://tu-app-escalafin.com/api/webhooks/waha`.

### 2. Cron Jobs (Tareas Programadas)
**Estado: Endpoints listos ✅ | Pendiente: Activación en EasyPanel ⏳**

Configurar los siguientes Cron Jobs en EasyPanel (Services -> App -> Advanced -> Crons) o sistema equivalente.
**Header requerido**: `Authorization: Bearer TU_CRON_SECRET`

| Tarea | Frecuencia | Comando / URL | Descripción |
|-------|------------|---------------|-------------|
| **Recordatorios Pago** | `0 9 * * *` (9:00 AM) | `curl -H "Authorization: Bearer ${CRON_SECRET}" http://localhost:3000/api/cron/reminders` | Envía WA a pagos próximos y vencidos |
| **Reporte Semanal** | `0 8 * * 1` (Lunes 8:00 AM) | `curl -H "Authorization: Bearer ${CRON_SECRET}" http://localhost:3000/api/cron/weekly-report` | Envía resumen métricas por Email |
| **Backup DB** | `0 3 * * *` (3:00 AM) | `curl -H "Authorization: Bearer ${CRON_SECRET}" http://localhost:3000/api/cron/backup` | Backup PG + Mongo -> Drive |
| **Limpieza** | `0 4 * * *` (4:00 AM) | `curl -H "Authorization: Bearer ${CRON_SECRET}" http://localhost:3000/api/cron/cleanup` | Borra logs y backups locales viejos |

### 3. Google Drive Backup
**Estado: Script TS listo ✅ | Pendiente: Credenciales ⏳**

- [ ] **Service Account**: Generar JSON de credenciales en Google Console.
- [ ] **Variable ENV**: Pegar el JSON minificado en `GOOGLE_SERVICE_ACCOUNT_JSON`.
- [ ] **Carpeta ID**: Pegar el ID del folder destino en `GOOGLE_DRIVE_FOLDER_ID`.

## 🔧 MEDIA: Mejoras UX/UI

- [ ] **Refactor Tarifas Fijas**: Mover configuración a BD.
- [ ] **Simulador de Préstamos**: Componente visual para asesores.

---
**Notas de Versión**:
- **v1.5.0**: Fase 1 Completada (Debian 12, Tarifas Fijas).
