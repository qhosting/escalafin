
# EscalaFin MVP - Sistema de Gestión de Préstamos y Créditos

![EscalaFin Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Delfin_logo_2020.png/330px-Delfin_logo_2020.png)

## 📋 Descripción

EscalaFin es un sistema integral de gestión de préstamos y créditos diseñado para instituciones financieras. Proporciona herramientas completas para la administración de clientes, evaluación crediticia, gestión de préstamos, cobros y notificaciones.

### ✨ Características Principales

- 🏢 **Gestión Multi-rol**: Admin, Asesor y Cliente
- 📊 **Dashboard Inteligente**: Métricas y KPIs en tiempo real
- 💳 **Workflow de Solicitudes**: Proceso completo de evaluación crediticia
- 💰 **Gestión de Préstamos**: Control completo del ciclo de vida
- 📱 **Módulo Móvil de Cobranza**: Herramientas para gestores de cobranza
- 🔔 **Notificaciones WhatsApp**: Integración con EvolutionAPI
- 💳 **Pagos en Línea**: Integración con Openpay
- 📄 **Exportación de Reportes**: PDF y Excel
- 🌙 **Modo Oscuro**: Experiencia de usuario personalizable
- 📁 **Gestión de Archivos**: Almacenamiento en la nube

## 🚀 Tecnologías Utilizadas

### Frontend
- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos
- **Shadcn/ui** - Biblioteca de componentes
- **Framer Motion** - Animaciones
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

### Backend
- **Node.js** - Runtime de JavaScript
- **Prisma ORM** - Gestor de base de datos
- **PostgreSQL** - Base de datos principal
- **NextAuth.js** - Autenticación
- **JWT** - Tokens de sesión

### Integraciones
- **Openpay** - Procesamiento de pagos
- **EvolutionAPI** - Notificaciones WhatsApp
- **AWS S3** - Almacenamiento de archivos
- **Chart.js/Recharts** - Gráficos y visualizaciones

## 🏗️ Arquitectura del Sistema

```
EscalaFin MVP/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticación
│   ├── admin/             # Dashboard Administrativo
│   ├── asesor/            # Dashboard Asesor
│   ├── cliente/           # Portal del Cliente
│   └── mobile/            # Módulo Móvil
├── components/            # Componentes React
│   ├── ui/               # Componentes base (Shadcn)
│   ├── dashboards/       # Dashboards específicos
│   ├── loans/            # Gestión de préstamos
│   ├── clients/          # Gestión de clientes
│   └── payments/         # Sistema de pagos
├── lib/                  # Utilidades y configuración
│   ├── api/              # Funciones API
│   ├── auth.ts           # Configuración NextAuth
│   ├── db.ts             # Cliente Prisma
│   └── utils.ts          # Utilidades generales
├── prisma/               # Esquema y migraciones
└── public/               # Recursos estáticos
```

## 📊 Base de Datos

### Esquema Principal

```prisma
model User {
  id          String     @id @default(cuid())
  name        String?
  email       String     @unique
  role        UserRole   @default(CLIENTE)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Client {
  id              String           @id @default(cuid())
  name            String
  email           String           @unique
  phone           String?
  documentType    DocumentType
  documentNumber  String           @unique
  address         String?
  city            String?
  occupation      String?
  monthlyIncome   Float?
  creditScore     Int?
  status          ClientStatus     @default(ACTIVO)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

model Loan {
  id                  String         @id @default(cuid())
  loanNumber          String         @unique
  clientId            String
  advisorId           String?
  loanType            LoanType
  amount              Float
  interestRate        Float
  termMonths          Int
  monthlyPayment      Float
  startDate           DateTime
  endDate             DateTime
  status              LoanStatus     @default(PENDING)
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
}
```

## ⚡ Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- PostgreSQL 14+
- Yarn package manager

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/escalafin-mvp.git
cd escalafin-mvp/app
```

### 2. Instalar Dependencias

```bash
yarn install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `app/`:

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/escalafin_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-key-aqui"

