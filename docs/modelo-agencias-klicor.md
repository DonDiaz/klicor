# Modelo de Agencias Klicor

Estado: borrador tecnico aprobado para fase MVP.

Este documento baja a estructura tecnica el flujo definido en `docs/klicor-producto-decisiones.md`.

## Objetivo

Permitir que una agencia autorizada por Klicor solicite acceso a un negocio existente para configurar su presencia digital sin pedir credenciales al dueno.

El negocio sigue siendo el propietario. La agencia solo recibe permisos operativos limitados y revocables.

## Principios

- No hay registro libre de agencias.
- Una agencia MVP equivale a un correo autorizado por admin.
- El negocio debe existir primero por el flujo normal de Klicor.
- La agencia solicita acceso por correo exacto del negocio.
- El negocio acepta, rechaza o revoca.
- Klicor no arbitra pagos ni acuerdos entre agencia y negocio.
- La agencia no puede bloquear el Klicor.
- La agencia publica cambios inmediatamente dentro de sus permisos.

## Colecciones

### `agencyAccounts`

Documento por agencia autorizada.

```js
{
  email: "agencia@dominio.com",
  agencyName: "Nombre Agencia",
  status: "active", // active | inactive
  createdBy: "adminUid",
  createdAt,
  updatedAt
}
```

Indices/consultas previstas:

- Buscar agencia por `email`.
- Listar agencias activas desde admin.

### `agencyAccessRequests`

Documento por solicitud de acceso.

```js
{
  agencyId: "agencyAccountId",
  agencyEmail: "agencia@dominio.com",
  agencyName: "Nombre Agencia",
  businessUid: "uidNegocio",
  businessEmail: "cliente@negocio.com",
  businessName: "Nombre negocio",
  status: "pending", // pending | accepted | rejected | revoked | expired
  permissions: {
    links: true,
    design: true,
    commerce: true,
    booking: true,
    publicProfile: true,
    paymentMethods: true,
    analytics: true,
    subscriptionRenewal: true,
    dorika: false,
    billing: false,
    subscriptionAdmin: false,
    security: false,
    owner: false
  },
  createdAt,
  expiresAt,
  lastSentAt,
  respondedAt,
  revokedAt
}
```

Indices/consultas previstas:

- Solicitudes pendientes por `businessUid`.
- Solicitudes por `agencyId`.
- Solicitud activa por `agencyId + businessUid + status`.

## Campo en `users/{businessUid}`

```js
{
  agencyAccess: {
    agencyId: "agencyAccountId",
    agencyEmail: "agencia@dominio.com",
    agencyName: "Nombre Agencia",
    status: "active", // active | revoked
    permissions: { ... },
    acceptedAt,
    revokedAt
  }
}
```

Este campo sirve para resolver rapido si el negocio tiene agencia activa y para filtrar permisos cuando la agencia abre el dashboard del negocio.

## Permisos

Permitido para agencia:

- Enlaces.
- Diseno.
- Perfil publico basico.
- Comercio completo.
- Metodos de pago visibles.
- Agenda solo configuracion.
- Analiticas generales.
- Renovacion limitada.

Prohibido para agencia:

- Seguridad.
- Recuperacion.
- Facturacion privada.
- Datos de factura electronica.
- Administracion completa de suscripcion.
- Cambio manual de plan, precio o estado.
- Eliminar cuenta.
- Cambiar propietario.
- Ver citas reales o datos de clientes de agenda.
- Operar citas: crear, aceptar, rechazar, reprogramar, cancelar, marcar asistio/no asistio.
- Vincular otra agencia.

## Estados

### Solicitud

- `pending`: enviada y vigente.
- `accepted`: aceptada por el negocio.
- `rejected`: rechazada por el negocio.
- `revoked`: acceso revocado despues de aceptado.
- `expired`: vencida despues de 7 dias.

### Agencia

- `active`: puede entrar a `/agencia`.
- `inactive`: no puede entrar ni solicitar acceso.

### Acceso del negocio

- `active`: agencia vinculada.
- `revoked`: acceso retirado.

## Reglas de negocio

- Una solicitud pendiente vence a los 7 dias.
- Si vence, la agencia solo puede reenviar o crear otra 24 horas despues.
- Solo puede existir una solicitud pendiente entre la misma agencia y el mismo negocio.
- Un negocio solo puede tener una agencia activa.
- Si el negocio ya tiene agencia activa, otra agencia no puede solicitar acceso.
- Si el negocio esta en trial o activo, la agencia puede editar segun permisos.
- Si el negocio esta vencido o suspendido, la agencia no puede editar contenido operativo.
- En vencido o suspendido, la agencia puede ayudar a renovar si tiene `subscriptionRenewal`.

## Operaciones atomicas

Aceptar acceso debe hacerse en transaccion:

1. Leer solicitud.
2. Leer agencia.
3. Leer negocio.
4. Verificar solicitud pendiente y no vencida.
5. Verificar agencia activa.
6. Verificar que el negocio no tenga otra agencia activa.
7. Actualizar solicitud a `accepted`.
8. Escribir `agencyAccess` en el negocio.

Revocar acceso debe hacerse en transaccion:

1. Leer negocio.
2. Verificar que quien revoca es el dueno.
3. Cambiar `agencyAccess.status` a `revoked`.
4. Actualizar solicitud relacionada si existe.

## Auditoria

Toda edicion realizada en modo agencia debe dejar trazabilidad:

```js
{
  updatedBy: "agencyUid",
  updatedByRole: "agency",
  updatedByEmail: "agencia@dominio.com",
  updatedForUid: "uidNegocio",
  updatedAt
}
```

La bitacora detallada por accion puede implementarse despues sobre `adminLogs` o una coleccion nueva `agencyLogs`.

## Rutas

- `/agencia`: panel principal de agencia.
- `/agencia/negocios`: negocios vinculados.
- `/agencia/solicitudes`: solicitudes enviadas.
- `/agencia/negocios/[uid]`: dashboard del negocio en modo agencia.

## APIs futuras

- `GET /api/agency/me`
- `GET /api/agency/businesses`
- `POST /api/agency/request-access`
- `POST /api/agency/respond-request`
- `POST /api/agency/revoke`

## Fases sugeridas

1. Modelo y helpers.
2. Admin habilita agencia.
3. Guard de `/agencia`.
4. Visual de `/agencia`.
5. Solicitud por correo exacto.
6. Correo y aceptacion.
7. Lista de negocios vinculados.
8. Dashboard del negocio en modo agencia.
