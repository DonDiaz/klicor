# Mapa de Datos y APIs Klicor

Estado: auditoria inicial para deuda tecnica.

Objetivo: entender que datos existen, que API los toca y donde puede haber costo o lentitud antes de migrar base de datos.

## Resumen para decision

La deuda actual es media. No conviene hacer una limpieza grande antes de migrar base de datos. Si se limpia demasiado ahora, se paga dos veces: primero en Firestore y luego en la migracion.

Lo sano en esta etapa:

- documentar modelo actual,
- documentar APIs principales,
- corregir solo lecturas/escrituras claramente costosas,
- dejar refactor profundo para la migracion.

## Colecciones principales

### `users/{uid}`

Documento central del negocio.

Contiene:

- identidad del negocio,
- plan y estado de cuenta,
- modulos activos,
- configuracion de perfil publico,
- enlaces,
- metodos de pago visibles,
- configuracion de agenda,
- configuracion de comercio,
- datos de facturacion privada,
- acceso de agencia,
- datos Dorika.

Riesgo de deuda: este documento esta muy cargado. Para MVP funciona, pero en migracion conviene separar por dominios.

### `users/{uid}/bookingServices`

Servicios de agenda.

API principal: `/api/booking`.

### `users/{uid}/bookingStaff`

Profesionales o colaboradores de agenda.

API principal: `/api/booking`.

### `users/{uid}/bookingAppointments`

Citas, solicitudes, estados, recordatorios y datos del cliente de agenda.

APIs principales:

- `/api/booking`
- `/api/public/booking/[username]`
- `/api/booking/reminders/cron`

Riesgo de costo: disponibilidad y panel de agenda. Debe mantenerse filtrado por fecha/profesional y evitar barridos grandes.

### `users/{uid}/bookingCustomers`

Clientes que han agendado.

Uso: soporte operativo de agenda.

### `users/{uid}/commerceCategories`

Categorias de tienda/menu/catalogo.

API principal: `/api/commerce`.

### `users/{uid}/commerceSubcategories`

Subcategorias comerciales.

API principal: `/api/commerce`.

### `users/{uid}/commerceProducts`

Productos comerciales.

APIs principales:

- `/api/commerce`
- `/api/public/commerce/[username]`

Riesgo de costo: cargar productos visibles. Ya existen chunks/snapshots, mantener ese camino.

### `users/{uid}/commercePublicSections`

Snapshot publico optimizado para comercio.

Uso: evitar reconstruir todo el catalogo en cada visita publica.

### `usernames/{slug}`

Indice de username a uid.

Uso:

- paginas publicas,
- agenda publica,
- comercio publico.

### `publicLinks/{id}`

Enlace estable del QR. Permite cambiar username sin romper QR impreso.

### `payments/{paymentId}`

Intentos y confirmaciones de Mercado Pago.

APIs principales:

- `/api/billing/create-preference`
- `/api/billing/webhook`
- `/api/billing/confirm`

### `settings/billing`

Precios, dias de gracia y configuracion administrativa.

API principal:

- `/api/admin/settings`
- `/api/me`
- `/api/billing/*`

### `agencyAccounts/{email}`

Agencias autorizadas por Klicor.

APIs principales:

- `/api/admin/agencies`
- `/api/agency/me`
- `/api/agency/request-access`

### `agencyAccessRequests/{id}`

Solicitudes de acceso de agencia a negocio.

APIs principales:

- `/api/agency/request-access`
- `/api/agency/respond-request`
- `/api/me`

### `analytics/{username_metric}`

Contador simple de clicks.

API principal:

- `/api/analytics/click`

## APIs principales y datos que tocan

### `/api/me`

Lee:

- usuario actual,
- settings/billing,
- solicitudes pendientes de agencia,
- posible portada Dorika.

Riesgo:

- es el primer golpe del dashboard.
- Si se vuelve lento, todo el panel se siente lento.

Accion aplicada:

- `settings`, `dorika-cover` y `agency-requests` ahora corren en paralelo.
- Se marca respuesta como `no-store` para evitar respuestas viejas.

### `/api/profile`

Escribe:

- `users/{uid}`,
- imagenes de perfil,
- QR de pago,
- portada Dorika,
- username/public link.

Riesgo:

- archivo grande y mezcla varias responsabilidades.
- No refactorizar completo antes de migracion.

### `/api/booking`

Lee/escribe:

- servicios,
- colaboradores,
- citas,
- configuracion de agenda.

Riesgo:

- disponibilidad y agenda diaria pueden crecer.
- Mantener consultas por fecha y profesional.

### `/api/public/booking/[username]`

Lee:

- negocio por username,
- servicios,
- staff,
- disponibilidad,
- consentimiento legal.

Escribe:

- cita publica,
- consentimiento legal si aplica,
- cliente de agenda.

Riesgo:

- endpoint publico; controlar costo y abuso.

### `/api/commerce`

Lee/escribe:

- categorias,
- subcategorias,
- productos,
- imagenes,
- snapshots publicos.

Riesgo:

- archivo grande, pero los snapshots ayudan al costo publico.

### `/api/public/commerce/[username]`

Lee:

- snapshot publico,
- chunks de productos,
- deep links de producto.

Riesgo:

- endpoint publico; debe seguir usando chunks/snapshots.

### `/api/billing/*`

Lee/escribe:

- `payments`,
- `users/{uid}`,
- `settings/billing`.

Riesgo:

- sensible por dinero. No tocar sin pruebas de Mercado Pago.

### `/api/agency/*`

Lee/escribe:

- `agencyAccounts`,
- `agencyAccessRequests`,
- `users/{uid}.agencyAccess`.

Riesgo:

- permisos de terceros. Mantener validacion backend por `assertAgencyBusinessAccess`.

## Deuda principal

### 1. `lib/firestore.js`

Problema: mezcla usuarios, perfil, imagenes, QR, billing, recuperacion, settings, pagos y analytics.

Recomendacion para migracion:

- `lib/users-store.js`
- `lib/profile-store.js`
- `lib/billing-store.js`
- `lib/media-store.js`
- `lib/recovery-store.js`

### 2. `lib/booking-firestore.js`

Problema: mezcla disponibilidad, panel, citas, correos, recordatorios y clientes.

Recomendacion para migracion:

- `booking-store`
- `booking-availability`
- `booking-notifications`
- `booking-reminders`

### 3. `lib/commerce-firestore.js`

Problema: mezcla CRUD, imagenes, ordenamiento, snapshots y lectura publica.

Recomendacion para migracion:

- `commerce-store`
- `commerce-public-store`
- `commerce-media`
- `commerce-snapshots`

## Regla de trabajo

Antes de migrar base de datos, no hacer refactor grande. Solo corregir si:

- reduce lecturas reales,
- reduce escrituras innecesarias,
- mejora carga sin cambiar flujo,
- no cambia permisos,
- no elimina funcionalidad.