# Openpay (Pagos)
OPENPAY_MERCHANT_ID="tu-merchant-id"
OPENPAY_PRIVATE_KEY="tu-private-key"
OPENPAY_PUBLIC_KEY="tu-public-key"
OPENPAY_SANDBOX="true"

# WhatsApp (EvolutionAPI)
EVOLUTIONAPI_BASE_URL="https://tu-evolution-api.com"
EVOLUTIONAPI_API_KEY="tu-api-key"
EVOLUTIONAPI_INSTANCE_NAME="EscalaFin"

# Almacenamiento (AWS S3)
AWS_BUCKET_NAME="escalafin-files"
AWS_FOLDER_PREFIX="uploads/"
AWS_ACCESS_KEY_ID="tu-access-key"
AWS_SECRET_ACCESS_KEY="tu-secret-key"
AWS_REGION="us-east-1"

# LLM APIs (Opcional)
ABACUSAI_API_KEY="tu-api-key"
```

### 4. Configurar Base de Datos

```bash
# Generar cliente Prisma
yarn prisma generate

# Ejecutar migraciones
yarn prisma db push

# Poblar datos de prueba
yarn prisma db seed
```

### 5. Ejecutar en Desarrollo

```bash
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

## 👥 Usuarios de Prueba

Una vez ejecutado el seeding, tendrás acceso a estos usuarios:

### Administrador
- **Email**: `admin@escalafin.com`
- **Contraseña**: `admin123`

### Asesor
- **Email**: `asesor@escalafin.com`
- **Contraseña**: `asesor123`

### Cliente
- **Email**: `cliente@escalafin.com`
- **Contraseña**: `cliente123`

## 🔧 Configuraciones Adicionales

### Configurar Openpay

