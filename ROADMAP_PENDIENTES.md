# 📋 Roadmap de Pendientes y Tareas Técnicas

Este documento detalla las tareas específicas pendientes de implementación para la Fase 2 en adelante.

## 🚨 CRÍTICO: Validaciones Webhooks y Comunicación (Fase 2)

### 1. WhatsApp (Waha)
- [ ] **Configurar Endpoint**: Asegurar que la URL de Waha y el `WAHA_SESSION_ID` coincidan en las variables de entorno de producción.
- [ ] **Test de Envío**: Usar el panel de `/admin/notifications` para enviar un mensaje de prueba a un número real.
- [ ] **Webhooks**: Verificar si los mensajes entrantes se registran en el sistema (si aplica).

### 2. Automatización (Cron Jobs)
- [ ] **Cron Semanal**: Verificar manualmente la ejecución del script de reporte semanal (`/api/cron/weekly-report`).
- [ ] **Logs**: Confirmar que los logs de cron se escriben correctamente en `/var/log` o salida estándar.

## 🔧 MEDIA: Mejoras y Optimizaciones

- [ ] **Refactor Tarifas Fijas**: Mover la configuración de montos y tarifas (actualmente en `loan-calculations.ts`) a una tabla de base de datos o configuración JSON editable desde admin.
- [ ] **Simulador de Préstamos**: Crear un componente UI aislado para simular pagos antes de crear el préstamo real.
- [ ] **Validación de Formularios**: Mejorar mensajes de error en el frontend para campos inválidos (especialmente en móviles).

## ✅ COMPLETADO (Histórico Reciente v1.5.0)

- [x] **Infraestructura**: Migración a Debian 12 (Bookworm) para soporte EasyPanel.
- [x] **Imágenes**: Fix de subida de imágenes de perfil (Content-Type validation).
- [x] **Funcionalidad**: Implementación de sistema dual de Tarifas Fijas / Interés.
- [x] **Deployment**: Scripts de verificación de despliegue (`verify-deployment.sh`).

---
**Cómo contribuir**: Al tomar una tarea, crea una rama `feature/nombre-tarea`, implementa, prueba y haz PR a `main`.
