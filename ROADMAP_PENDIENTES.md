# 📋 Roadmap de Pendientes y Mejoras Futuras

Este documento detalla las tareas pendientes, mejoras planificadas y nuevas funcionalidades para futuras versiones del sistema EscalaFin.

**Última Actualización**: Febrero 22, 2026  
**Versión Actual**: 2.7.1

---

## ✅ FASE 1: MVP Funcional (COMPLETADA)

- [x] Sistema de autenticación y roles
- [x] Gestión completa de clientes
- [x] Solicitudes y aprobación de créditos
- [x] Creación y gestión de préstamos
- [x] Registro de pagos
- [x] Dashboard básico por rol
- [x] Sistema de archivos y documentos

---

## ✅ FASE 2: Automatización y Operatividad (COMPLETADA)

### 2.1 Comunicaciones
- [x] Integración con WAHA para WhatsApp
- [x] Plantillas de mensajes configurables
- [x] Notificaciones automáticas de pagos
- [x] Webhooks para ACK de mensajes
- [x] Integración con LabsMobile para SMS
- [x] Integración opcional con Chatwoot

### 2.2 Backup y Recuperación
- [x] Script de backup automático de PostgreSQL
- [x] Backup de Redis (RDB)
- [x] Integración con Google Drive
- [x] Eliminación de dependencia de MongoDB
- [x] Sistema de restauración de backups

### 2.3 Cron Jobs
- [x] Backup diario automático
- [x] Reporte semanal por email
- [x] Recordatorios de pago automáticos
- [x] Limpieza de archivos temporales

---

## ✅ FASE 3: Expansión Funcional (COMPLETADA)

### 3.1 Configuración Dinámica
- [x] Sistema de configuración persistente (`SystemConfig`)
- [x] Panel administrativo de configuración
- [x] Tarifas y tasas editables desde UI
- [x] Configuración de módulos PWA
- [x] Sistema de permisos por rol y módulo

### 3.2 Pasarelas de Pago
- [x] Integración con Mercado Pago (Checkout Pro)
- [x] Webhooks de Mercado Pago
- [x] Integración con Openpay (SaaS y Préstamos)
- [x] Conciliación automática de pagos
- [x] Generación automática de facturas SaaS

### 3.3 Métodos de Cálculo de Préstamos
- [x] Interés simple tradicional
- [x] Sistema de tarifa fija escalonada
- [x] Sistema de interés semanal
- [x] Configuración de tasas semanales por monto

### 3.4 Herramientas de Apoyo
- [x] Simulador de préstamos para asesores
- [x] Cálculos en tiempo real
- [x] Preview de tabla de amortización
- [x] Exportación de datos a Excel

---

## ✅ FASE 4: Inteligencia y Analytics (COMPLETADA)

### 4.1 IA y Scoring Predictivo
- [x] Modelo predictivo basado en Sigmoide
- [x] Cálculo de probabilidad de impago
- [x] Identificación de factores de riesgo clave
- [x] Integración en UI de scoring
- [x] Visualización premium de insights
- [x] **Entrenamiento Continuo del Modelo** (Feb 2026)
  - Reentrenamiento mensual y gestión de versiones
  - Recolección automática de feedback

### 4.2 Analytics Avanzado
- [x] Dashboard de analytics general
- [x] Reportes de cartera vencida
- [x] Análisis de cobranza
- [x] KPIs en tiempo real
- [x] Sistema de auditoría completo

---

## ✅ FASE 5: Mejoras y Optimizaciones (COMPLETADA PARCIALMENTE)

### 5.1 Comunicaciones Avanzadas
**Estado**: ✅ **COMPLETADO** (Febrero 2026)

- [x] **WhatsApp Bidireccional**
  - ✅ Recepción de mensajes de clientes
  - ✅ Conversaciones completas
  - ✅ Chatbot configurable para consultas
  - ✅ Asignación a asesores

### 5.2 Reportes y Exportación
**Estado**: ✅ **COMPLETADO** (Febrero 2026)

- [x] **Generación de Reportes Personalizados**
  - ✅ Constructor de reportes con configuración dinámica
  - ✅ Filtros avanzados personalizables
  - ✅ Exportación a Excel con formato
  - ✅ Reportes programados (DAILY, WEEKLY, MONTHLY)

### 5.3 Mejoras Técnicas de Infraestructura
**Estado**: ✅ **COMPLETADO** (Febrero 2026)

