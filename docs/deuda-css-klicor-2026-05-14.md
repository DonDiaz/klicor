# Deuda CSS Klicor - 2026-05-14

## Objetivo

Mantener la limpieza de CSS por modulo o layout, sin borrar reglas a ciegas ni mezclar cambios visuales con cambios de logica.

La regla base esta en `docs/contrato-codex.md`, seccion `12.1 Mantenimiento de CSS y Cambios Visuales`.

## Avance validado

### Commerce publico

Estado: validado en `bioimpulso`.

Se limpiaron reglas obsoletas de:

- Selector viejo de color/iconos de categorias.
- Assets antiguos de categorias.
- Iconos legacy reemplazados por assets curados.
- Hero visual antiguo de commerce.
- Avisos antiguos de abierto/cerrado reemplazados por el pill del header.
- Panel viejo de subcategorias que ya no se renderiza.
- Clases antiguas de headline/subheadline y badge de modo.
- Boton de tarjeta de producto antiguo.

Validaciones realizadas:

- Build de Next.js correcto.
- Deploy de `klicor-pruebas` correcto.
- Prueba manual del usuario en link publico, tienda, menu, catalogo y dashboard comercio.

## Deuda pendiente por bloque

### 1. Dashboard commerce

Prioridad: alta.

Motivo:

- Es la zona que mas se ha modificado durante categorias, productos, imagenes, selector de assets y layout compacto.
- Hay muchas reglas `commerce-board-*` que deben revisarse con cuidado porque afectan creacion, edicion, filas, botones, modales y responsive.

Forma correcta de atacarlo:

- Revisar primero `components/commerce-workspace-board.js`.
- Mapear clases `commerce-board-*`.
- Separar lo que pertenece a categorias, productos, editor modal, imagenes y acciones.
- Eliminar solo reglas sin uso confirmado o reglas duplicadas que ya fueron reemplazadas.

Que probar despues:

- Crear categoria.
- Editar categoria.
- Cambiar asset de categoria.
- Crear subcategoria.
- Crear producto con imagen.
- Editar producto.
- Ocultar/mostrar producto.
- Eliminar producto.
- Revisar desktop y ancho pequeno.

### 2. Preview del dashboard

Prioridad: media.

Motivo:

- Hay reglas `preview-shell-editor` que ajustan varias vistas dentro del telefono simulado.
- Algunas reglas son correctas porque el preview no debe comportarse igual que la pagina publica real.
- Otras pueden ser parches historicos de tamanos y overlays.

Forma correcta de atacarlo:

- Revisar `components/profile-form.js` y los componentes de preview que renderizan dentro del telefono.
- Separar reglas del contenedor del preview de reglas del contenido publico.
- No borrar nada solo porque parece repetido: muchas reglas existen para que el preview no active modales, carrito o overlays reales.

Que probar despues:

- Vista preview link in bio.
- Preview con tienda.
- Preview con menu.
- Preview con catalogo.
- Botones de copiar, abrir y descargar QR.
- Que el preview no muestre overlays o modales que bloqueen el panel.

### 3. Agenda

Prioridad: media-alta, despues de commerce.

Motivo:

- Agenda ya tiene flujo funcional sensible: disponibilidad, solicitudes, aprobacion, recordatorios, correos y panel.
- Cambios visuales pueden afectar lectura de horarios, acciones de cita y estado de confirmacion.

Forma correcta de atacarlo:

- Separar CSS publico de agenda y CSS del dashboard de agenda.
- Revisar primero clases usadas en `components/booking-workspace.js` y componentes publicos de agenda.
- No mezclar con cambios de logica de disponibilidad o correos.

Que probar despues:

- Agenda publica desde hoy con margen de 30 minutos.
- Solicitud manual.
- Confirmacion automatica.
- Panel de citas sin recargar.
- Botones aceptar, rechazar, reprogramar, asistio y no asistio.
- Vista movil.

### 4. Link in bio

Prioridad: media.

Motivo:

- Es la pantalla publica base y no debe mezclarse con commerce.
- Ya hay reglas historicas de preview, botones, redes, pagos, QR y personalizacion.

Forma correcta de atacarlo:

- Revisar `components/landing-view.js`, `components/profile-form.js` y reglas `public-*`.
- Mantener separado `appearance` de `commerceTheme`.
- No tocar commerce desde este bloque.

Que probar despues:

- Link publico principal.
- Redes sociales con iconos reales.
- Botones automaticos de tienda/menu/catalogo/agenda.
- Metodos de pago.
- Compartir.
- QR.
- Preview del dashboard.

### 5. Admin y billing

Prioridad: baja-media.

Motivo:

- Menos visible para usuarios finales, pero importante para operacion.
- Puede tener CSS viejo de tablas, drawer, estados y paneles.

Forma correcta de atacarlo:

- Revisar `components/admin-panel.js`, `components/admin-user-drawer.js` y rutas de billing.
- Evitar cambios de experiencia si la tarea es solo limpieza.

Que probar despues:

- Panel admin.
- Drawer de usuario.
- Cambio de estado o plan.
- Vista de billing/checkout si aplica.

## Reglas para los proximos bloques

- Un bloque por modulo o layout.
- No mezclar CSS con cambios de datos o backend.
- Antes de borrar, buscar si la clase se arma de forma dinamica.
- Si una clase dinamica no aparece textual, revisar el componente que arma el `className`.
- Despues de cada bloque: `git diff`, build, commit, push a `bioimpulso`, prueba visual.
- Si el bloque toca solo documentacion, no hace falta build.
- Si hay duda sobre una regla, se deja y se documenta en vez de borrarla.

## Estado recomendado siguiente

Siguiente bloque sugerido: `Dashboard commerce`.

Razon: ya validamos commerce publico y el dashboard commerce es el lugar con mayor probabilidad de CSS viejo acumulado por los cambios recientes de categorias, productos y assets.
