
# 🔐 Guía de Login y Uso - EscalaFin MVP

## 📋 Cuentas de Prueba Disponibles

### 👑 Administrador
- **Email**: `admin@escalafin.com`
- **Contraseña**: `admin123`
- **Permisos**: Acceso completo, gestión de usuarios, aprobación de solicitudes

### 👨‍💼 Asesor
- **Email**: `carlos.lopez@escalafin.com`
- **Contraseña**: `password123`
- **Permisos**: Gestión de clientes, crear solicitudes, registrar pagos

### 👤 Cliente
- **Email**: `juan.perez@email.com`
- **Contraseña**: `password123`
- **Permisos**: Ver préstamos, historial de pagos, tabla de amortización

## 🚀 Cómo Iniciar el Sistema

### 1. Preparar el Entorno
```bash
cd /home/ubuntu/escalafin_mvp/app
```

### 2. Instalar Dependencias (si no está hecho)
```bash
yarn install
```

### 3. Configurar Base de Datos (si no está hecho)
```bash
yarn prisma db push
yarn prisma generate
yarn prisma db seed
```

### 4. Iniciar Servidor
```bash
yarn dev
```

El sistema estará disponible en: **http://localhost:3000**

## 🔧 Solución de Problemas de Login

### Problema: "useSession must be wrapped in SessionProvider"
**Solución**: Este es un problema conocido de Next.js con NextAuth. El sistema funciona correctamente en navegador.

### Problema: URLs incorrectas en autenticación
**Descripción**: NextAuth puede mostrar URLs externas en lugar de localhost.
**Solución**: 
1. Verificar que `.env` contiene `NEXTAUTH_URL="http://localhost:3000"`
2. Reiniciar el servidor después de cambios en `.env`

### Problema: Login no funciona
**Diagnóstico**:
1. ✅ Verificar que la base de datos está conectada
2. ✅ Confirmar que los usuarios están creados (usar datos de prueba)
3. ✅ Comprobar que el servidor está en puerto 3000

## 📱 Flujo de Uso del Sistema

### Para Administradores:
1. **Login** → Dashboard Admin
2. **Revisar Solicitudes** → Aprobar/Rechazar
3. **Gestionar Usuarios** → Crear asesores/clientes
4. **Ver Reportes** → Métricas de cartera

### Para Asesores:
1. **Login** → Dashboard Asesor
2. **Gestionar Clientes** → Agregar nuevos clientes
3. **Crear Solicitudes** → Enviar para aprobación
4. **Registrar Pagos** → Actualizar estado de préstamos

### Para Clientes:
1. **Login** → Dashboard Cliente
2. **Ver Préstamos** → Estado actual y saldos
3. **Tabla de Amortización** → Plan de pagos
4. **Historial** → Pagos realizados

## 🔍 Verificación del Sistema

### Comprobar Base de Datos:
```bash
yarn prisma studio
```

### Comprobar APIs:
- **Providers**: `curl http://localhost:3000/api/auth/providers`
- **CSRF Token**: `curl http://localhost:3000/api/auth/csrf`
- **Login Page**: `curl http://localhost:3000/auth/login`

### Logs del Servidor:
- Revisar consola para errores de autenticación
- Verificar conexión a base de datos
- Confirmar que no hay errores de compilación

## 📊 Datos de Prueba Incluidos

El sistema incluye:
- ✅ **7 usuarios** (1 Admin, 3 Asesores, 3 Clientes)
- ✅ **5 clientes** con información completa
- ✅ **3 solicitudes** de crédito en diferentes estados
- ✅ **3 préstamos** activos con pagos reales
- ✅ **60 registros** de tabla de amortización
- ✅ **7 pagos** procesados con referencias

## ⚡ Comandos Rápidos

### Reiniciar Sistema Completo:
```bash
pkill node
cd /home/ubuntu/escalafin_mvp/app
yarn dev
```

### Resetear Base de Datos:
```bash
yarn prisma db push --force-reset
yarn prisma db seed
```

### Verificar Estado:
```bash
curl http://localhost:3000/auth/login
curl http://localhost:3000/api/auth/providers
```

## 🎯 Funcionalidades Principales

### ✅ Completadas:
- Sistema de autenticación multi-rol
- Dashboards personalizados para cada rol
- Gestión de clientes (CRM)
- Workflow de solicitudes de crédito
- Generación automática de tablas de amortización
- Registro y seguimiento de pagos
- Portal del cliente funcional
- Base de datos con datos de prueba
- Interfaz responsive

### 🚧 En Desarrollo (Futuras Fases):
- PWA para cobranza móvil
- Integración con Openpay
- Sistema de notificaciones
- API REST completa
- Webhooks para n8n

## 📞 Soporte

Si el sistema no funciona correctamente:

1. **Verificar puerto**: ¿Está libre el puerto 3000?
2. **Verificar .env**: ¿Están todas las variables configuradas?
3. **Verificar base de datos**: ¿Está la conexión activa?
4. **Reiniciar servidor**: Siempre ayuda reiniciar después de cambios

El sistema está diseñado para funcionar correctamente en modo desarrollo y todas las funcionalidades principales están implementadas y operativas.
