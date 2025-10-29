# Estructura de Menús Detallada - EscalaFin MVP
## 29 de Octubre 2025

---

## 🔴 ADMINISTRADOR - Estructura Completa

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo EscalaFin] | Dashboard | Catálogo ▼ | Operaciones ▼ |   │
│  Reportes ▼ | Comunicación ▼ | Configuración ▼ | Soporte |    │
│  [🔔] [🌙] [Avatar ▼]                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 📊 **Dashboard**
- **Ruta:** `/admin/dashboard`
- **Función:** Vista principal con KPIs y métricas

---

### 📚 **Catálogo** (Dropdown)
```
┌─ Catálogo ────────────────────┐
│  👥 Clientes                   │
│     ├─ Lista de Clientes       │  → /admin/clients
│     └─ Nuevo Cliente           │  → /admin/clients/new
│                                 │
│  👤 Usuarios                    │
│     └─ Gestión de Usuarios     │  → /admin/users
└─────────────────────────────────┘
```

---

### 💼 **Operaciones** (Dropdown)
```
┌─ Operaciones ─────────────────┐
│  💳 Préstamos                  │
│     ├─ Lista de Préstamos      │  → /admin/loans
│     ├─ Nuevo Préstamo          │  → /admin/loans/new
│     └─ Solicitudes de Crédito  │  → /admin/credit-applications
│                                 │
│  💰 Pagos                       │
│     ├─ Historial de Pagos      │  → /admin/payments
│     └─ Transacciones           │  → /admin/payments/transactions
└─────────────────────────────────┘
```

---

### 📈 **Reportes** (Dropdown)
```
┌─ Reportes ────────────────────┐
│  📊 Análisis                   │
│     ├─ Dashboard Analítico     │  → /admin/analytics
│     └─ Portfolio              │  → /admin/reports/portfolio
│                                 │
│  📞 Cobranza                    │
│     └─ Reportes de Cobranza    │  → /admin/reports/collections
│                                 │
│  📁 Documentos                  │
│     ├─ Gestión de Archivos     │  → /admin/files
│     └─ Google Drive            │  → /admin/storage
└─────────────────────────────────┘
```

---

### 💬 **Comunicación** (Dropdown)
```
┌─ Comunicación ────────────────┐
│  📱 WhatsApp                   │
│     ├─ Mensajes                │  → /admin/whatsapp/messages
│     └─ Recargas                │  → /admin/message-recharges
│                                 │
│  💭 Chat                        │
│     └─ Chatwoot                │  → /admin/chatwoot
│                                 │
│  🔔 Notificaciones              │
│     └─ Centro de Notificaciones│  → /notifications
└─────────────────────────────────┘
```

---

### ⚙️ **Configuración** (Dropdown)
```
┌─ Configuración ───────────────┐
│  🔧 Sistema                    │
│     ├─ Configuración General   │  → /admin/config
│     ├─ Módulos PWA             │  → /admin/modules
│     └─ Parámetros             │  → /admin/settings
│                                 │
│  🔌 Integraciones               │
│     └─ APIs Externas           │  → /admin/api-config
│                                 │
│  💾 Almacenamiento              │
│     └─ Google Drive            │  → /admin/storage
└─────────────────────────────────┘
```

---

### ❓ **Soporte**
- **Ruta:** `/soporte`
- **Función:** Soporte técnico y ayuda

---

## 🟡 ASESOR - Estructura Completa

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo EscalaFin] | Dashboard | Catálogo ▼ | Operaciones ▼ |   │
│  Reportes ▼ | Comunicación ▼ | Soporte | [🔔] [🌙] [Avatar ▼]  │
└─────────────────────────────────────────────────────────────────┘
```

### 📊 **Dashboard**
- **Ruta:** `/asesor/dashboard`
- **Función:** Vista principal del asesor

---

### 📚 **Catálogo** (Dropdown)
```
┌─ Catálogo ────────────────────┐
│  👥 Clientes                   │
│     ├─ Mis Clientes            │  → /asesor/clients
│     └─ Nuevo Cliente           │  → /asesor/clients/new
└─────────────────────────────────┘
```

---

### 💼 **Operaciones** (Dropdown)
```
┌─ Operaciones ─────────────────┐
│  💳 Préstamos                  │
│     ├─ Lista de Préstamos      │  → /asesor/loans
│     └─ Solicitudes de Crédito  │  → /asesor/credit-applications
│                                 │
│  💰 Pagos                       │
│     └─ Historial de Pagos      │  → /asesor/payments
└─────────────────────────────────┘
```

---

### 📈 **Reportes** (Dropdown)
```
┌─ Reportes ────────────────────┐
│  📊 Mis Métricas               │  → /asesor/reports
│  📞 Cobranza Móvil             │  → /mobile/cobranza
└─────────────────────────────────┘
```

---

### 💬 **Comunicación** (Dropdown)
```
┌─ Comunicación ────────────────┐
│  📱 WhatsApp                   │  → /asesor/whatsapp
│  🔔 Notificaciones              │  → /notifications
└─────────────────────────────────┘
```

---

### ❓ **Soporte**
- **Ruta:** `/soporte`

---

## 🟢 CLIENTE - Estructura Completa

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo EscalaFin] | Dashboard | Mis Finanzas ▼ | Documentos ▼ | │
│  Comunicación ▼ | Soporte | [🔔] [🌙] [Avatar ▼]               │
└─────────────────────────────────────────────────────────────────┘
```

