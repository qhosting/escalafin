# 📋 Roadmap de Pendientes y Mejoras Futuras

Este documento detalla las tareas pendientes, validaciones necesarias y mejoras planificadas para el sistema EscalaFin.

## 🚨 Prioridad Alta: Verificación Post-Deploy

Estas tareas deben realizarse inmediatamente después del despliegue en Easypanel para asegurar la estabilidad del sistema.

### 1. Validación de Despliegue en Easypanel
- [ ] **Build Cache**: Verificar que se haya limpiado la caché de build en Easypanel antes del nuevo despliegue.
- [ ] **Logs de Build**: Confirmar que el build utiliza Debian 12 Bookworm y que la instalación de paquetes (`openssl`, `curl`, `ca-certificates`) es exitosa.
- [ ] **Startup**: Verificar que el contenedor inicia correctamente y conecta a la base de datos sin errores de Prisma.

### 2. Pruebas de Funcionalidad Crítica en Producción
- [ ] **Subida de Imágenes**: Probar la carga de imágenes de perfil de clientes. Verificar logs para confirmar que el tipo de contenido se valida correctamente.
- [ ] **Generación de PDFs**: Confirmar que la generación de contratos y reportes PDF funciona (requiere librerías del sistema instaladas correctamente).
- [ ] **Conexión WhatsApp**: Verificar que Waha está conectado y enviando mensajes de prueba.

---

## 📅 Corto Plazo: Mejoras de Usabilidad y Estabilidad

### Módulo Móvil (`/mobile`)
- [ ] **Acceso Offline**: Mejorar las capacidades de PWA para funcionamiento sin conexión.
- [ ] **Registro de Visitas**: Implementar un formulario rápido para registrar visitas de cobranza en campo con geolocalización.
- [ ] **Dashboard Resumido**: Agregar métricas clave para asesores en la vista móvil.

### Reportes
- [ ] **Exportación Excel**: Implementar exportación a Excel nativa para todos los reportes tabular.
- [ ] **Reportes Programados**: Configurar envío automático de reportes semanales por email a administradores.

---

## 🔭 Largo Plazo: Expansión del Sistema

### Automatización e IA
- [ ] **Scoring Predictivo**: Implementar modelo de ML para predecir probabilidad de impago basado en histórico.
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
