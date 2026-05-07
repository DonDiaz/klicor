# Auditoria tecnica de codigo - 2026-05-06

## Alcance

Esta auditoria reviso el estado tecnico de Klicor con foco en:

- Dependencias instaladas y alertas de seguridad.
- Configuracion de imagenes remotas y Storage.
- Reglas de acceso a archivos publicos.
- Codigo y estilos sin uso evidente.
- Verificacion basica de compilacion.

No se busco cambiar funcionalidades visibles de agenda, comercio, Dorika o link publico. Los cambios aplicados fueron de limpieza, seguridad y mantenimiento.

## Fuentes consultadas

- Firebase CLI: https://firebase.google.com/docs/cli
- Vercel CLI: https://vercel.com/docs/cli
- Next.js Image remotePatterns: https://nextjs.org/docs/pages/api-reference/components/image
- Firebase Storage Security Rules: https://firebase.google.com/docs/reference/security/storage
- Vercel WAF Rate Limiting: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting

## Hallazgos

### Dependencias de consola dentro del runtime

Se encontro que `firebase-tools` y `vercel` estaban declarados dentro de `dependencies`.

Estas herramientas son CLI de despliegue y administracion. No son librerias que Klicor importe para renderizar paginas, procesar agenda, enviar correos o manejar comercio.

Impacto encontrado:

- Aumentaban mucho el tamano del arbol de dependencias.
- Arrastraban dependencias transitivas con alertas de seguridad.
- Hacian mas dificil distinguir entre dependencias reales de la aplicacion y herramientas de operacion.

Decision aplicada:

- Se removieron `firebase-tools` y `vercel` de `package.json` y `package-lock.json`.
- El proyecto puede seguir usando esas herramientas por instalacion global, `npx`, CI/CD o plataforma, sin cargarlas como parte de la app.

### Alertas de seguridad en dependencias

Antes de la limpieza, `npm audit` reportaba 50 vulnerabilidades.

Despues de retirar CLI innecesarios y actualizar dependencias de runtime, `npm audit --omit=dev` quedo reducido a 8 vulnerabilidades bajas.

Dependencias actualizadas:

- `next` a `15.5.15`
- `react` y `react-dom` a `19.2.5`
- `firebase` a `12.12.1`
- `firebase-admin` a `13.8.0`
- `resend` a `6.12.2`
- `zod` a `4.4.3`

Tambien se agrego un `overrides` para resolver `postcss` en `^8.5.10`, dejando instalado `postcss@8.5.14`.

Pendiente tecnico:

- Persisten 8 alertas bajas que vienen por dependencias internas de `firebase-admin` / Google Cloud.
- `npm audit fix --force` propone bajar `firebase-admin` a `10.3.0`.
- No se aplico ese cambio porque seria un downgrade grande y mas riesgoso que mantener las alertas bajas mientras Google/Firebase actualiza su arbol transitivo.

### Imagenes remotas

Se reviso `next.config.mjs`.

Antes, la configuracion permitia dominios amplios como:

- `**.firebasestorage.googleapis.com`
- `**.storage.googleapis.com`

Eso permitia cargar imagenes desde muchos buckets ajenos al proyecto.

Decision aplicada:

- Se limito Firebase Storage al bucket configurado en `FIREBASE_STORAGE_BUCKET`.
- Se mantuvo `**.googleusercontent.com` para fotos de cuentas Google.
- Se agregaron explicitamente `loremflickr.com` y `ui-avatars.com` porque las tiendas demo los usan para productos y logos.

Nota importante:

- El ajuste inicial rompio o pudo romper imagenes demo porque esos dominios externos no estaban permitidos.
- Se corrigio agregando los dominios demo de forma explicita, sin volver a abrir permisos amplios de Storage.

### Reglas de Storage

Se reviso `storage.rules`.

Ya existian lecturas publicas para:

- `profiles`
- `qr`
- `payment-qr`
- `commerce-products`

Pero agenda publica guarda imagenes en:

- `booking-staff`
- `booking-services`

Decision aplicada:

- Se agrego lectura publica para `booking-staff/{uid}/...`.
- Se agrego lectura publica para `booking-services/{uid}/...`.
- Las escrituras siguen bloqueadas desde cliente.