### 📊 **Dashboard**
- **Ruta:** `/cliente/dashboard`
- **Función:** Panel personal del cliente

---

### 💰 **Mis Finanzas** (Dropdown)
```
┌─ Mis Finanzas ────────────────┐
│  💳 Préstamos                  │
│     ├─ Mis Préstamos Activos   │  → /cliente/loans
│     └─ Nueva Solicitud         │  → /cliente/credit-applications
│                                 │
│  💵 Pagos                       │
│     ├─ Realizar Pago           │  → /cliente/payments
│     └─ Historial               │  → /cliente/payments/history
└─────────────────────────────────┘
```

---

### 📁 **Documentos** (Dropdown)
```
┌─ Documentos ──────────────────┐
│  📄 Mis Documentos             │  → /cliente/documents
│  📋 Contratos                  │  → /cliente/contracts
│  📊 Estados de Cuenta          │  → /cliente/statements
└─────────────────────────────────┘
```

---

### 💬 **Comunicación** (Dropdown)
```
┌─ Comunicación ────────────────┐
│  🔔 Notificaciones              │  → /notifications
│  💭 Chat con Asesor            │  → /cliente/chat
└─────────────────────────────────┘
```

---

### ❓ **Soporte**
- **Ruta:** `/soporte`

---

## 📱 VERSIÓN MÓVIL - Sidebar Colapsable

### Estructura para todos los roles:

```
╔═══════════════════════════════╗
║   [Avatar] Juan Pérez         ║
║   🔵 Administrador            ║
╠═══════════════════════════════╣
║ 📊 PRINCIPAL                  ║
║   └─ Dashboard                ║
║                               ║
║ 📚 CATÁLOGO                   ║
║   ├─► Clientes                ║
║   │   ├─ Lista                ║
║   │   └─ Nuevo                ║
║   └─► Usuarios                ║
║                               ║
║ 💼 OPERACIONES                ║
║   ├─► Préstamos               ║
║   │   ├─ Lista                ║
║   │   ├─ Nuevo                ║
║   │   └─ Solicitudes          ║
║   └─► Pagos                   ║
║       ├─ Historial            ║
║       └─ Transacciones        ║
║                               ║
║ 📈 REPORTES                   ║
║   ├─► Análisis                ║
║   ├─► Cobranza                ║
║   └─► Documentos              ║
║                               ║
║ 💬 COMUNICACIÓN               ║
║   ├─► WhatsApp                ║
║   ├─► Chat                    ║
║   └─► Notificaciones          ║
║                               ║
║ ⚙️ CONFIGURACIÓN              ║
║   ├─► Sistema                 ║
║   ├─► Integraciones           ║
║   └─► Almacenamiento          ║
║                               ║
║ ❓ SOPORTE                    ║
╠═══════════════════════════════╣
║ 👤 Mi Perfil                  ║
║ 🚪 Cerrar Sesión              ║
╚═══════════════════════════════╝
```

---

## 🎨 CARACTERÍSTICAS DE DISEÑO

### Desktop:
- **Barra Superior Fija**: Siempre visible
- **Hover State**: Resalta al pasar el mouse
- **Active State**: Indica sección actual
- **Dropdown con Shadow**: Elegante y profesional

### Mobile:
- **Sidebar Deslizable**: Desde la derecha
- **Acordeones**: Para expandir/colapsar submenús
- **Touch-Friendly**: Áreas de click amplias
- **Scroll Interno**: Para menús largos

---

## 🔒 CONTROL DE ACCESO

| Menú          | ADMIN | ASESOR | CLIENTE |
|---------------|-------|--------|---------|
| Dashboard     | ✅    | ✅     | ✅      |
| Catálogo      | ✅    | ✅     | ❌      |
| Operaciones   | ✅    | ✅     | Limitado|
| Reportes      | ✅    | Limitado| ❌     |
| Comunicación  | ✅    | Limitado| Limitado|
| Configuración | ✅    | ❌     | ❌      |
| Soporte       | ✅    | ✅     | ✅      |

---

## ✅ IMPLEMENTACIÓN

### Orden de Prioridad:

1. **Desktop Navbar** (ALTA)
   - Estructura de menús dropdown
   - Estilos y animaciones
   - Control de permisos

2. **Mobile Sidebar** (ALTA)
   - Sidebar colapsable
   - Acordeones para submenús
   - Responsive design

3. **Optimizaciones** (MEDIA)
   - Transiciones suaves
   - Indicadores visuales
   - Badges de notificación

4. **Testing** (ALTA)
   - Pruebas en diferentes dispositivos
   - Validación de permisos
   - UX testing

---

**Fecha:** 29 de Octubre 2025  
**Versión:** 1.0 Detallada  
**Estado:** Listo para Implementación

