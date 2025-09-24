
# 🖥️ Guía de Testing Manual de UI - EscalaFin MVP

## 📋 Checklist de Testing por Perfil

### 🚀 Preparación
1. **Servidor activo**: Verificar que `http://localhost:3000` esté funcionando
2. **Base de datos**: Confirmar que los datos de prueba estén cargados
3. **Navegador**: Usar Chrome/Firefox con DevTools abierto
4. **Credenciales**: Tener a mano las credenciales de cada perfil

---

## 👑 TESTING PERFIL ADMINISTRADOR

### Login y Acceso
- [ ] **URL**: `http://localhost:3000/auth/login`
- [ ] **Credenciales**: `admin@escalafin.com` / `admin123`
- [ ] **Redirección**: Debe ir a `/admin/dashboard`
- [ ] **Navegación**: Sidebar visible con todos los módulos de admin

### Dashboard Administrativo
- [ ] **KPIs principales**: Métricas numéricas visibles
- [ ] **Gráficos**: Charts.js o similares funcionando
- [ ] **Información actual**: Datos reales del sistema
- [ ] **Responsive**: Funciona en mobile/tablet
- [ ] **Tema**: Toggle dark/light funcional

### Gestión de Usuarios
- [ ] **Acceder**: Navegación desde sidebar
- [ ] **Listar usuarios**: Tabla con todos los usuarios
- [ ] **Buscar/Filtrar**: Funcionalidad de búsqueda
- [ ] **Crear usuario**: Modal/página de creación
  - [ ] Validación de campos
  - [ ] Selección de rol
  - [ ] Confirmación de contraseña
- [ ] **Editar usuario**: Modificar datos existentes
- [ ] **Eliminar usuario**: Con confirmación
- [ ] **Cambiar estado**: Activar/desactivar usuarios

### Gestión de Solicitudes de Crédito
- [ ] **Listar solicitudes**: Todas las solicitudes del sistema
- [ ] **Filtrar por estado**: Pendiente, Aprobada, Rechazada
- [ ] **Ver detalles**: Modal con información completa
- [ ] **Aprobar solicitud**: 
  - [ ] Cambio de estado
  - [ ] Creación automática de préstamo
  - [ ] Notificaciones
- [ ] **Rechazar solicitud**:
  - [ ] Comentarios obligatorios
  - [ ] Cambio de estado
  - [ ] Notificación al asesor/cliente

### Gestión de Préstamos
- [ ] **Vista general**: Todos los préstamos del sistema
- [ ] **Detalles del préstamo**: Información completa
- [ ] **Tabla de amortización**: Cálculos correctos
- [ ] **Historial de pagos**: Pagos realizados
- [ ] **Modificar estado**: Cambios de estado manual
- [ ] **Generar reportes**: Exportación de datos

### Configuración del Sistema
- [ ] **Parámetros generales**: Edición de configuraciones
- [ ] **Límites de préstamo**: Montos mín/máx
- [ ] **Tipos de interés**: Configuración de rates
- [ ] **Usuarios y roles**: Gestión de permisos

---

## 👨‍💼 TESTING PERFIL ASESOR

### Login y Acceso
- [ ] **Credenciales**: `carlos.lopez@escalafin.com` / `password123`
- [ ] **Redirección**: Debe ir a `/asesor/dashboard`
- [ ] **Limitaciones**: No debe ver módulos de admin
- [ ] **Navegación**: Solo opciones permitidas para asesor

### Dashboard de Asesor
- [ ] **Sus métricas**: Solo datos de sus clientes
- [ ] **Clientes asignados**: Lista de sus clientes
- [ ] **Préstamos activos**: De sus clientes únicamente
- [ ] **Tareas pendientes**: Solicitudes, pagos por procesar

### Gestión de Clientes
- [ ] **Sus clientes**: Solo clientes asignados a él
- [ ] **Crear cliente**: Formulario completo
  - [ ] Información personal
  - [ ] Información laboral
  - [ ] Información financiera
  - [ ] Asignación automática a él
- [ ] **Editar cliente**: Solo sus clientes
- [ ] **No puede eliminar**: Restricción correcta
- [ ] **Ver historial**: Préstamos y pagos del cliente

### Solicitudes de Crédito
- [ ] **Crear solicitud**: Para sus clientes
  - [ ] Selección de cliente (solo suyos)
  - [ ] Tipos de préstamo
  - [ ] Cálculos automáticos
  - [ ] Envío para aprobación
