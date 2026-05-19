# Endurecimiento de Seguridad Klicor

Estado: implementado en codigo para pruebas.

Fecha: 2026-05-19.

## Fuentes oficiales revisadas

- Firebase App Check para backend propio: https://firebase.google.com/docs/app-check/custom-resource-backend
- Firebase Auth ID tokens con Admin SDK: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Firestore counters/transacciones y limite de escritura por documento: https://firebase.google.com/docs/firestore/solutions/counters
- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Mercado Pago webhooks y firma: https://www.mercadopago.com.co/developers/es/docs/checkout-pro/payment-notifications

## Que se agrego

### 1. App Check preparado para APIs

Se agrego validacion server-side de `X-Firebase-AppCheck`.

Archivos:

- `lib/app-check.js`
- `lib/firebase-admin.js`
- `lib/firebase-client.js`
- `lib/client-api.js`

Modos:

- `FIREBASE_APP_CHECK_MODE=off`: no valida. Modo seguro para desarrollo sin configurar.
- `FIREBASE_APP_CHECK_MODE=monitor`: no bloquea, pero registra advertencias si falta token.
- `FIREBASE_APP_CHECK_MODE=enforce`: bloquea llamadas sin token valido.

Variables requeridas para probarlo en web:

- `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_KEY`
- `FIREBASE_APP_CHECK_MODE=monitor` primero.

Regla de despliegue:

1. Configurar App Check en Firebase para la web app.
2. Agregar `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_KEY` en Vercel pruebas.
3. Poner `FIREBASE_APP_CHECK_MODE=monitor`.
4. Probar dashboard, agenda publica y comercio publico.
5. Revisar logs.
6. Solo despues poner `FIREBASE_APP_CHECK_MODE=enforce`.

No poner `enforce` antes de verificar, porque puede bloquear clientes legitimos.

### 2. Rate limit durable

El rate limit viejo vive en memoria y sirve como primera defensa, pero en serverless no es suficiente.

Se agrego rate limit durable en Firestore para acciones publicas abusables y subidas de imagen autenticadas:

- crear cita publica,
- clicks/redirects de analytics,
- imagenes de perfil, portada Dorika y QR de pagos,
- imagenes de productos de comercio,
- fotos de servicios y profesionales de agenda.

Archivo:

- `lib/durable-rate-limit.js`

Decision de costo:

No se aplico rate limit durable a todas las lecturas publicas porque cada lectura escribiria en Firestore y subiria costos. Para lecturas publicas normales se mantiene rate limit en memoria + App Check.

En rutas autenticadas solo se aplica rate limit durable cuando viene un archivo real. Guardar textos, configuraciones o cambios sin imagen no consume esta defensa durable.

### 3. Verificacion de sesiones revocadas

Firebase ID tokens son JWT y normalmente se validan sin consultar revocacion para mantener velocidad. Para acciones sensibles se activo `checkRevoked` en `verifyIdToken`.

Acciones cubiertas:

- perfil publico y metodos visibles,
- comercio cuando guarda cambios,
- agenda cuando guarda cambios,
- activacion de modulos,
- Mercado Pago preference/confirm,
- solicitudes, aceptacion y revocacion de agencia,
- mutaciones administrativas de usuarios, settings y agencias.

No se activo en lecturas normales como `/api/me`, dashboard, paneles de consulta o vistas publicas, porque agregaria latencia sin aportar mucho control.

### 4. Audit log minimo

Se agrego bitacora para acciones sensibles.

Coleccion:

- `auditLogs`

Campos:

- action,
- status,
- actorUid,
- actorEmail,
- actorRole,
- targetUid,
- ip,
- userAgent,
- metadata,
- createdAt.

Acciones cubiertas:

- admin usuarios,
- admin settings,
- admin agencias,
- solicitudes y respuesta de agencia,
- revocar agencia,
- perfil,
- modulos,
- billing preference,
- billing confirm,
- billing webhook,
- agenda sensible,
- comercio sensible.

No se guardan datos privados completos ni payloads grandes. Solo trazabilidad minima.

## Que no se hizo a proposito

- No se cambio el flujo de usuario.
- No se cambiaron permisos de negocio.
- No se bloqueo App Check por defecto.
- No se puso rate limit durable en cada lectura publica para no aumentar costos.
- No se activo `checkRevoked` en cada lectura para no volver lento el dashboard.
- No se modificaron reglas Firestore/Storage porque ya estan cerradas para escritura cliente.

## Que probar en bioimpulso

Con `FIREBASE_APP_CHECK_MODE=off`:

- login dashboard,
- guardar perfil,
- activar/desactivar modulo,
- agenda publica,
- crear cita publica,
- comercio publico,
- click en enlaces del link publico,
- agencia: solicitar, aceptar, administrar.

Luego con `FIREBASE_APP_CHECK_MODE=monitor` y key App Check:

- repetir pruebas anteriores,
- revisar logs de Vercel por `[app-check]`.

Solo si no hay advertencias raras:

- probar `FIREBASE_APP_CHECK_MODE=enforce`.
