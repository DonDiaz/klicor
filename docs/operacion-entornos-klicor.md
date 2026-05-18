# Operacion de entornos Klicor

Ultima actualizacion: 12 de mayo de 2026.

## Regla principal

Klicor si puede editarse desde un workspace local, pero no se debe usar el PC como entorno de ejecucion o validacion del producto.

El flujo operativo queda asi:

1. El workspace local se usa para leer codigo, editar archivos, revisar diferencias, hacer validaciones estaticas ligeras, preparar commits y hacer push.
2. No se levantan servidores ni entornos locales por defecto: no `npm run dev`, no `next dev`, no emuladores Firebase y no validacion en `localhost`.
3. `bioimpulso` es el entorno oficial de pruebas.
4. `klicor` es el entorno de produccion.
5. Los cambios se verifican primero en `bioimpulso`, con datos y URLs reales de pruebas.
6. Cuando el cambio esta probado y aprobado en `bioimpulso`, se promueve hacia `klicor` produccion.
7. No se debe hacer trabajo directo sobre produccion sin pasar por pruebas, salvo instruccion explicita del usuario.

## Repos y proyectos

- Workspace local: lugar de edicion y preparacion tecnica. No es entorno de prueba funcional.
- `bioimpulso`: entorno de pruebas. Se usa para validar flujos, datos, autenticacion, UI, agenda, comercio, Dorika y paneles antes de tocar produccion.
- `klicor`: entorno de produccion. Solo debe recibir cambios que ya fueron revisados y aprobados desde pruebas.

## Firebase

Mapa operativo definido:

- Produccion: Firebase `klicor-6fc3e`.
- Pruebas: Firebase `bioimpulso`.

Cambiar variables de entorno no copia datos entre Firebase. Si un entorno apunta a otro proyecto Firebase, vera usuarios, perfiles, comercios, agendas, storage, QR y documentos de ese proyecto.

## Vercel

Mapa operativo definido:

- Produccion: proyecto Vercel `klicor`.
- Pruebas: proyecto Vercel `klicor-pruebas`.

Cada proyecto Vercel debe tener sus propias variables de entorno. No mezclar credenciales de Firebase, Storage, Mercado Pago, Resend, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL` ni secretos de cron entre produccion y pruebas.

### Recordatorios de Agenda

Los recordatorios de Agenda usan el endpoint protegido:

```txt
/api/booking/reminders/cron
```

Ese endpoint requiere:

```txt
Authorization: Bearer CRON_SECRET
```

Para pruebas en `klicor-pruebas`, Vercel debe tener `CRON_SECRET` en `Production` y Google Cloud Scheduler debe apuntar a:

- URL: `https://klicor-pruebas-donjhonnathan-4482s-projects.vercel.app/api/booking/reminders/cron`
- Metodo: `POST`
- Frecuencia MVP: `*/5 * * * *`
- Zona horaria: `America/Bogota`
- Header: `Authorization: Bearer <CRON_SECRET_DE_PRUEBAS>`
- Header si Vercel Deployment Protection esta activo: `x-vercel-protection-bypass: <VERCEL_AUTOMATION_BYPASS_SECRET_DE_PRUEBAS>`

Para produccion, Vercel debe tener `CRON_SECRET` en el proyecto `klicor` y Google Cloud Scheduler debe apuntar a:

- URL: `https://klicor.com/api/booking/reminders/cron`
- Metodo: `POST`
- Frecuencia MVP: `*/5 * * * *`
- Zona horaria: `America/Bogota`
- Header: `Authorization: Bearer <CRON_SECRET_DE_PRODUCCION>`

Los recordatorios ya no deben depender de GitHub Actions. El workflow viejo `.github/workflows/booking-reminders.yml` fue eliminado para evitar doble ejecucion y para que pruebas y produccion puedan tener schedulers separados.

Google Cloud Scheduler debe registrar la ejecucion del job y Vercel debe registrar la respuesta del endpoint. La respuesta incluye `actions` y `stats` para diagnosticar recordatorios:

