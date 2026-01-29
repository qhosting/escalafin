# 📋 Roadmap de Pendientes y Mejoras Futuras

Este documento detalla las tareas pendientes, validaciones necesarias y mejoras planificadas para el sistema EscalaFin.

## 🚨 Prioridad Alta: Verificación Post-Deploy (Inmediato)

Estas tareas deben realizarse inmediatamente después del despliegue en Easypanel para asegurar la estabilidad del sistema.

### 1. Validación de Despliegue en Easypanel
> 💡 **Herramienta disponible**: Ejecutar `./scripts/verify-deployment.sh` en la consola del contenedor para validación automática.

- [ ] **Build Cache**: Verificar que se haya limpiado la caché de build en Easypanel antes del nuevo despliegue.
- [ ] **Logs de Build**: Confirmar que el build utiliza Debian 12 Bookworm y que la instalación de paquetes (`openssl`, `curl`, `ca-certificates`) es exitosa.
- [ ] **Startup**: Verificar que el contenedor inicia correctamente y conecta a la base de datos sin errores de Prisma.

### 2. Pruebas de Funcionalidad Crítica en Producción
- [ ] **Subida de Imágenes**: Probar la carga de imágenes de perfil de clientes. Verificar logs para confirmar que el tipo de contenido se valida correctamente.
- [x] **Generación de PDFs**: Implementado con `pdfkit`. **Pendiente**: Verificar descarga de reporte en `/pwa/reports`.
- [x] **Conexión WhatsApp**: Migrado a **Waha**. **Pendiente**:
    - [ ] Configurar URL y Session ID en `/admin/whatsapp/config`.
    - [ ] Enviar mensaje de prueba.
    - [ ] Verificar recepción de webhooks en `/api/webhooks/waha`.

---

## 📅 Corto Plazo: Mejoras de Usabilidad y Estabilidad

### Módulo Móvil (`/mobile`)
- [x] **Acceso Offline**: Mejorar las capacidades de PWA para funcionamiento sin conexión. (Base PWA existente)
- [x] **Registro de Visitas**: Implementar un formulario rápido para registrar visitas de cobranza en campo con geolocalización. (`/mobile/visits/new`)
- [x] **Dashboard Resumido**: Agregar métricas clave para asesores en la vista móvil. (`/mobile/dashboard`)

### Reportes
- [x] **Exportación Excel**: Implementar exportación a Excel nativa para todos los reportes tabular. (Soportado en `/pwa/reports`)
- [x] **Reportes Programados**: Configurar envío automático de reportes semanales por email a administradores. (API `/api/cron/weekly-report` + Script)

---

## 🔭 Largo Plazo: Expansión del Sistema

### Automatización e IA
- [x] **Scoring Predictivo**: Implementar modelo de ML/Estadístico para predecir probabilidad de impago basado en histórico. (`/api/clients/[id]/predict-score`)
- [ ] **Chatbot**: Integrar chatbot básico para respuestas automáticas a clientes vía WhatsApp.

### Infraestructura
- [ ] **Scaling**: Configurar auto-scaling horizontal si la carga de usuarios aumenta significativamente.
- [ ] **Backup Automatizado S3**: Configurar backups de base de datos directos a S3 con retención configurable.

### Integraciones
- [ ] **Buró de Crédito**: Integración vía API para consulta de historial crediticio externo (si aplica).
- [ ] **Pasarelas Adicionales**: Añadir soporte para Stripe o MercadoPago.

---

## 🐛 Errores Conocidos (Bugs) a Monitorear

- **Sincronización de Sesión**: Ocasionalmente los usuarios reportan cierre de sesión inesperado en móviles (monitorear configuración de cookies/tokens).
- **Timeouts en Reportes Grandes**: Reportes con >10,000 registros pueden dar timeout en generación (optimizar queries o mover a background jobs).