Esto alinea las reglas con la necesidad real de mostrar fotos de profesionales y servicios en la agenda publica.

### CSS muerto

Se detectaron bloques de CSS antiguos que solo aparecian en `app/globals.css` y no tenian referencias en `app/`, `components/` ni `lib/`.

Se eliminaron estilos asociados a versiones anteriores de la landing y mockups que ya no se usan, por ejemplo:

- `landing-hero`
- `landing-mini-proof`
- `landing-strip`
- `problem-card`
- `solution-card`
- `marketing-hero`
- `mockup-card`
- `steps-grid`
- `benefits-grid`

Se conservaron estilos que si tienen referencias actuales, aunque su nombre parezca historico, como clases de `home-compare-previous`, `cloud-pricing-card` y vistas activas.

### Codigo muerto

Se encontro `lib/static-demo-profile.js`.

Ese archivo exportaba un perfil demo estatico, pero no tenia imports ni referencias en el codigo actual.

Decision aplicada:

- Se elimino `lib/static-demo-profile.js`.

### Artefactos locales de instalacion

Durante la actualizacion de dependencias, `npm install` quedo detenido y dejo una copia corrupta temporal de `node_modules`.

Acciones aplicadas:

- Se reconstruyo `node_modules` con las versiones correctas.
- Se agrego `node_modules_corrupt_*/` al `.gitignore` para que una carpeta temporal de este tipo no entre accidentalmente a Git.

Nota:

- En este equipo quedo una carpeta temporal parcialmente eliminada que Windows no termino de borrar dentro del tiempo de ejecucion. Queda ignorada por Git.
- Esa carpeta no forma parte de la aplicacion ni debe subirse.

## Verificaciones realizadas

Se ejecutaron:

- `git diff --check`
- `node --check` sobre archivos JS tocados
- `npm audit --omit=dev`
- `npm run build`

Resultado:

- La sintaxis paso.
- El diff no mostro errores de espacios.
- La auditoria bajo de 50 vulnerabilidades a 8 bajas.
- El build de Next paso usando `NEXT_PRIVATE_BUILD_WORKER=1`.

Observacion del build:

- En Windows con Node 24, el build paralelo de Next fallo dos veces por memoria nativa del worker durante `Collecting page data`.
- Con `NEXT_PRIVATE_BUILD_WORKER=1` el build paso correctamente.
- Esto apunta a una limitacion local del proceso de build, no a un error funcional del codigo.

## Segunda capa aplicada

Despues de la primera limpieza se revisaron rutas publicas y consultas con entradas externas.

### Endpoint publico de clicks

Ruta revisada:

- `app/api/analytics/click/route.js`

Hallazgo:

- El endpoint redirigia al usuario y al mismo tiempo guardaba el conteo de click.
- Si la escritura de analytics fallaba, podia afectar el redireccionamiento.
- La clave usada para guardar metricas dependia del parametro `button`.

Decision aplicada:

- La escritura de analytics ahora se ejecuta de forma aislada.
- Si analytics falla, se registra el error en consola, pero el usuario sigue siendo redirigido.
- Las claves de analytics ahora se normalizan antes de usarse en Firestore.
- Se evita crear metricas con caracteres raros o nombres excesivamente largos.

Archivos tocados:

- `app/api/analytics/click/route.js`
- `lib/firestore.js`

### Limites en slugs publicos y usuario

Rutas y helpers revisados:

- `app/api/username/route.js`
- `lib/firestore.js`
- `lib/public-profiles.js`
- `lib/public-commerce.js`
- `lib/public-booking.js`

Hallazgo:

- El esquema principal del perfil limita `username` a 30 caracteres.
- Algunas rutas publicas o endpoints auxiliares no aplicaban ese mismo limite antes de consultar Firestore o cache.

Decision aplicada:

- El endpoint de disponibilidad de usuario ahora rechaza slugs mayores a 30 caracteres.
- `isUsernameAvailable` valida minimo y maximo antes de consultar conflictos.
- Las rutas publicas de perfil, comercio y agenda retornan `null` si el slug excede el tamano valido.
- Los identificadores publicos de link estable se limitaron a 80 caracteres.
- Los ids de seleccion de comercio publico se limitaron a 120 caracteres.

