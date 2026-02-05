# 🗺️ Roadmap General - EscalaFin

Este documento define la hoja de ruta estratégica para el desarrollo y evolución del sistema EscalaFin, organizada por fases de implementación.

## 📍 Estado Actual: Fase 2 (Operatividad y Automatización)
La **Fase 1** ha sido completada exitosamente con la versión v1.5.0. El sistema cuenta con infraestructura estable en Debian 12, sistema robusto de imágenes y cálculo de préstamos versátil.
El foco actual es la automatización de comunicaciones y consolidación operativa.

---

## ✅ Fase 1: Estabilización y Despliegue (Completada v1.5.0)
**Hitos Alcanzados**:
- [x] **Infraestructura Core**: Migración a Debian 12 Bookworm (Fix apt-get).
- [x] **Gestión de Archivos**: Sistema robusto de subida de imágenes de perfil.
- [x] **Sistema de Préstamos**: Implementación de Tarifas Fijas vs Interés.
- [x] **Código Producción**: Versión `1.5.0` etiquetada y lista para despliegue.

## 🚀 Fase 2: Operatividad y Automatización (En Progreso)
**Objetivo**: Activar y optimizar los canales de comunicación y tareas automáticas para reducir la carga operativa manual.

- [ ] **Comunicaciones (WhatsApp)**:
    - Configuración final de integración con Waha en producción.
    - Validación de webhooks de recepción.
    - Activación de recordatorios de pago automáticos.
- [ ] **Tareas Programadas (Cron)**:
    - Validación de envío de reportes semanales automáticos.
    - Depuración automática de logs y archivos temporales.
- [ ] **Respaldo de Datos**:
    - Implementación de estrategia de backups automatizados (Local/S3).

## 💡 Fase 3: Expansión Funcional y Negocio (Mediano Plazo)
**Objetivo**: Flexibilizar el sistema para adaptarse a nuevas reglas de negocio y mejorar la experiencia de usuario.

- [ ] **Configuración Dinámica**:
    - Panel para configurar tarifas y tasas sin tocar código (actualmente hardcoded en lógica de Tarifas Fijas).
    - Editor de plantillas de mensajes desde el panel admin.
- [ ] **Herramientas de Venta**:
    - Simulador/Cotizador de préstamos público o para asesores.
    - Comparador de métodos (Interés vs Tarifa Fija) visual.
- [ ] **Expansión de Pagos**:
    - Integración con pasarelas adicionales (Stripe/MercadoPago) si se requiere.

## 🔮 Fase 4: Inteligencia y Escalabilidad (Largo Plazo)
**Objetivo**: Incorporar tecnologías avanzadas para predicción y manejo de alto volumen.

- [ ] **IA & Analytics**:
    - Scoring predictivo de morosidad (Modelo ML básico).
    - Chatbot de atención al cliente (Consulta de saldo, fechas de pago).
- [ ] **Infraestructura Avanzada**:
    - Auto-scaling horizontal.
    - Balanceo de carga si el volumen de usuarios crece drásticamente.

---
*Última actualización: 05 Febrero 2026 - v1.5.0 Release*