- [ ] **Ver sus solicitudes**: Solo las que él creó
- [ ] **Editar pendientes**: Solo antes de enviar
- [ ] **No puede aprobar**: Restricción correcta

### Gestión de Pagos
- [ ] **Registrar pagos**: De sus clientes
- [ ] **Métodos de pago**: Efectivo, transferencia
- [ ] **Validación**: Referencias obligatorias
- [ ] **Actualización automática**: Saldos y estados
- [ ] **Historial**: Solo pagos de sus clientes

---

## 👤 TESTING PERFIL CLIENTE

### Login y Acceso
- [ ] **Credenciales**: `juan.perez@email.com` / `password123`
- [ ] **Redirección**: Debe ir a `/cliente/dashboard`
- [ ] **Vista limitada**: Solo sus datos personales
- [ ] **Navegación mínima**: Opciones básicas únicamente

### Dashboard de Cliente
- [ ] **Sus préstamos**: Solo los préstamos de este cliente
- [ ] **Saldos actuales**: Información actualizada
- [ ] **Próximos pagos**: Fechas y montos
- [ ] **Estado de cuenta**: Resumen personal

### Sus Préstamos
- [ ] **Lista de préstamos**: Solo los suyos
- [ ] **Detalles completos**: Información del préstamo
- [ ] **Solo lectura**: No puede modificar nada
- [ ] **Información clara**: Montos, plazos, tasas

### Tabla de Amortización
- [ ] **Ver tabla completa**: Todos los pagos programados
- [ ] **Pagos realizados**: Marcados como pagados
- [ ] **Próximos pagos**: Fechas claras
- [ ] **Cálculos correctos**: Matemáticas precisas
- [ ] **Export/Print**: Si está disponible

### Historial de Pagos
- [ ] **Pagos realizados**: Solo sus pagos
- [ ] **Referencias**: Números de transacción
- [ ] **Fechas y montos**: Información precisa
- [ ] **Métodos de pago**: Cómo se realizaron

### Perfil Personal
- [ ] **Ver información**: Sus datos personales
- [ ] **Editar limitado**: Solo algunos campos
- [ ] **Cambiar contraseña**: Funcionalidad de seguridad
- [ ] **No puede ver otros**: Restricción correcta

---

## 🔍 Puntos Críticos de Testing

### Seguridad
- [ ] **Roles correctos**: Cada usuario ve solo lo permitido
- [ ] **No escalación**: No se puede acceder a funciones superiores
- [ ] **Datos aislados**: Cada usuario ve solo sus datos
- [ ] **Sesiones**: Logout funcional

### Funcionalidad
- [ ] **Cálculos**: Matemáticas de préstamos correctas
- [ ] **Estados**: Flujos de estado correctos
- [ ] **Validaciones**: Campos requeridos funcionan
- [ ] **Errores**: Mensajes informativos

### UI/UX
- [ ] **Responsive**: Funciona en todos los dispositivos
- [ ] **Navegación**: Intuitiva y clara
- [ ] **Loading states**: Indicadores de carga
- [ ] **Feedback**: Confirmaciones y notificaciones

### Performance
- [ ] **Velocidad**: Páginas cargan < 3 segundos
- [ ] **Optimización**: Imágenes y assets optimizados
- [ ] **Base de datos**: Queries eficientes
- [ ] **Memory**: Sin memory leaks

---

## 🐛 Reporte de Bugs

### Formato de Reporte
```
**Bug ID**: [FECHA]-[NUMERO]
**Módulo**: [Admin/Asesor/Cliente]
**Página**: [URL específica]
**Descripción**: [Qué debería pasar vs qué pasa]
**Pasos para reproducir**:
1. Paso 1
2. Paso 2
3. Paso 3
**Severidad**: [Alta/Media/Baja]
**Browser**: [Chrome/Firefox/Safari]
**Screenshots**: [Si aplica]
```

### Seguimiento
- [ ] **Bug reportado**
- [ ] **Fix implementado**
- [ ] **Re-testing realizado**
- [ ] **Verificación final**

---

**🎯 Objetivo**: 100% de las funcionalidades críticas deben pasar  
**📊 Métricas**: Al menos 95% de funcionalidades totales deben ser funcionales  
**🚀 Ready for Production**: Cuando todos los tests críticos pasen