Objetivo:

- Evitar consultas innecesarias.
- Evitar claves de cache enormes.
- Reducir superficie para entradas externas basura.

### Verificacion de segunda capa

Se ejecuto:

- `node --check` en archivos tocados.
- `git diff --check`.
- Peticion local a `/`.
- Peticion local a un slug publico excesivamente largo.
- Peticion local a `api/analytics/click` con redireccion.

Resultado:

- Sintaxis correcta.
- Diff sin errores.
- Home local respondio `200`.
- Slug publico excesivamente largo respondio `404`.
- Click publico respondio `307`.

Nota:

- Se intento probar una tienda demo por ruta directa, pero en el entorno local respondio `404`. No se marco como regresion de esta auditoria porque puede depender del modo publico o de datos locales sembrados.

## Tercera capa aplicada

Se continuo con una revision conservadora sobre rutas internas y estilos residuales.

### CSS residual de autenticacion y dashboard

Despues de eliminar bloques antiguos, quedaron referencias sueltas en modo oscuro y reglas responsive.

Hallazgo:

- `auth-layout`, `auth-brand-point`, `auth-system-panel` y `auth-system-points` ya no aparecian en componentes ni rutas activas.
- `dashboard-topbar`, `dashboard-identity-card` y `dashboard-action-strip` tampoco tenian referencias activas.
- Esas clases solo seguian existiendo dentro de `app/globals.css`.

Decision aplicada:

- Se retiraron las referencias residuales de modo oscuro y responsive.
- Se conservaron clases cercanas que si se usan actualmente, como `dashboard-identity-main`, `dashboard-identity-meta`, `dashboard-action-group` y estilos de editor/perfil.

Objetivo:

- Reducir CSS muerto sin tocar estructura visual activa.
- Evitar que futuras modificaciones hereden nombres de layouts que ya no existen.

### Mensajes de error del modulo comercial administrativo

Ruta revisada:

- `app/api/commerce/route.js`

Hallazgo:

- Agenda administrativa ya usaba `formatApiError`.
- Comercio administrativo devolvia `error.message` directamente.

Decision aplicada:

- Se alineo Comercio con el mismo helper de errores que Agenda.
- Los errores de validacion siguen mostrando mensajes utiles.
- Los errores no esperados tienen un mensaje de fallback mas controlado.

Archivo tocado:

- `app/api/commerce/route.js`

## Cuarta capa aplicada

### Imagenes demo migradas

Pendiente anterior:

- Las tiendas demo dependian de imagenes externas (`loremflickr.com`) y logos externos (`ui-avatars.com`).

Decision aplicada:

- Se creo `scripts/migrate-demo-images-to-storage.mjs`.
- Se migraron las 10 tiendas demo a Firebase Storage propio.
- Cada producto quedo con variantes `thumb` (384 px), `card` (768 px) y `large` (1440 px).
- Las rutas usan nombres con hash para permitir cache largo: `Cache-Control: public, max-age=31536000, immutable`.
- Se agrego metadata por variante: tamano, bytes, contentType, path, url, variante, fecha de migracion y URL original.
- Se actualizaron las secciones publicas para que el frontend pueda usar la variante correcta.

Error corregido durante esta capa:

- La primera ejecucion creo rutas nuevas en Storage (`demo-products` y `demo-assets`) sin haber actualizado primero `storage.rules`.
- Eso produjo imagenes rotas por `403 Forbidden`.
- Se corrigio agregando lectura publica para esas rutas y desplegando reglas de Storage.
- Este error quedo registrado tambien en el contexto privado de trabajo para evitar repetirlo en otras tareas.

Verificacion:

- Las 10 demos quedaron con `0` productos externos.
- Las 10 demos quedaron con `0` productos sin `imageCardUrl` o `imageThumbUrl`.
- Las 10 demos tienen logo en Storage propio.
- Se probo una URL real de Storage y respondio `200 OK` con cache largo.

### Rate limiting basico en rutas publicas

Pendiente anterior:

- Revisar proteccion contra abuso en clicks, agenda publica y comercio publico.

Decision aplicada:

