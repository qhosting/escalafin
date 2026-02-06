# EscalaFin - Desarrollo Local con Docker

## 🚀 Setup Rápido

### Opción 1: Script Automático (Recomendado)

**Windows (PowerShell):**
```powershell
.\setup-local.ps1
```

**Linux/Mac:**
```bash
chmod +x setup-local.sh
./setup-local.sh
```

### Opción 2: Manual

1. **Copiar configuración local:**
   ```bash
   cp .env.local app/.env
   ```

2. **Levantar base de datos:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Instalar dependencias y configurar Prisma:**
   ```bash
   cd app
   npm install
   npx prisma generate
   npx prisma db push
   npx ts-node scripts/migrate-to-multitenancy.ts
   npx prisma db seed
   ```

4. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

## 🐳 Comandos Docker Útiles

### Ver logs de la base de datos:
```bash
docker-compose -f docker-compose.dev.yml logs -f postgres
```

### Detener servicios:
```bash
docker-compose -f docker-compose.dev.yml down
```

### Limpiar todo (⚠️ Elimina datos):
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### Conectar a PostgreSQL:
```bash
docker exec -it escalafin-postgres-dev psql -U escalafin -d escalafin_db
```

### Conectar a Redis:
```bash
docker exec -it escalafin-redis-dev redis-cli
```

## 📦 Deploy Completo con Docker (Producción Local)

Para probar el build completo de producción:

```bash
docker-compose up --build
```

Esto levantará:
- PostgreSQL en puerto 5432
- Redis en puerto 6379
- Aplicación Next.js en puerto 3000

## 🔧 Prisma Studio

Para explorar la base de datos visualmente:

```bash
cd app
npx prisma studio
```

Se abrirá en `http://localhost:5555`

## 🏢 Multi-tenancy en Local

Para probar diferentes tenants en local, puedes:

1. **Usar headers:** Agrega `x-tenant-slug: nombre-tenant` en tus requests.
2. **Modificar /etc/hosts (Linux/Mac) o C:\Windows\System32\drivers\etc\hosts (Windows):**
   ```
   127.0.0.1 tenant1.localhost
   127.0.0.1 tenant2.localhost
   ```

## 📝 Notas

- La base de datos local usa credenciales by default: `escalafin/password`
- Los datos persisten en volúmenes de Docker
- El archivo `.env.local` contiene toda la configuración necesaria
- Para producción, usa las variables de entorno reales en un archivo `.env.production`
