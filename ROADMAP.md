# 🗺️ Roadmap General - EscalaFin

Este documento define la hoja de ruta estratégica para el desarrollo y evolución del sistema EscalaFin, organizada por fases de implementación.

## 📍 Estado Actual: Fase 2 (Operatividad y Automatización)
La **Fase 1** fue completada (v1.5.0). Actualmente estamos implementando la **Fase 2**, enfocada en la automatización de backups, reportes y comunicaciones para reducir la carga operativa.

---

## ✅ Fase 1: Estabilización y Despliegue (v1.5.0)
- [x] **Infraestructura Core**: Migración a Debian 12 Bookworm (Fix apt-get).
- [x] **Gestión de Archivos**: Sistema robusto de subida de imágenes.
- [x] **Sistema de Préstamos**: Tarifas Fijas vs Interés.

## 🚀 Fase 2: Operatividad y Automatización (En Progreso)
**Objetivo**: Activar canales de comunicación y tareas automáticas ("set and forget").

- [x] **Comunicaciones (WhatsApp)**:
    - [x] Endpoint de Webhooks Waha (`/api/webhooks/waha`).
    - [x] Lógica de recordatorios de pago automáticos.
    - [ ] Configuración final de URLs en Producción (Pendiente DevOps).
- [x] **Tareas Programadas (Cron)**:
    - [x] Endpoint de Reporte Semanal (`/api/cron/weekly-report`).
    - [x] Lógica de generación de métricas y envío de correo.
    - [x] Endpoint de Limpieza automática (`/api/cron/cleanup`).
- [x] **Respaldo de Datos**:
    - [x] Script TypeScript de Backup (`pg_dump` + Drive API).
    - [x] Endpoint trigger (`/api/cron/backup`).

## 💡 Fase 3: Expansión Funcional y Negocio (Siguiente)
**Objetivo**: Flexibilidad y herramientas de venta.

- [ ] **Configuración Dinámica**: Panel admin para tarifas y plantillas.
- [ ] **Herramientas de Venta**: Simulador/Cotizador.
- [ ] **Expansión de Pagos**: Pasarelas adicionales.

## 🔮 Fase 4: Inteligencia y Escalabilidad (Futuro)
- [ ] **IA**: Scoring predictivo.
- [ ] **Infraestructura**: Auto-scaling.

---
*Última actualización: 05 Febrero 2026*