1. Regístrate en [Openpay](https://www.openpay.mx)
2. Obtén tus credenciales de Sandbox/Producción
3. Configura el webhook: `https://tu-dominio.com/api/webhooks/openpay`

### Configurar EvolutionAPI (WhatsApp)

1. Instala EvolutionAPI en tu servidor
2. Crea una instancia para EscalaFin
3. Obtén el API Key y configura las variables de entorno

### Configurar AWS S3

1. Crea un bucket en AWS S3
2. Configura las políticas de acceso
3. Obtén las credenciales de acceso

## 📱 Funcionalidades por Rol

### 👨‍💼 Administrador
- Dashboard con métricas generales
- Gestión completa de usuarios
- Configuración de parámetros del sistema
- Reportes y analytics
- Configuración de notificaciones WhatsApp
- Gestión de asesores y clientes

### 👨‍💻 Asesor
- Dashboard personalizado con su cartera
- Gestión de sus clientes asignados
- Workflow de solicitudes de crédito
- Creación y seguimiento de préstamos
- Módulo de cobranza móvil
- Reportes de su cartera

### 👤 Cliente
- Portal personal con información de préstamos
- Historial de pagos
- Solicitudes de crédito
- Estado de cuenta
- Pagos en línea
- Notificaciones automáticas

## 📊 Módulos Principales

### 1. Gestión de Clientes
- Registro y actualización de información
- Evaluación crediticia automatizada
- Historial crediticio
- Referencias personales y comerciales

### 2. Workflow de Solicitudes
- Proceso estructurado de solicitud
- Evaluación automática con scoring
- Documentación requerida
- Aprobación/rechazo con comentarios

### 3. Gestión de Préstamos
- Configuración de productos financieros
- Cálculo automático de cuotas
- Generación de tabla de amortización
- Seguimiento del estado del préstamo

### 4. Sistema de Pagos
- Integración con Openpay
- Múltiples métodos de pago
- Reconciliación automática
- Historial detallado

### 5. Módulo de Cobranza
- Gestión de cartera vencida
- Herramientas móviles para gestores
- Registro de gestiones
- Planes de pago personalizados

### 6. Notificaciones WhatsApp
- Confirmaciones de pago
- Recordatorios de vencimiento
- Notificaciones de estado
- Mensajes personalizados

## 🚀 Deploy en Producción

### Con Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático desde main branch

### Con Docker

```dockerfile
# Usa la imagen base de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia package.json y yarn.lock
COPY package.json yarn.lock ./

# Instala dependencias
RUN yarn install --frozen-lockfile

# Copia el código fuente
COPY . .

# Genera el cliente Prisma
RUN yarn prisma generate

# Construye la aplicación
RUN yarn build

# Expone el puerto
EXPOSE 3000

# Comando de inicio
CMD ["yarn", "start"]
```

### Variables de Entorno en Producción

Asegúrate de configurar todas las variables de entorno necesarias:

- `DATABASE_URL` - URL de PostgreSQL en producción
- `NEXTAUTH_URL` - URL de tu aplicación en producción
- `NEXTAUTH_SECRET` - Secret key segura para producción
- Todas las claves de APIs externas

## 📈 Métricas y Monitoreo

### Dashboard Analytics
- Total de clientes activos
- Cartera total
- Pagos del mes
- Índice de morosidad
- Conversión de solicitudes

### KPIs Principales
- Tasa de aprobación
- Tiempo promedio de evaluación
- ROI por asesor
- Satisfacción del cliente
- Eficiencia de cobranza

## 🔐 Seguridad

### Medidas Implementadas
- Autenticación JWT con NextAuth.js
- Encriptación de contraseñas con bcrypt
- Validación de inputs con Zod
- Rate limiting en APIs críticas
- Logs de auditoría
- Tokens seguros para APIs externas

### Mejores Prácticas
- Nunca exponer API keys en el frontend
- Usar HTTPS en producción
- Implementar CSP headers
- Validar todos los inputs del usuario
- Mantener dependencias actualizadas

## 🧪 Testing

```bash
# Ejecutar tests unitarios
yarn test

# Ejecutar tests de integración
yarn test:integration

# Coverage report
yarn test:coverage
```

## 📚 API Documentation

### Endpoints Principales

#### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/session` - Obtener sesión actual

#### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Crear cliente
- `GET /api/clients/[id]` - Obtener cliente
- `PUT /api/clients/[id]` - Actualizar cliente
- `DELETE /api/clients/[id]` - Eliminar cliente

#### Préstamos
- `GET /api/loans` - Listar préstamos
- `POST /api/loans` - Crear préstamo
- `GET /api/loans/[id]` - Obtener préstamo
- `PUT /api/loans/[id]` - Actualizar préstamo

#### Pagos
- `GET /api/payments` - Historial de pagos
- `POST /api/payments` - Procesar pago
- `POST /api/webhooks/openpay` - Webhook de Openpay

## 🤝 Contribuir

### Setup para Desarrollo

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Convenciones de Código
- Usar TypeScript para todo el código
- Seguir las convenciones de ESLint y Prettier
- Escribir tests para nuevas funcionalidades
- Documentar cambios en el CHANGELOG

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:

- 📧 Email: soporte@escalafin.com
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/escalafin-mvp/issues)
- 📖 Documentación: [Wiki del Proyecto](https://github.com/tu-usuario/escalafin-mvp/wiki)

## 🗓️ Roadmap

### Fase 1 ✅ (Completada)
- Sistema base de autenticación
- Dashboards principales
- Gestión básica de clientes y préstamos
- Integración con Openpay

### Fase 2a ✅ (Completada)
- Workflow de solicitudes de crédito
- Sistema de scoring crediticio
- Evaluación automatizada
- Documentación requerida

### Fase 2b ✅ (Completada)
- Sistema de notificaciones in-app
- Modo oscuro
- Exportación de reportes
- Validaciones mejoradas
- Gestión de archivos

### Fase 3 ✅ (Completada)
- Integración WhatsApp con EvolutionAPI
- Módulo móvil de cobranza
- Pagos en efectivo
- Dashboards optimizados

### Fase 4 (Próximamente)
- App móvil nativa
- Inteligencia artificial para scoring
- Integración con bureaus de crédito
- Analytics avanzados
- Multi-tenancy

---

**EscalaFin MVP** - Transformando la gestión financiera con tecnología moderna 🚀

