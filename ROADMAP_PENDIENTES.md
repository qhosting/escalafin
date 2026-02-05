# 📋 Roadmap de Pendientes y Tareas Técnicas

Este documento detalla las tareas específicas pendientes de implementación para la Fase 2 en adelante.

## 🚀 FASE 2: Automatización y Operatividad (COMPLETADA ✅)

- [x] **Comunicaciones (WhatsApp)**: Endpoints de webhooks y lógica de recordatorios.
- [x] **Respaldo de Datos**: Script de backup a Google Drive y soporte para Redis.
- [x] **Cron Jobs**: Implementación de todos los endpoints de automatización.

## 📈 FASE 3: Expansión Funcional y Negocio (EN PROGRESO)

### 1. Configuración Dinámica (Tarifas y Tasas)
**Estado: Implementado ✅**
- [x] **ConfigService**: Manejo de `SystemConfig` para persistencia de tarifas.
- [x] **Panel Administrativo**: Interfaz en `/admin/config/loans` para editar niveles y tasas.
- [x] **Refactor de Cálculos**: `loan-calculations.ts` ahora consume la configuración de la base de datos.
- [x] **Mercado Pago**: Integración de Checkout Pro y Webhooks para abonos automáticos.

### 2. Herramientas de Apoyo
**Estado: Implementado ✅**
- [x] **Simulador de Préstamos**: Nueva herramienta en `/asesor/simulator` para proyecciones rápidas.
- [x] **Cálculos en Tiempo Real**: Feedback inmediato sobre pagos y costo total.

## 🔮 FASE 4: Inteligencia y Escalabilidad (EARLY ACCESS)

### 1. IA y Scoring Predictivo
**Estado: Early Access 🚀**
- [x] **Modelo Predictivo**: Motor basado en Sigmoide para probabilidad de impago.
- [x] **Integración UI**: Visualización premium de "IA Insights" en el sistema de scoring.
- [ ] **Entrenamiento Continuo**: Ajuste de pesos basado en datos históricos reales (Próximamente).
