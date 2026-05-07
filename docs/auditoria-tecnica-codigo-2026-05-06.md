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

## Pendientes

### Revisar estrategia de imagenes demo

Las tiendas demo usan imagenes externas (`loremflickr.com`) y logos externos (`ui-avatars.com`).

Esto funciona, pero no es lo mas estable para demos de producto porque dependemos de servicios externos.

Recomendacion:

- Migrar imagenes demo importantes a Storage propio o a archivos locales versionados.

### Monitorear alertas transitivas de Firebase Admin

Quedan 8 alertas bajas en dependencias internas de Google Cloud / Firebase Admin.

No se recomienda forzar el arreglo automatico porque implica bajar `firebase-admin` a una version antigua.

Recomendacion:

- Revisar periodicamente nuevas versiones de `firebase-admin`.
- Actualizar cuando Google publique una version que corrija esas dependencias transitivas sin downgrade.

### Revisar build local en Windows / Node 24

El build paso con worker unico.

Recomendacion:

- Mantener la opcion `NEXT_PRIVATE_BUILD_WORKER=1` solo para este entorno si el problema se repite.
- Probar build en el entorno real de despliegue antes de convertir esa variable en configuracion permanente.

### Siguiente capa de limpieza

Esta auditoria aplico varias capas seguras. Todavia queda trabajo posible:

- Revisar rate limiting en rutas publicas, especialmente clicks, agenda publica y formularios.
- Revisar si algunos estilos de dashboard/comercio antiguos pueden eliminarse despues de comparar pantallas reales.
- Revisar si hay componentes ocultos que ya no deberian existir, pero solo despues de mapearlos contra las vistas activas.
