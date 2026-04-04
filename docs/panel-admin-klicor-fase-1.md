# Panel Administrativo de Klicor — Fase 1

## Alcance de esta fase

La Fase 1 convierte el panel administrativo en un módulo real de operación para:

- ver métricas generales del negocio
- gestionar usuarios con filtros
- controlar origen, plan y estado de cuenta
- revisar vencimientos y renovaciones
- configurar precio anual, trial y alertas
- registrar pagos manuales
- dejar lista la base para convenios y aliados

## Cambios realizados

### Interfaz administrativa

Se rediseñó el panel de `/admin` con navegación lateral y seis secciones:

1. `Dashboard`
2. `Gestión de usuarios`
3. `Facturación y planes`
4. `Renovaciones`
5. `Convenios y alianzas`
6. `Configuración general`

Además:

- se agregó tabla completa de usuarios
- se agregó vista de detalle por usuario en drawer lateral
- se agregaron métricas por estado, origen y crecimiento mensual
- se agregó control de settings de facturación y trial

### Backend administrativo

Se agregó una capa nueva en `lib/admin-panel.js` para separar:

- métricas
- normalización administrativa
- detalle de usuarios
- registro de pagos manuales
- cambios de acceso
- bitácora de acciones admin

### Nuevas rutas API

- `GET /api/admin/panel`
- `GET /api/admin/settings`
- `PATCH /api/admin/settings`
- `GET /api/admin/users/[uid]`
- `PATCH /api/admin/users/[uid]`

### Lógica de negocio

Se amplió la lógica de usuarios para soportar:

- `origin`
- `partnerId`
- `ownerName`
- `phone`
- `city`
- `accountStatus`
- `startsAt`
- `lastPaymentAt`
- `amountPaid`
- `adminNotes`

También se ajustó:

- creación de usuarios nuevos
- activación de suscripciones
- sweep automático de vencimientos
- recordatorio de renovación configurable por settings

## Estructura nueva de datos

## Usuarios (`users`)

Campos administrativos nuevos o normalizados:

- `ownerName`
- `phone`
- `city`
- `origin`
- `partnerId`
- `accountStatus`
- `startsAt`
- `lastPaymentAt`
- `amountPaid`
- `adminNotes`

Campos operativos existentes que siguen vigentes:

- `businessName`
- `businessCategory`
- `email`
- `status`
- `plan`
- `createdAt`
- `trialEndsAt`
- `expiresAt`
- `graceUntil`
- `cancellationAt`
- `paymentPrice`

## Settings (`settings/billing`)

La configuración del panel ahora contempla:

- `annualPrice`
- `currency`
- `trialDays`
- `graceDays`
- `hardSuspensionDays`
- `renewalAlertDays`
- `renewalMode`
- `trialExpiredMessage`
- `paidExpiredMessage`
- `convenioDefaultDays`
- `agencyAnnualPrice`
- `partnerDefaultPrice`

## Payments (`payments`)

Se siguen guardando intentos y activaciones, pero ahora también se soportan pagos manuales con:

- `manual`
- `method`
- `notes`
- `createdByUid`
- `createdByEmail`

## Admin logs (`adminLogs`)

Se agregó una colección de bitácora básica para acciones administrativas importantes:

- cambios de settings
- cambios de detalle de usuario
- cambios de acceso
- extensiones de vencimiento
- pagos manuales

## Cómo administrar usuarios orgánicos, agencias y convenios

## Usuario orgánico

Valor recomendado:

- `origin = organico`
- `partnerId = ""`

Flujo:

1. se registra por sí mismo
2. entra en trial
3. al vencer pasa a pendiente de pago
4. si paga, queda activo con plan anual

## Usuario de agencia

Valor recomendado:

- `origin = agencia`
- `partnerId = agencia_x`

Uso en panel:

- asigna origen `Agencia`
- escribe el identificador del aliado en `Convenio o aliado`
- define plan `agency` si aplica condición comercial especial

## Usuario de Cámara de Comercio o institucional

Valores recomendados:

- `origin = camara_ocana` o `secretaria_tic`
- `partnerId = convenio_001`

Uso en panel:

1. abre el detalle del usuario
2. cambia `Origen`
3. asigna `Convenio o aliado`
4. en `Acceso y vencimientos`, define plan y fecha de vencimiento
5. guarda

Cuando termine el período subsidiado, puedes:

- extender manualmente
- activarlo como pago propio
- o dejarlo como `pending_payment` / `expired`

## Cómo cambiar precios, planes y vencimientos desde el panel

## Cambiar precio anual y trial

Ruta visual:

- `Panel administrativo`
- `Facturación y planes`

Desde ahí puedes editar:

- precio anual
- trial en días
- alerta de renovación
- precio para agencias
- valor por defecto de convenios
- mensajes al vencer

## Cambiar plan o estado de un usuario

Ruta visual:

- `Gestión de usuarios`
- `Gestionar`
- `Acceso y vencimientos`

Desde ahí puedes:

- cambiar plan
- cambiar estado
- modificar fecha de inicio
- modificar fecha de vencimiento
- suspender
- marcar como vencido
- activar manualmente

## Registrar pago manual

Ruta visual:

- `Gestión de usuarios`
- `Gestionar`
- `Pago manual`

Qué hace:

- crea un registro en `payments`
- actualiza `lastPaymentAt`
- actualiza `amountPaid`
- reactiva el acceso con la duración indicada

## Compatibilidad y migración segura

Esta fase se construyó para no romper el sistema actual:

- la lógica pública sigue usando `status`
- el panel admin trabaja además con `accountStatus`
- los usuarios viejos se normalizan al leerse aunque no tengan todos los campos nuevos
- los nuevos campos se guardan automáticamente cuando el usuario se crea o cuando el admin actualiza la cuenta

No fue necesario romper:

- onboarding
- dashboard del usuario
- pagos actuales con Mercado Pago
- QR
- perfiles públicos

## Qué sigue en Fase 2

Queda lista la base para:

- convenios con colección propia
- aliados con precio negociado
- importación masiva desde CSV/Excel
- conversión de convenio a pago propio
- renovaciones post convenio
