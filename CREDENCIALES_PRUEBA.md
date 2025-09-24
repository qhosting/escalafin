
# 🔐 Credenciales de Prueba - EscalaFin

## ✅ Credenciales Activas

Se han creado/actualizado los siguientes usuarios de prueba para el sistema:

### 👨‍💼 **ADMINISTRADOR**
- **Email:** `admin@escalafin.com`
- **Contraseña:** `admin123`
- **Rol:** ADMIN
- **Permisos:** Acceso completo al sistema

### 👔 **ASESOR**
- **Email:** `asesor@escalafin.com`
- **Contraseña:** `asesor123`
- **Rol:** ASESOR  
- **Permisos:** Gestión de clientes y préstamos

### 👤 **CLIENTE**
- **Email:** `cliente@escalafin.com`
- **Contraseña:** `cliente123`
- **Rol:** CLIENTE
- **Permisos:** Vista de cliente (préstamos y pagos propios)

## 🚀 **Cómo Usar**

1. Ve a: `https://escalafin-escalafin-mvp.vnap16.easypanel.host/auth/login`
2. Usa cualquiera de las credenciales de arriba
3. Serás redirigido automáticamente al dashboard correspondiente según tu rol

## 📊 **Estadísticas del Sistema**
- **Total de usuarios:** 9
- **Administradores:** 2
- **Asesores:** 4
- **Clientes:** 3

## 🔧 **Para Desarrolladores**

Si necesitas crear más usuarios de prueba, ejecuta:
```bash
cd /home/ubuntu/escalafin_mvp/app
npx tsx scripts/create-test-users.ts
```

## ⚠️ **Importante**

- Estas credenciales son **solo para pruebas**
- En producción, cambiar todas las contraseñas por defecto
- Eliminar o deshabilitar usuarios de prueba antes del despliegue final

---
*Generado automáticamente el 24 de septiembre de 2025*