- Se agrego `lib/rate-limit.js` con un limitador local por IP y ventana de tiempo.
- Se aplico limite a `app/api/analytics/click/route.js`.
- Se aplico limite a `app/api/public/booking/[username]/route.js` para lectura de agenda y creacion de citas publicas.
- Se aplico limite a `app/api/public/commerce/[username]/route.js` para consultas publicas de comercio.
- Se aplico limite a `app/api/username/route.js` para evitar abuso del verificador de usuarios.

Limites actuales:

- Clicks publicos: 90 solicitudes por minuto por IP.
- Lectura de agenda publica: 120 solicitudes por minuto por IP.
- Creacion de citas publicas: 12 intentos por minuto por IP.
- Comercio publico: 180 solicitudes por minuto por IP.
- Verificacion de username: 45 solicitudes por minuto por IP.

Nota tecnica:

- Esta capa es una proteccion de aplicacion y funciona como contencion basica.
- En produccion, una proteccion mas fuerte debe complementarse con Vercel WAF/Rate Limiting o una capa distribuida, porque los limites en memoria no son globales entre instancias serverless.

### Alertas transitivas de Firebase Admin

Pendiente anterior:

- Monitorear 8 alertas bajas internas de Google Cloud / Firebase Admin.

Verificacion actual:

- `firebase-admin` esta en la ultima version disponible (`13.8.0`).
- `npm audit --omit=dev` sigue mostrando 8 alertas bajas.
- `npm audit fix --force` sigue proponiendo bajar `firebase-admin` a `10.3.0`.

Decision:

- No se aplico downgrade.
- Se actualizaron parches sanos de runtime:
  - `next` a `15.5.16`
  - `react` y `react-dom` a `19.2.6`
  - `resend` a `6.12.3`
- Las 8 alertas bajas quedan documentadas como transitivas sin arreglo seguro disponible hoy.

### Build local en Windows / Node 24

Pendiente anterior:

- Revisar si el build necesitaba `NEXT_PRIVATE_BUILD_WORKER=1`.

Verificacion actual:

- Se ejecuto `npm run build` sin `NEXT_PRIVATE_BUILD_WORKER=1`.
- El build completo paso con Next `15.5.16`.

Decision:

- No se agrego variable permanente.
- El pendiente queda cerrado en este entorno mientras el build normal siga pasando.

### Limpieza CSS y componentes ocultos

Pendiente anterior:

- Revisar si quedaba CSS muerto, componentes ocultos o elementos heredados que debian eliminarse.

Verificacion aplicada:

- Se mapearon clases de `app/globals.css` contra `app/`, `components/` y `lib/`.
- No aparecieron clases claramente huerfanas despues de las limpiezas anteriores.
- Se revisaron componentes de `components/` contra imports del proyecto.
- No aparecieron archivos de componente sin referencia clara.
- Se revisaron patrones de `display: none`, mockups y rutas heredadas.

Decision:

- No se elimino CSS ni componentes adicionales en esta capa porque no hubo candidatos seguros.
- La ruta `/comparar/home-anterior` se conserva porque existe como comparacion historica explicita del home.
- Cualquier limpieza mas agresiva debe hacerse con navegador abierto y comparacion visual de pantallas reales.

## Pendientes

### Monitorear alertas transitivas de Firebase Admin

Quedan 8 alertas bajas en dependencias internas de Google Cloud / Firebase Admin.

No se recomienda forzar el arreglo automatico porque implica bajar `firebase-admin` a una version antigua.

Recomendacion:

- Revisar periodicamente nuevas versiones de `firebase-admin`.
- Actualizar cuando Google publique una version que corrija esas dependencias transitivas sin downgrade.

### Complementar rate limiting en produccion

La aplicacion ya tiene una capa basica por IP en memoria.

Recomendacion:

- Configurar una capa distribuida en Vercel WAF/Rate Limiting cuando el proyecto lo permita.
- Mantener el limitador de aplicacion como defensa adicional.

### Siguiente capa de limpieza visual

La auditoria ya elimino CSS muerto evidente y la cuarta capa no encontro candidatos seguros adicionales.

Recomendacion:

- Revisar estilos de dashboard/comercio solo con pantallas reales abiertas.
- Eliminar componentes heredados unicamente cuando se confirme que no tienen ruta activa ni uso de producto.
