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

Para pruebas en `klicor-pruebas`, Vercel debe tener `CRON_SECRET` en `Production` y GitHub debe tener estos secretos del repositorio:

- `BOOKING_REMINDER_URL`: `https://klicor-pruebas.vercel.app/api/booking/reminders/cron`
- `BOOKING_REMINDER_SECRET`: el mismo valor de `CRON_SECRET` configurado en Vercel para `klicor-pruebas`.

El workflow `.github/workflows/booking-reminders.yml` llama el endpoint cada 15 minutos y tambien permite ejecucion manual. Los scheduled workflows de GitHub corren desde la rama default del repositorio; si se necesita probar antes de promover a `main`, usar `workflow_dispatch` o un scheduler externo apuntando a la URL de pruebas.

No usar Vercel Cron frecuente en plan Hobby para recordatorios de 30 o 60 minutos. En Hobby Vercel limita los cron a una ejecucion diaria y no garantiza precision suficiente para este caso.

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