- [x] **Cache con Redis** (Mejora de rendimiento 60-80%)
- [x] **Rate Limiting** por IP y ruta
- [x] **Health Checks** y monitoreo (Liveness/Readiness endpoints)
- [x] **Sentry** para tracking de errores
- [x] **2FA** (Autenticación de Dos Factores) para administradores y asesores
- [x] **Testing** (Configuración Jest y cobertura inicial)
- [x] **Optimización de Despliegue v2.7.1**
  - ✅ Fix Next.js Standalone Build
  - ✅ Prisma Binary Targets para Docker
  - ✅ Limpieza de credenciales por defecto en Login
  - ✅ Actualización de canales de soporte (WhatsApp)

---

## 🚧 FASE 6: Pendientes y Futuro (EN PROGRESO)

### 6.1 Gestión de Cobranza
**Prioridad**: Alta  
**Estado**: ✅ **IMPLEMENTADO** (Febrero 2026)

- [x] **Rutas de Cobranza Optimizadas**
  - ✅ Algoritmo de optimización de rutas (Nearest Neighbor / TSP)
  - ✅ Priorización inteligente por mora (3 niveles)
  - ✅ Asignación automática a cobradores
  - ✅ Cálculo de distancias (Haversine) y tiempos
  - ✅ Detección automática de clientes morosos

- [x] **Gestión de Promesas de Pago**
  - ✅ Registro de promesas vinculadas a préstamos
  - ✅ Seguimiento automático de promesas (cron job)
  - ✅ Verificación contra pagos reales (±2 días tolerancia)
  - ✅ Analytics de cumplimiento por cliente
  - ✅ Identificación de top deudores

- [x] **Sistema de Comisiones**
  - ✅ Cálculo automático de comisiones
  - ✅ Comisiones por cobranza y originación
  - ✅ Esquemas configurables (porcentaje, fijo, escalas)
  - ✅ Workflow de aprobación (PENDING → APPROVED → PAID)
  - ✅ Dashboard de comisiones por asesor

**Detalles**: Ver `IMPLEMENTATION_Q2_2026.md`

### 6.2 Mejoras en Experiencia de Cliente
**Prioridad**: Media  
**Estado**: 🚧 En Progreso

- [x] Portal del Cliente (Historial, Estados de Cuenta, Chat)
- [x] **Verificación de Identidad** (KYC)
  - ✅ Carga de documentos (INE frente/reverso, selfie)
  - ✅ Procesamiento OCR (simulación, preparado para integración real)
  - ✅ Score biométrico de comparación
  - ✅ Verificación manual por administrador
  - ✅ Dashboard KYC con tasas de verificación

**Detalles**: Ver `IMPLEMENTATION_Q2_2026.md`
- [ ] **Programa de Lealtad/Referidos**
  - Bonificaciones por referidos
  - Puntos por pagos puntuales

### 6.3 Escalabilidad
**Prioridad**: Media  
**Estado**: 💡 Idea

- [ ] **API REST Pública** (Documentada con Swagger)
- [ ] **Integraciones No-Code** (Zapier, Make)
- [ ] **App Móvil Nativa** (iOS/Android)
- [ ] **Multi-tenancy Real** (Aislamiento total de datos)

---

## 📊 Prioridades por Trimestre

### Q1 2026 (Completado)
1. ✅ Migración de MongoDB a Redis/Postgres
2. ✅ Entrenamiento Continuo de IA
3. ✅ WhatsApp Bidireccional
4. ✅ Reportes Personalizados
5. ✅ Mejoras Técnicas (Cache, 2FA, Sentry)

### Q2 2026 (Implementado)
1. ✅ Gestión Avanzada de Cobranza (Rutas y Promesas)
2. ✅ Sistema de Comisiones
3. ✅ Verificación de Identidad (KYC)
4. ⏳ API Pública v1

### Q3 2026
1. Email marketing automatizado
2. Mobile app nativa (Android)
3. Marketplace de garantías

### Q4 2026
1. Multi-tenancy completo
2. Mobile app nativa (iOS)
3. Expansión a otros mercados (Monedas locales)

---

## 📝 Notas

### Criterios de Priorización
- **Alta**: Funcionalidad crítica para operación diaria
- **Media**: Mejora significativa pero no bloqueante
- **Baja**: Nice to have, puede esperar

### Estados
- ✅ **Completado**: Implementado y funcionando
- 🚧 **En Progreso**: Actualmente en desarrollo
- ⏳ **Planificado**: Definido y listo para iniciar
- 💡 **Idea**: Concepto a validar y definir

**¿Tienes sugerencias o nuevas funcionalidades?**  
Contacta al equipo de desarrollo o abre un issue.