- `remindersSent`: recordatorios enviados en esa corrida.
- `skippedAlreadySent`: citas que ya tenian recordatorio enviado.
- `skippedAlreadySkipped`: citas ya omitidas por alguna razon.
- `skippedOutsideWindow`: citas fuera de la ventana de envio.
- `skippedStatus`: citas que no estaban en estado `confirmed`.

Si el job sale en `success` pero `remindersSent` es `0`, revisar esos contadores antes de asumir error. Puede ser correcto si la cita ya tenia recordatorio o si todavia no estaba dentro de la ventana configurada.

No usar Vercel Cron frecuente en plan Hobby para recordatorios de 30 o 60 minutos. En Hobby Vercel limita los cron a una ejecucion diaria y no garantiza precision suficiente para este caso.

Comando de referencia cuando exista `gcloud` autenticado:

```powershell
gcloud scheduler jobs create http klicor-booking-reminders-pruebas `
  --location=us-central1 `
  --schedule="*/5 * * * *" `
  --time-zone="America/Bogota" `
  --uri="https://klicor-pruebas.vercel.app/api/booking/reminders/cron" `
  --http-method=POST `
  --headers="Authorization=Bearer <CRON_SECRET_DE_PRUEBAS>" `
  --attempt-deadline=60s `
  --max-retry-attempts=2
```

Para produccion, crear un job separado con otro secreto y URL `https://klicor.com/api/booking/reminders/cron`. No reutilizar secretos entre ambientes.

Si el Scheduler devuelve `401` aunque `CRON_SECRET` coincida, revisar primero Deployment Protection de Vercel. En proyectos protegidos, la llamada puede quedar bloqueada antes de llegar a Next.js. Segun la documentacion oficial de Vercel, las automatizaciones deben incluir el header `x-vercel-protection-bypass` con un bypass secret del proyecto.

### Agenda en tiempo real y Firestore

El panel de Agenda usa `onSnapshot` sobre:

```txt
users/{uid}/bookingAppointments
```

para actualizar la cita visible sin recargar la pagina. Para que funcione, las reglas de Firestore deben estar desplegadas en cada proyecto Firebase:

```txt
firebase deploy --only firestore:rules --project bioimpulso
firebase deploy --only firestore:rules --project klicor-6fc3e
```

No resolver este flujo con polling agresivo. La implementacion actual usa escucha en tiempo real, refresco al volver a enfocar la pestana y boton manual `Actualizar`. Evitar intervalos permanentes como 20 segundos porque un comercio puede dejar el panel abierto todo el dia y eso aumenta lecturas/costo en Firestore.

## Flujo obligatorio de cambios

1. Editar en el workspace local correspondiente.
2. Revisar diferencias y hacer validaciones estaticas ligeras cuando apliquen.
3. Hacer commit y push hacia el flujo de pruebas.
4. Probar en la URL de `bioimpulso`, no en `localhost`, salvo que el usuario lo pida explicitamente.
5. Revisar que el comportamiento sea correcto con datos reales de pruebas.
6. Solo despues de aprobacion, promover el cambio a `klicor` produccion.

## Regla para Codex

Codex debe distinguir entre editar localmente y validar localmente.

- Editar localmente esta permitido.
- Levantar servidores locales, emuladores o validar en `localhost` no esta permitido por defecto.
- Si el usuario pide trabajar sobre Klicor sin aclarar entorno, Codex debe preguntar si el cambio va en `bioimpulso` pruebas o en `klicor` produccion.

Si el usuario pide commit y push, Codex debe confirmar a que remoto/proyecto apunta el workspace actual antes de subir, especialmente cuando existan dos repos o dos proyectos Vercel activos.

## Administracion

El acceso admin debe existir en produccion mediante `/admin` y solo debe funcionar para el correo configurado en `ADMIN_EMAIL`.

El panel admin de pruebas debe mantenerse separado del panel admin de produccion. Ver un usuario en pruebas no significa que exista en produccion.
