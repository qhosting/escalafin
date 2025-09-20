
# 🚀 Quick Start - EscalaFin

## ⚡ Inicio Rápido en 5 Minutos

### 1. Clonar y Configurar
```bash
git clone <repository-url>
cd escalafin_mvp/app
yarn install
cp .env.example .env
```

### 2. Configurar Base de Datos
```bash
# Editar .env con tu DATABASE_URL
yarn prisma db push
yarn prisma db seed
```

### 3. Iniciar Aplicación
```bash
yarn dev
```

### 4. Acceder al Sistema
```
URL: http://localhost:3000

👤 Admin: admin@escalafin.com / admin123
👤 Asesor: asesor@escalafin.com / asesor123  
👤 Cliente: cliente@escalafin.com / cliente123
```

## 🎯 Flujo de Prueba Rápida

### Como Admin:
1. Login → Dashboard con métricas
2. Ir a Clientes → Ver lista de clientes
3. Ir a Préstamos → Ver préstamos activos
4. Ir a Analytics → Ver reportes avanzados

### Como Asesor:
1. Login → Dashboard personal
2. Crear nuevo cliente
3. Crear nueva solicitud de préstamo
4. Ir a Cobro Móvil → Simular cobro

### Como Cliente:
1. Login → Dashboard personal
2. Ver saldo actual
3. Ver historial de pagos
4. Solicitar nuevo préstamo

## 🔧 Configuraciones Rápidas

### Openpay (Pagos)
```env
OPENPAY_MERCHANT_ID="demo_merchant"
OPENPAY_PRIVATE_KEY="demo_private_key"
OPENPAY_BASE_URL="https://sandbox-api.openpay.mx/v1"
```

### AWS S3 (Archivos)
```bash
# Inicializar automáticamente
yarn prisma db seed
```

### WhatsApp (Opcional)
```env
EVOLUTION_API_URL="https://tu-api.com"
EVOLUTION_API_TOKEN="tu_token"
```

## 🚀 Despliegue Rápido

### Easypanel:
1. Push código a GitHub
2. Crear app en Easypanel
3. Conectar repo → Auto-deploy
4. Configurar variables de entorno
5. ¡Listo!

### Docker:
```bash
docker build -t escalafin .
docker run -p 3000:3000 escalafin
```

## 📞 Ayuda Rápida

**¿Problemas?** Consulta:
- `README.md` - Documentación completa
- `DEPLOYMENT_GUIDE.md` - Guía de despliegue
- `DEEPAGENT_CONTINUATION_GUIDE.md` - Para continuar desarrollo

**¡EscalaFin listo en minutos!** 🎉
