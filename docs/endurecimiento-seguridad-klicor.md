# Endurecimiento de Seguridad Klicor

Estado: implementado en codigo para pruebas.

Fecha: 2026-05-19.

Actualizacion pendiente: 2026-05-27.

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

## Revision externa pendiente: Claude, 2026-05-27

Claude reviso el codigo de Klicor y no reporto vulnerabilidades criticas directamente explotables. La lectura general fue positiva:

- la autoridad principal esta en el servidor,
- Firestore y Storage no permiten escrituras directas desde cliente,
- las mutaciones pasan por APIs autenticadas,
- admin esta protegido,
- Mercado Pago valida firma HMAC y reconsulta el pago,
- no se detecto uso de `dangerouslySetInnerHTML`, `eval`, `new Function` ni `document.write`,
- React escapa textos de usuario,
- correos y vCard tienen escape especifico,
- los links de usuario bloquean esquemas peligrosos, IPs privadas, localhost, credenciales y puertos no estandar.

Conclusion simple: la base esta bien, pero faltan defensas de segunda capa para crecer con menos riesgo.

### Pendientes priorizados

1. Cabeceras de seguridad globales.
   - Agregar `Content-Security-Policy`, `X-Frame-Options` o `frame-ancestors`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy`.
   - Empezar CSP en modo `Report-Only` si se decide una politica estricta, porque Next.js y scripts externos pueden requerir ajustes finos.
   - No aplicar a ciegas: revisar si alguna pagina publica necesita poder incrustarse en iframe antes de bloquear todo con `frame-ancestors`.

2. Confirmar App Check en produccion.
   - La infraestructura ya existe.
   - Revisar variables de Vercel en pruebas y produccion.
   - Confirmar si esta en `monitor` o `enforce`.
   - No cambiar modo sin probar dashboard, link publico, comercio publico y agenda publica.

3. Cron secret con comparacion de tiempo constante.
   - Revisar `/api/billing/cron`.
   - Revisar `/api/booking/reminders/cron`.
   - Cambiar comparacion `!==` por `crypto.timingSafeEqual`, siguiendo el patron ya usado en Mercado Pago.

4. Respuestas de error mas seguras.
   - Unificar APIs para usar `formatApiError()` o equivalente.
   - Errores esperados pueden seguir mostrando mensajes claros.
   - Errores internos de SDK, Firestore o stack deben responder mensaje generico y registrar detalle solo en servidor.

5. Storage publico.
   - Confirmar que bajo prefijos publicos solo existan assets pensados para mostrarse: logos, productos, QR visibles, imagenes de agenda o demos.
   - No guardar cedulas, documentos privados, soportes internos de facturacion ni datos sensibles en rutas de lectura publica.
   - Si algo requiere control, servirlo por API autenticada o URL firmada.

6. Rate limit.
   - Mantener la decision de no escribir en Firestore por cada lectura publica para evitar costos.
   - Usar rate limit durable solo en endpoints abusables o sensibles.
   - El rate limit en memoria queda como defensa rapida, no como barrera principal.

7. IP de rate limit.
   - En Vercel, preferir cabeceras confiables de la plataforma como `x-vercel-forwarded-for` antes de `x-forwarded-for`.
   - Evitar depender de una cabecera que el cliente pueda falsificar.

8. Token de correo de respaldo.
   - Opcional: usar `crypto.timingSafeEqual` al comparar hashes, por consistencia.
   - Riesgo bajo porque el token ya es aleatorio y se guarda hasheado.

9. Dependencias.
   - Ejecutar `npm audit` periodicamente.
   - Mantener actualizados `next`, `firebase` y `firebase-admin`.

### Decision de producto

No trabajar esto ahora. Queda documentado como pendiente tecnico para una fase de endurecimiento de seguridad posterior.

Cuando se retome, atacar primero:

1. cabeceras de seguridad,
2. App Check en produccion,
3. comparacion segura del secreto de cron.
