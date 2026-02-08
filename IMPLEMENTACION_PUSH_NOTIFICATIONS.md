# Implementación de Notificaciones Push PWA

## Resumen de Cambios

Se ha implementado el sistema completo de Notificaciones Push nativas para la PWA de EscalaFin. Esto incluye cambios en base de datos, backend API, service worker y frontend.

### 1. Base de Datos (Schema)
Se agregaron dos nuevos modelos en `schema.prisma`:
- **PushSubscription**: Almacena las suscripciones de los dispositivos (endpoint, auth keys) vinculadas a un usuario.
- **UserNotificationSetting**: Permite a los usuarios configurar qué tipos de notificaciones desean recibir y por qué canal (PUSH, EMAIL, etc.).

### 2. Backend (API & Lib)
- **Generación de Llaves VAPID**: Se creó el script `scripts/setup-vapid.js` que generó y configuró las llaves `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` en el archivo `.env`.
- **`lib/push-notifications.ts`**: Utilidad para enviar notificaciones usando `web-push`. Maneja la limpieza automática de suscripciones inválidas (410 Gone).
- **`lib/scheduled-tasks.ts`**: Se agregó el método `processScheduledPushNotifications` para procesar y enviar notificaciones programadas.
- **API Routes**:
  - `POST /api/notifications/push/subscribe`: Guarda la suscripción del dispositivo.
  - `GET /api/notifications/settings`: Obtiene las preferencias del usuario.
  - `PUT /api/notifications/settings`: Actualiza las preferencias del usuario.

### 3. Frontend (PWA & UI)
- **Service Worker (`sw.js`)**: Actualizado para soportar payloads JSON en las notificaciones push, permitiendo títulos, cuerpos, iconos y URLs dinámicas, así como mejor manejo de clics (abrir o enfocar ventana).
- **Hook `usePushNotifications`**: Hook de React para gestionar la suscripción (solicitar permiso, suscribirse, desuscribirse).
- **Componente `NotificationSettings`**: UI para que los usuarios activen/desactiven notificaciones PUSH en su dispositivo y configuren sus preferencias por tipo de evento (Pagos, Préstamos, Alertas, etc.).
- **Integración en Admin**: Se agregó la pestaña "Mis Notificaciones" en la página de Configuración (`/admin/settings`) para acceder a estas preferencias.

## Pasos Requeridos
Debido a problemas de conexión con la base de datos local durante la implementación, es necesario ejecutar la migración manualmente:

1. Asegúrese de que su base de datos PostgreSQL esté corriendo (Docker container `postgres`).
2. Ejecute el siguiente comando en la terminal:
   ```bash
   npx prisma migrate dev --name add_push_notifications
   ```
   O si prefiere solo actualizar el esquema sin historial de migraciones:
   ```bash
   npx prisma db push
   ```

3. Reinicie el servidor de desarrollo para asegurar que las nuevas variables de entorno y el service worker se carguen correctamente.

## Pruebas
Para probar las notificaciones:
1. Navegue a Configuración -> Mis Notificaciones.
2. Active el interruptor "Activar notificaciones en este dispositivo".
3. Acepte los permisos del navegador.
4. Verá que el estado cambia a activado.
