# Klicor - Producto, Estado Actual y Decisiones

Este documento es la fuente de verdad para seguir construyendo Klicor sin depender de la memoria de un chat. Antes de hacer cambios grandes de UX, UI, onboarding, tienda, menu, catalogo, agenda o Dorika, se debe leer este documento, `docs/contrato-codex.md` y contrastarlo con el codigo actual.

## 1. Que es Klicor

Klicor es una plataforma para que negocios pequenos creen una presencia digital rapida y util sin tener que construir una web completa desde cero.

Klicor debe permitir que un negocio tenga:

- Link in bio publico con identidad, botones, redes, metodos de pago y contacto.
- QR y enlace publico facil de compartir.
- Tienda, menu o catalogo segun lo que vende.
- Agenda como workspace operativo solo para negocios de citas reales.
- Perfil comercial para aparecer en Dorika cuando aplique.
- Panel administrativo principal para configurar el negocio con el menor esfuerzo posible.
- Workspaces operativos especializados para modulos grandes como Agenda y POS.

La promesa principal no es "hacer una pagina bonita", sino ayudar al negocio a vender, recibir pedidos, mostrar su oferta, ser encontrado y convertir conversaciones.

Klicor no debe crecer como un dashboard unico con demasiadas pestañas. El dashboard principal funciona como centro de acceso, configuracion, resumen y presencia. Los modulos operativos grandes deben abrir su propio workspace especializado cuando la complejidad lo justifique.

## 2. Problema que resuelve

Klicor esta pensado para negocios pequenos o medianos que normalmente venden por WhatsApp, Instagram, Facebook o voz a voz, pero no tienen una estructura clara para mostrar informacion.

Problemas que debe resolver:

- Tienen demasiados enlaces sueltos.
- Mandan fotos y precios por chat manualmente.
- No tienen catalogo, menu o tienda clara.
- No tienen una forma ordenada de recibir pagos.
- No tienen una pagina simple para compartir en redes.
- No tienen una presencia preparada para Dorika.
- Configurar tecnologia les da pereza o les quita tiempo.

## 3. Que existe hoy en codigo

Estado observado en el codigo actual del proyecto `klicor`.

### Onboarding rapido

Existe un flujo de publicacion rapida en `components/dashboard-onboarding.js`.

Pasos actuales:

- Tipo de negocio.
- Identidad.
- Contacto.
- Pagos.
- Diseno.

El onboarding usa `lib/dashboard-onboarding.js` para construir estado inicial, payload, preview y slots de accion.

Problema actual:

- Las pantallas tienen demasiado padding y cards grandes.
- En pantallas pequenas de PC o baja resolucion genera mucho scroll.
- Los indicadores de progreso ocupan demasiado alto porque el numero y el texto van en lineas separadas.
- Si se agregan mas preguntas, el flujo se volvera pesado si no se compacta primero.

### Link in bio

La vista publica se construye con:

- `components/landing-view.js`
- `lib/landing-layout.js`
- `lib/profile-links.js`
- `lib/link-catalog.js`

El link in bio usa:

- `profileLinks` para botones publicos.
- `paymentMethods` para pagos visibles.
- `appearance` para tema visual del link in bio.
- `contactCard` para boton de guardar contacto.

Decision reciente:

- Los enlaces ya no deben tener limite artificial por tipo.
- Los metodos de pago ya no deben estar limitados a 2.
- Los botones automaticos de tienda, menu, catalogo o agenda deben aparecer tambien en configuracion de enlaces para poder editar etiqueta y prioridad.
- El link in bio es la pantalla publica de inicio del negocio. La portada con logo, foto, slogan, redes y boton principal pertenece al link in bio, no a Agenda.
- El recorrido esperado es: cliente entra al link in bio, toca Agenda y desde ahi empieza el flujo de reserva.

### Editor completo

Existe en `components/profile-form.js`.

Areas actuales:

- Perfil e identidad.
- Enlaces y pagos.
- Diseno / temas del link in bio.
- Dorika.
- Commerce.
- Agenda.
- Seguridad, facturacion y suscripcion.

Problema actual:

- El editor tiene muchas secciones y algunas son grandes.
- El selector de temas del link in bio usa cards grandes.
- Hay datos de Dorika que no deberian pedirse de nuevo si ya estan definidos en el perfil del negocio.

### Commerce: tienda, menu y catalogo

La configuracion base esta en `lib/commerce-config.js`.

Modos actuales:

- `mitienda`: tienda con productos, precios y carrito.
- `mimenu`: menu con platos/bebidas, precios y pedido.
- `micatalogo`: catalogo sin precio obligatorio y sin carrito obligatorio.
- `micatalogo` debe evolucionar como experiencia visual tipo feed/Instagram, no como tienda sin precio.

El modo define:

- Etiquetas de categorias, subcategorias y productos.
- Si el precio es obligatorio.
- Si soporta carrito.
- URL publica.
- Si la accion principal es carrito o consulta directa por WhatsApp.

Problema actual:

- La experiencia publica de tienda/menu/catalogo hereda demasiado del estilo general del sistema.
- La apariencia de comercio todavia no esta separada conceptualmente del tema del link in bio.
- Las categorias del comercio se muestran o se piensan demasiado cerca de fotos, pero eso carga visualmente la experiencia.

### Agenda

Existe configuracion de agenda mediante `bookingConfig` y componentes como `BookingWorkspace`.

Debe mantenerse como modulo de citas reales, no como solucion generica para todo negocio de servicios.

Estado funcional actual:

- Servicios con duracion, precio, descripcion y profesionales asignados.
- Profesionales con foto, especialidad, servicios y horario individual.
- Horario general del negocio.
- Disponibilidad calculada para evitar cruces de horario.
- Citas con estados.
- Creacion manual de citas desde el panel.
- Vista publica en `/{username}/agenda`.
- Configuracion inicial de notificaciones en `bookingConfig`: aviso al negocio, aviso al cliente cuando se confirme, recordatorios y reactivacion.
- El proyecto ya usa Firebase Auth para dueños del negocio y puede extender esa misma base a clientes publicos de Agenda.
- El proyecto ya usa Resend en `lib/mailer.js` para correo transaccional.

Decision de producto:

- Una reserva publica debe entenderse como solicitud de cita cuando el negocio usa confirmacion manual.
- Si el negocio usa confirmacion automatica, la reserva publica debe comunicarse como cita confirmada.
- El negocio debe tener control para aceptar, rechazar o cambiar una solicitud antes de que se envie una confirmacion definitiva.
- La confirmacion automatica puede existir, pero no debe ser la suposicion principal para negocios que necesitan revisar su agenda.
- La experiencia publica de Agenda no debe duplicar el inicio del link in bio; debe enfocarse en servicios, profesional, fecha/hora, datos y resultado.
- El dashboard de Agenda debe conservar identidad Klicor, aunque la experiencia publica de Agenda tenga tono visual por vertical.
- Agenda debe servir a negocios donde el producto principal es un bloque de tiempo con cita real: barberias, salones de belleza, unas, spa, estetica, masajes, consultorios, odontologia, psicologia, fisioterapia, terapias, nutricion, centro de bienestar y casos similares de salud, belleza y bienestar.
- Agenda no debe aparecer para comercio puro ni para servicios operativos donde el flujo real es solicitud, diagnostico, cotizacion, orden de trabajo o seguimiento. Ejemplos: restaurantes, tiendas, catalogos, licores, moda, tecnologia, repuestos, regalos, papeleria, electricidad, plomeria, lavanderia, sastreria, taller automotriz, lavadero de autos, construccion, reparacion tecnica, legal, contable, publicidad y diseno.
- Si una categoria no permite Agenda, la opcion de crear o activar Agenda no debe mostrarse en la navegacion normal, tarjetas de modulo, configuracion ni CTA. No mostrar botones deshabilitados porque generan confusion.
- Si un negocio ya tenia Agenda y cambia a una categoria que no la permite, Agenda debe ocultarse sin borrar datos y mostrar una advertencia puntual solo en ese cambio o si entra por una ruta vieja.
- Un negocio con Agenda si puede activar tienda, menu o catalogo cuando su plan y categoria lo permitan. La regla es: Agenda puede convivir con comercio en negocios de citas; comercio puro no puede habilitar Agenda.
- Cuando un negocio con Agenda active comercio, la experiencia comercial debe usar un tema comercial sugerido por su vertical de servicio, no un tema generico ni el tema administrativo de Agenda.
- Los estados funcionales base son `pending`, `confirmed`, `completed`, `cancelled_by_customer`, `cancelled_by_business` y `no_show`.
- El cliente publico debe identificarse preferiblemente con login de Google mediante Firebase Auth. Asi Klicor obtiene nombre, email, foto y verificacion del proveedor sin pedir que escriba el correo.
- El primer uso de Agenda puede pedir login; la persistencia de sesion debe revisarse antes de produccion porque una sesion permanente en equipos compartidos es riesgo de seguridad.
- Tarea pendiente preproduccion: cambiar autenticacion de dueños/clientes a sesion no permanente por defecto o a una opcion explicita de "recordarme", validando que no rompa Google ni enlace magico.
- El telefono/WhatsApp se sigue pidiendo o confirmando porque es necesario para contacto operativo y recordatorios, pero el email para notificaciones debe salir de la cuenta autenticada cuando exista.
- El correo de notificacion al negocio debe usar por defecto el mismo correo con el que el negocio se logea en Klicor (`user.email`). No se debe pedir otro correo obligatorio para empezar.
- El correo al cliente y al negocio debe respetar el estado real: solicitud recibida, cita confirmada, cita reprogramada, cita cancelada/rechazada, o cambio operativo.
- WhatsApp debe ser principalmente recordatorio antes de la cita. No debe reemplazar el correo de confirmacion ni enviar reactivaciones por defecto.
- Para WhatsApp automatico se debe usar WhatsApp Business Platform/Cloud API con plantillas aprobadas cuando Klicor inicia el mensaje. Los recordatorios deben ser mensajes de utilidad, con consentimiento y configuracion del negocio.

### Dorika

Existe `dorikaProfile` y logica para decidir elegibilidad.

Decision importante:

- Dorika no debe volver a pedir informacion que Klicor ya sabe del negocio.
- Dorika debe usar los datos base del perfil, tipo de negocio, ubicacion y modulo activo.
- Dorika publico tiene su propio documento de producto en `../dorika/docs/arquitectura-producto-dorika.md`.
- Si se trabaja el buscador de Dorika desde un hilo de Klicor, se debe revisar ese documento antes de implementar.
- El buscador de Dorika debe consultar negocios, productos, rutas, categorias y descripciones de productos.
- Las sugerencias del buscador deben producir un cambio real: filtrar la experiencia, navegar a mapa/rutas/intencion o abrir resultados concretos.
- Un click en sugerencia o resultado no debe dejar al usuario en el mismo home sin cambio visible.
- Los resultados de producto deben abrir el producto correcto en Dorika o llevar al Klicor profundo correcto cuando esa sea la accion definida.
- La experiencia visual del buscador debe seguir el patron de Dorika: logo + barra compacta superior, como el estado que aparece al hacer scroll, no un modal pesado.

## 4. Modelo mental del producto

Klicor no debe verse como una sola pagina que cambia colores.

Debe separarse asi:

### Link in bio

Es la tarjeta publica principal del negocio.

Sirve para:

- Presentar el negocio.
- Mostrar botones importantes.
- Mostrar redes.
- Mostrar metodos de pago.
- Guardar contacto.
- Llevar a tienda, menu, catalogo o agenda cuando el tipo de negocio permita ese modulo.
- Ser el punto de entrada publico antes de que el cliente abra Agenda.

Tema visual:

- Usa `appearance`.
- Puede tomar colores del logo.
- Debe ser flexible y sencillo.
- No debe ser duplicado por la pantalla publica de Agenda.

### Tienda / menu / catalogo

Es una experiencia comercial.

Sirve para:

- Explorar productos, platos, referencias o servicios vendibles.
- Ver detalle.
- Agregar al carrito si aplica.
- Consultar por WhatsApp si el negocio no necesita carrito.

Tema visual:

- No debe depender directamente del tema del link in bio.
- Debe tener `commerceTheme` propio en el futuro.
- Debe elegirse por vertical, tipo de producto y audiencia.

Regla clave:

- `mimenu` y `mitienda` pueden compartir logica de carrito, pero no deben verse iguales.
- `micatalogo` no debe compartir carrito, checkout, totales ni boton `+`.
- `micatalogo` debe usar una experiencia visual tipo feed: imagen dominante, texto minimo, detalle full screen y CTA fijo a WhatsApp.
- Al consultar un producto desde `micatalogo`, el mensaje de WhatsApp debe armarse con el producto consultado.

Mensaje base:

```txt
Hola, vi este producto en tu catalogo:
[Nombre producto]

Esta disponible?
```

### Agenda

Es una experiencia de reserva.

Sirve para:

- Servicios.
- Citas.
- Profesionales.
- Horarios.
- Solicitudes de cita.
- Confirmacion manual o automatica segun configuracion.
- Reprogramacion y cambios de agenda.
- Recordatorios y mensajes posteriores cuando el negocio los active.

Regla mental:

- Agenda es para citas reales reservables por tiempo.
- Agenda no es tienda, menu ni catalogo de productos.
- Agenda no es Reservas de turismo, planes, cupos o experiencias.
- Reservas debe quedar como modulo separado para experiencias, actividades, fechas especiales y cupos.
- Reservas queda como modulo futuro separado para hoteles, glamping, canchas sinteticas de futbol/microfutbol y negocios que manejan recursos, noches, cupos, fechas o espacios; no debe resolverse forzando Agenda.
- Comercio puro no debe ver Agenda en la navegacion normal ni en llamados a la accion.
- Negocios de Agenda pueden tener tienda, menu o catalogo si venden productos, bonos, paquetes o complementos.
- Agenda publica empieza despues del link in bio; no necesita portada propia del negocio.
- El tono visual publico de Agenda puede variar por vertical o marca.
- El admin de Agenda mantiene el sistema visual de Klicor.

### Dorika

Es una capa de descubrimiento.

Sirve para:

- Mostrar negocios en ciudad.
- Filtrar por intencion.
- Aprovechar datos ya configurados en Klicor.
- Permitir busqueda rapida por negocio, producto, descripcion de producto, categoria y ruta.
- Llevar al usuario a una vista con contexto, no a enlaces genericos que se sientan falsos.

## 5. Decisiones tomadas

### 5.1 Link in bio y commerce deben tener temas separados

Estado: aprobado, pendiente de implementar.

El link in bio puede seguir usando `appearance`.

Tienda/menu/catalogo necesita un tema separado, posiblemente:

```txt
commerceTheme
commerceVertical
commerceAudience
commerceProductMix
```

No se debe hacer que tienda/menu/catalogo simplemente hereden los colores del link in bio.

Razon:

- Un link in bio es una tarjeta de identidad.
- Una tienda/menu/catalogo es una experiencia de venta.
- El producto debe ser protagonista.

### 5.2 Categorias deben usar assets semanticos, no fotos

Estado: aprobado, en implementacion progresiva.

Regla:

- Categorias principales = assets semanticos de categoria + nombre.
- Subcategorias = texto de organizacion, sin asset, sin icono y sin color propio.
- El color visible de categorias lo decide el tema del comercio, no el usuario manualmente.
- Productos = fotos.
- Banners/portadas = imagenes emocionales.

No se deben pedir fotos para categorias como flujo principal.

El asset semantico de categoria no es un icono lineal de interfaz, no es una foto y no debe verse como un simbolo plano tecnico. Debe parecer una miniatura visual de producto o familia de productos: aretes para `Aretes`, collar para `Collares`, sandalias para `Sandalias`, plato servido para `Platos fuertes`, vaso/botella para `Bebidas`, etc.

El dashboard administrativo debe mostrar el mismo asset de categoria que vera el cliente en la vista publica. Los iconos lineales quedan solo para acciones del sistema, navegacion y botones administrativos.

Decision actual de bajo costo:

- La base comercial canonica vive en `lib/commerce-category-target-catalog.js` con 241 categorias objetivo por linea, nombre y aliases.
- Los assets fuente/revision por categoria viven en `public/commerce-assets/categories-ai-1254-review`, exportados como PNG transparentes de 1024x1024 desde sheets revisados sin fondo.
- Los assets activos de runtime viven en `public/commerce-assets/categories-ai-runtime`, exportados como WebP transparentes de 192x192. Esta es la carpeta que debe cargar Klicor en admin y vista publica.
- `lib/commerce-category-local-assets.js` amarra cada categoria canonica con su WebP runtime. La busqueda por nombre y aliases sigue viviendo en `lib/commerce-category-target-catalog.js`.
- El selector administrativo y la vista publica deben usar esos assets IA locales como representacion principal de categorias.
- Microsoft Fluent Emoji 3D queda como material local/fallback y referencia, no como catalogo visual principal para categorias comerciales.
- Esta decision reduce costo, dependencia externa y pixelacion. No se debe documentar como catalogo propio final: cuando existan suficientes negocios y categorias reales, se podra crear una base visual propia por bloques y reemplazar gradualmente estos assets.

Meta de cobertura:

- El catalogo objetivo de Klicor es de aproximadamente 1200 assets semanticos de categoria.
- La meta de cobertura funcional es acercarse al 100% de categorias comunes por tipo de negocio y dejar un margen de error cercano al 10% para nombres muy particulares.
- El catalogo debe crecer por vertical y por tipo de negocio: comida/menu, moda/calzado, joyeria/accesorios, belleza, farmacia/salud, tecnologia, hogar, ferreteria, papeleria, mascotas, bebe, deportes, vehiculos, turismo y servicios.
- No se deben cargar ni mostrar 1200 assets al usuario de una vez. El sistema debe recomendar de 3 a 6 opciones segun lo que escriba y ofrecer `Ver mas opciones` solo si el negocio quiere explorar.

Razon:

- Las fotos en categorias hacen la interfaz pesada.
- Son dificiles de mantener consistentes.
- Cargan visualmente la experiencia.
- Aumentan friccion para el usuario.
- Las subcategorias con icono duplican ruido visual y confunden jerarquia: la categoria guia visualmente, la subcategoria ordena por texto.

Se debe crear un selector visual de assets semanticos, no una lista de texto ni una pared completa de opciones.

Comportamiento esperado del selector:

- Cuando el usuario escribe el nombre de la categoria, Klicor sugiere 3 a 6 assets recomendados.
- Si el usuario busca manualmente, los resultados tambien deben ser recomendados y limitados.
- Si no le gusta ninguna recomendacion, puede abrir `Ver mas opciones`.
- El catalogo completo debe estar filtrado por vertical, tipo de negocio y contexto; no debe mostrarse completo desde el inicio.
- Subcategorias no muestran selector visual.

Primera aproximacion:

- Usar un catalogo curado de assets semanticos por vertical.
- Cubrir sinonimos y negocios comunes de comida, retail, servicios, salud/belleza y turismo.
- Resolver palabras ambiguas usando la vertical del negocio cuando exista.
- Preferir catalogo controlado antes que un buscador infinito.
- Los iconos lineales como Lucide quedan permitidos para UI administrativa, pero no como representacion principal de categorias publicas.

Implementacion por bloques:

- La meta de 1200 assets debe construirse por bloques reales, no con variaciones nominales del mismo icono.
- Cada bloque debe tener assets visuales distinguibles y medibles antes de marcarlo como cubierto.
- El primer bloque en trabajo es `Calzado`: categorias globales de zapato, uso y forma. Color, talla, marca y material son filtros/subcategorias/productos; no assets principales.
- La vista publica solo resuelve visualmente el asset elegido; el selector administrativo carga el bloque contextual necesario para buscar y elegir.

### 5.3 Moda y calzado no deben tematizarse por estereotipo

Estado: aprobado como criterio de producto.

No hacer:

- Ropa = rosado.
- Zapatos = cafe.

Problema:

- Una tienda de ropa puede ser mujer, hombre o mixta.
- Una tienda de zapatos puede ser mujer, hombre o mixta.
- Hay negocios que venden ropa y zapatos juntos.

Mejor modelo:

```txt
businessCategory: retail_sales
theme.base: fashion
theme.variant: female | male | mixed
theme.subcategory: clothing | shoes | clothing_shoes | accessories | general
```

Los temas deben depender de audiencia/estilo comercial, no solo del producto.

Temas iniciales sugeridos:

- `fashion_female`: moda mujer, zapatos mujer, accesorios mujer.
- `fashion_male`: moda hombre, zapatos hombre.
- `fashion_mixed`: tiendas mixtas, ropa y zapatos, moda general.

La persona debe poder cambiar el tema sugerido si su marca va por otra direccion.

No crear temas separados para cada combinacion como `ropa_mujer`, `zapatos_mujer`, `ropa_hombre` y `zapatos_hombre`. Moda y calzado deben compartir base `fashion`, cambiar por `variant` y ajustar detalles por `subcategory`.

Valores operativos en registro:

- `clothing_female`, `clothing_male`, `clothing_mixed`
- `shoes_female`, `shoes_male`, `shoes_mixed`
- `clothing` y `shoes` quedan como compatibilidad legacy/general.

Reglas de variantes:

#### Female

- Aplica a ropa mujer, zapatos mujer y accesorios mujer.
- Fondo claro: blanco, crema o nude muy suave.
- Primario: rosado, nude o morado suave.
- Cards con mas aire.
- Tipografia mas ligera.
- Imagenes lifestyle con modelo cuando el negocio tenga ese tipo de material.
- Sensacion: estetica y aspiracional.

#### Male

- Aplica a ropa hombre y zapatos hombre.
- Fondo blanco o gris claro.
- Primario: negro, azul oscuro o verde militar.
- Cards mas compactas.
- Tipografia mas solida.
- Imagenes de producto directo o lifestyle sobrio.
- Sensacion: fuerte, directo y practico.

#### Mixed

- No es mezcla de colores; es neutralidad + organizacion.
- Fondo blanco, gris claro o beige.
- Primario neutro: negro o gris oscuro.
- Acento suave tomado del negocio cuando exista.
- Debe evitar sesgo visual hacia mujer u hombre.
- Si el negocio vende para ambos, debe existir filtro visible arriba: `Mujer` y `Hombre`.
- Puede separar categorias como `Mujer` y `Hombre` cuando ayude a explorar.
- Imagenes equilibradas, con mas enfoque en producto y no solo modelos.
- Sensacion: tienda real, amplia y ordenada.

Reglas para zapatos:

- Zapatos comparte base `fashion`, pero no debe verse exactamente igual a ropa.
- Cards mas grandes.
- Imagen mas protagonista.
- Menos texto.
- Mas foco en detalle, textura, silueta y tipo de producto.

Errores a evitar:

- Mezclar rosado y negro sin logica.
- Mezclar estilos incompatibles, por ejemplo elegante y urbano sin estructura.
- Tratar `mixed` como suma de `female` + `male`.
- No separar hombre/mujer en tiendas mixtas cuando el producto lo requiere.

### 5.4 Sistema de modulos commerce y layout

Estado: aprobado, pendiente de implementar.

Klicor debe separar tema visual, modulo y layout.

Modelo recomendado:

```txt
commerceExperience.module: mimenu | mitienda | micatalogo
commerceExperience.category: food | store | services | health | tourism
commerceExperience.subcategory: pizza | grocery | fashion | shoes | tech | general | etc
commerceExperience.variant: female | male | mixed | neutral
commerceLayout: menu_list | store_grid | catalog_feed
commerceTheme: food_fast | food_pizzeria | grocery_fresh | fashion_female | fashion_male | fashion_mixed | tech_blue | general_market | services_clean | health_soft | tourism_earth | etc
```

Reglas por modulo:

- `mimenu`: lista vertical, cards horizontales, imagen, nombre, precio, boton `+`, carrito fijo y pedido por WhatsApp.
- `mitienda`: grid de productos, cards compactas, precio, boton `+`, carrito fijo y pedido por WhatsApp.
- `micatalogo`: feed visual, imagen dominante, nombre minimo, precio opcional, SIN carrito, SIN checkout, SIN totales, consulta por WhatsApp.

Reglas de visibilidad comercial:

- `visible=false` en producto significa ocultar de verdad; no debe aparecer en tienda, menu, catalogo, carrito, deep link publico ni snapshots publicos.
- `available=false` en producto significa agotado/no disponible; el producto se sigue mostrando para que el cliente entienda que el negocio lo maneja, pero no permite agregar al pedido ni consultar por WhatsApp.
- Categorias y subcategorias tambien pueden estar ocultas. Si una categoria esta oculta, no se muestra esa categoria ni sus subcategorias/productos. Si una subcategoria esta oculta, no se muestran sus productos en publico.
- Mover una subcategoria a otra categoria debe mover tambien los productos que contiene para evitar productos huerfanos o inconsistencias entre `categoryId` y `subcategoryId`.
- Al editar un producto existente debe poder cambiarse su categoria/subcategoria sin borrar fotos, precio ni descripcion.
- Los precios en el dashboard deben mostrarse con separador de miles mientras se escriben, pero guardarse internamente como numero limpio.

Temas base iniciales:

- Comida: crema, naranja/rojo calido, producto protagonista, sensacion de apetito.
- Supermercado: verde, fresco, iconos simples, sensacion de compra diaria.
- Moda: base `fashion` con variantes `female`, `male`, `mixed`.
- Zapatos: usa base `fashion`; cambia layout y detalle visual por `subcategory`.
- Tecnologia: azul/oscuro, mas contraste, sensacion premium.
- Servicios: blanco/azul, limpio, profesional, confianza.
- Salud: menta/lavanda, aire, calma.
- Turismo: tierra/azul cielo, visual, inmersivo, experiencia.

### 5.5 Onboarding debe compactarse antes de agregar mas preguntas

Estado: aprobado, alta prioridad.

Antes de agregar preguntas de vertical, audiencia, tipo de tienda o iconos, se debe compactar el onboarding.

Cambios pendientes:

- Reducir padding general.
- Reducir altura de cards.
- Poner indicadores de progreso en una sola linea: `1 Tipo de negocio`.
- Evitar pasos con scroll excesivo en pantallas pequenas de PC.
- Hacer mas pequenas las cards de temas.
- Hacer mas compacto pagos/contacto/diseno.

### 5.6 Nombre del negocio y usuario publico

Estado: aprobado, pendiente de implementar.

No se debe autollenar el nombre del negocio desde el nombre de la persona o correo.

Campo:

- Label o placeholder debe orientar a: `Nombre de tu negocio`.

Usuario/nickname:

- Debe generarse desde el nombre del negocio mientras se escribe.
- La mayoria usara el mismo nombre del negocio.
- Solo si el usuario esta ocupado se debe sugerir una variacion.

### 5.7 Cambios de copy en onboarding

Estado: aprobado, pendiente de implementar.

Cambios:

- `Titulo comercial` debe pasar a `Slogan de tu negocio`.
- Si no hay logo cargado, el upload debe decir `Carga el logo de tu negocio`.
- Donde el enlace corresponde a Google Maps no debe decir `Servicios`; debe decir `Ubicacion`.

### 5.8 Dorika no debe duplicar seleccion de negocio

Estado: aprobado, pendiente de implementar.

La informacion de que hace/vende el negocio debe vivir en Klicor como dato base.

Dorika debe leer:

- Categoria.
- Tipo de negocio.
- Vertical comercial.
- Ubicacion.
- Modulo activo.
- Productos destacados si aplica.

No debe pedir otra vez la misma clasificacion si ya existe.

### 5.9 Ubicacion del negocio en onboarding

Estado: aprobado, implementado como base.

El registro rapido no debe pedir un link manual de Google Maps. La ubicacion debe capturarse con un mapa y guardarse como coordenadas.

Reglas:

- El usuario selecciona el punto del negocio en el mapa.
- El sistema guarda latitud y longitud.
- Si se necesita boton de ubicacion en el link publico, el enlace se genera desde las coordenadas.
- Dorika puede reutilizar esa misma ubicacion sin volver a preguntarla.

### 5.10 Editor compacto por defecto

Estado: aprobado, implementado como base visual.

El editor completo debe ocupar menos alto en pantallas pequenas de PC. Enlaces, Diseno, Perfil y Dorika deben usar padding reducido, inputs mas densos y cards mas pequenas.

Reglas:

- Compactar sin quitar funcionalidad.
- No tocar la vista previa del telefono si esta funcionando.
- Mantener legibilidad y acciones claras.

### 5.11 Lector de colores del logo

Estado: aprobado, implementado como primera mejora.

El tema sugerido desde el logo debe evitar tomar fondos como color principal.

Reglas:

- Penalizar colores dominantes en bordes o fondos.
- Priorizar colores con saturacion e intencion de marca.
- Mantener fallback si el logo no permite extraer una paleta confiable.

### 5.12 Klicor debe operar con workspaces especializados

Estado: aprobado como direccion de arquitectura de producto.

Klicor principal debe ser el centro comun del negocio:

- Inicio.
- Resumen.
- Perfil y link in bio.
- Enlaces.
- Clientes.
- Pagos.
- Suscripcion.
- Configuracion general.
- Acceso a modulos activos.

Los modulos que crecen en operacion diaria no deben quedar comprimidos como una pestaña mas dentro del dashboard principal. Deben abrir un workspace operativo propio con navegacion interna y herramientas ajustadas al tipo de negocio.

Workspaces previstos:

- `Klicor Agenda`: barberias, salones, unas, spas, estetica, masajes, consultorios, salud/bienestar, terapias, nutricion, fisioterapia, odontologia, psicologia y negocios de cita real.
- `Klicor POS Restaurante`: restaurantes, comidas rapidas, cafes, bares, mesas, comandas, caja, cocina y domicilios.
- `Klicor POS Retail`: ropa, zapatos, accesorios, joyerias y tiendas con variantes, inventario, ventas, caja y catalogo.
- `Klicor POS Supermercado`: supermercados, minimercados y tiendas de barrio con codigo de barras, proveedores, compras, inventario rapido y caja.
- `Klicor Servicios`: ordenes de trabajo, cotizaciones, clientes y pagos para negocios que no son agenda pura.
- `Klicor Turismo/Reservas`: hoteles, glamping, canchas sinteticas, rutas, experiencias, cupos, fechas especiales, guias, recursos y disponibilidad.

Reglas:

- El dashboard principal no debe absorber toda la operacion.
- Cada workspace mantiene identidad Klicor, pero su navegacion y herramientas internas responden al trabajo real del negocio.
- El link in bio y Dorika siguen siendo experiencias publicas separadas.
- Dorika consume datos publicos generados por Klicor y por los workspaces, pero no reemplaza la operacion.
- Antes de hacer crecer un modulo complejo dentro de una sola pantalla, evaluar si debe convertirse en workspace.

### 5.13 Planes, modulos y suscripcion

Estado: aprobado como regla de producto antes de salida a produccion.

El plan no debe confundirse con el modulo activo. En Klicor deben separarse tres conceptos:

- `plan`: capacidad maxima, precio y ciclo de cobro.
- `businessCategory` / `businessType`: modulo recomendado al registrarse.
- `enabledModules`: modulos realmente habilitados para esa cuenta.

Regla general:

```txt
Puede usar un modulo si:
1. la cuenta esta en trial o activa
2. el modulo esta habilitado para esa cuenta
3. el plan permite esa capacidad
4. la categoria/tipo de negocio permite ese modulo
```

La categoria es una compuerta de producto, no solo una sugerencia visual. El plan puede dar capacidad, pero no debe mostrar ni activar modulos que no corresponden al trabajo real de ese negocio.

#### Trial

- Dura 30 dias por defecto.
- Al registrarse, se habilita automaticamente el modulo principal segun el tipo de negocio.
- Durante el trial, el cliente puede probar modulos permitidos por su categoria.
- En trial puede probar Commerce y Agenda solo si su categoria permite esos modulos. Un comercio puro no debe ver ni activar Agenda por estar en trial.
- Commerce en trial permite hasta 50 productos.
- Agenda esta disponible en trial solo para categorias de citas reales.
- Si el cliente paga durante el trial, no pierde los dias gratis restantes.
- El ano pagado empieza despues de terminar el trial.

#### Basico

- Es solo link in bio.
- Incluye perfil publico, link personalizado, QR, botones/enlaces, metodos de pago, horarios y personalizacion basica.
- No incluye Commerce.
- No incluye Agenda.
- No incluye tienda, menu, catalogo, reservas, automatizaciones ni analiticas avanzadas.
- Una cuenta que paga Basico no debe conservar Commerce ni Agenda por haberlos probado en trial.

#### Comercial

- Es para un modulo operativo principal.
- Puede ser Commerce o Agenda, segun lo que el cliente pago/configuro.
- Si el modulo activo es Commerce, permite hasta 50 productos.
- Si el modulo activo es Agenda, permite agenda funcional segun el tipo de negocio.
- No incluye Commerce y Agenda al mismo tiempo.
- Si el cliente quiere Commerce + Agenda y su categoria permite Agenda, debe pasar a Plus.

#### Plus

- Permite combinar modulos.
- Puede tener Commerce + Agenda al mismo tiempo solo si la categoria permite Agenda.
- Commerce permite hasta 300 productos.
- Agenda puede activarse si el cliente la desea y su categoria es de citas reales.
- Aplica para negocios mixtos, por ejemplo barberia o salon que agenda citas y tambien vende productos.

#### Pro, institucional, agencia y cortesia

- Deben permanecer como planes ocultos o administrativos.
- Sirven para casos especiales, convenios, agencias, pruebas internas o mayor capacidad.
- Se manejan desde administracion, no como planes publicos principales.

#### Upgrade Comercial a Plus

- No se cobra un monto pequeno proporcional por los dias restantes.
- Se cobra un ano nuevo de Plus desde la fecha del upgrade.
- Se descuenta el valor no usado del plan Comercial.
- La nueva fecha de vencimiento pasa a ser un ano desde el upgrade.
- Si existe un plan pago activo y vigente, el cliente no puede pagar un plan inferior. Ejemplo: `plus` vigente no puede pagar `commercial`; debe esperar vencimiento o pedir ajuste manual.
- El bloqueo debe existir en el backend al crear checkout y tambien al procesar webhook, para evitar que un link de pago viejo active un downgrade accidental.

Formula:

```txt
credito = precioComercial * diasRestantes / 365
valorUpgrade = precioPlus - credito
nuevoVencimiento = fechaUpgrade + 1 ano
```

El pago de upgrade debe guardarse con metadatos claros:

```txt
paymentType: "upgrade"
fromPlan: "commercial"
toPlan: "plus"
creditAmount
amountCharged
previousExpiresAt
newExpiresAt
```

#### Matriz de modulos por tipo de negocio

Agenda:

- Solo se muestra para negocios de cita real: barberia, salon de belleza, unas, spa, estetica, masajes, consultorios, odontologia, psicologia, fisioterapia, terapias, nutricion, centro de bienestar y equivalentes de salud, belleza y bienestar.
- Yoga/pilates, gimnasio y servicios para mascotas generico salen de Agenda MVP. Yoga/pilates y gimnasio pertenecen a un futuro flujo de Clases/Membresias/Reservas; mascotas debe dividirse despues entre veterinaria/peluqueria canina, tienda, guarderia/hotel o solicitudes.
- No se muestra para comercio puro: restaurantes, comida rapida, tienda, menu, catalogo, licores, moda, tecnologia, repuestos, regalos, papeleria, supermercado, tienda de barrio y negocios similares.
- No se muestra para servicios operativos donde el flujo natural es solicitud/cotizacion/orden de trabajo: electricidad, plomeria, limpieza, lavanderia, sastreria, lavadero de autos, taller automotriz, reparacion tecnica, construccion/remodelacion, transporte, legal, contable, publicidad y diseno.
- Si la categoria no permite Agenda, no debe existir CTA de crear Agenda, tarjeta de activacion, item de navegacion ni modulo vacio. Solo se puede mostrar una advertencia contextual si el negocio ya tenia datos de Agenda y cambio a una categoria donde Agenda se oculta.

Commerce:

- Commerce puede estar disponible para comercio puro y tambien para negocios de Agenda cuando vendan productos, bonos, paquetes o complementos.
- Si un negocio de Agenda activa tienda/menu/catalogo, se le asigna un tema comercial segun su vertical de servicio. La tienda no debe heredar el estilo administrativo de Agenda.
- Ejemplos de mapeo inicial: barberia usa tema premium urbano; belleza/unas/estetica usan un tema suave de belleza; spa/masajes usan tema natural; salud/bienestar/terapias/nutricion usan tema calmado de bienestar; consultorios/odontologia usan tema limpio de salud.
- Temas definidos para comercio en negocios de Agenda: `barber_clean` para barberia; `beauty_soft` para salon, unas y estetica; `spa_natural` para spa y masajes; `wellness_calm` para psicologia, terapias, nutricion y centro de bienestar; `health_clean` para odontologia y consultorio medico.
- Los temas no son solo cambio de color: deben transmitir confianza, lujo, limpieza, relajacion, salud, cercania o precision segun la vertical.

Reservas:

- Reservas no es Agenda. Debe quedar como modulo futuro para hoteles, glamping, canchas sinteticas, alojamientos, espacios, cupos, noches, fechas o recursos.
- Restaurantes podrian necesitar reservas en el futuro, pero no se habilita por ahora.

#### Temas de commerce segun negocio

- Commerce debe ajustar o recomendar tema segun tipo de negocio.
- Barberia, salon, unas, spa, estetica y bienestar deben tomar un tema comercial sugerido por vertical cuando activen tienda/catalogo.
- Deben reutilizarse los temas existentes antes de crear un sistema nuevo.
- El usuario debe poder cambiar el tema sugerido.

## 6. Mejoras propuestas por area

### Onboarding rapido

Prioridad: alta.

Objetivo:

- Que el usuario configure lo esencial sin sentir que esta llenando un formulario largo.
- Prepararlo para seleccionar mejor su modulo comercial sin aumentar friccion.

Pendiente:

- Compactar layout.
- Mejorar indicadores de progreso.
- Cambiar copy de identidad.
- Autogenerar usuario desde nombre del negocio.
- Hacer temas mas pequenos.
- Preparar espacio para preguntas de comercio.

No tocar por ahora:

- La validacion de Firebase/auth.
- La estructura general de guardado si no es necesario.
- El flujo de `api/profile` salvo que sea requerido por nuevos campos.

### Link in bio

Prioridad: media.

Objetivo:

- Mantenerlo como identidad del negocio.
- No convertirlo en tienda.
- Mantener enlaces, pagos, contacto y botones automaticos.

Pendiente:

- Seguir permitiendo enlaces y metodos de pago sin limites artificiales.
- Mantener botones automaticos editables para tienda/menu/catalogo/agenda.

No tocar por ahora:

- El sistema de prioridades actual salvo ajuste especifico.
- La vista publica si el cambio pertenece realmente a commerce.

### Tienda / menu / catalogo

Prioridad: alta despues de compactar onboarding.

Objetivo:

- Que sea una experiencia comercial distinta al link in bio.
- Crear temas por vertical y audiencia.
- Hacer que categorias usen iconos.

Pendiente:

- Crear `commerceTheme`.
- Crear temas MVP.
- Crear catalogo de 1200 assets semanticos de categoria por vertical y tipo de negocio.
- Cambiar categorias para usar asset semantico en vez de foto.
- Quitar assets/iconos de subcategorias; deben quedar como texto de organizacion.
- Cambiar selector de categorias para mostrar recomendados y abrir el catalogo completo solo bajo accion del usuario.
- Definir si el modo usa carrito o consulta WhatsApp.
- Crear layout separado para `micatalogo` tipo feed visual.
- Generar mensaje automatico de WhatsApp con el nombre del producto consultado en `micatalogo`.

Temas MVP sugeridos:

- `food_fast`: naranja/rojo fuerte, producto protagonista para comidas rapidas.
- `food_pizzeria`: calido, naranja/ambar, mejor para pizzeria.
- `food_menu_clean`: restaurante/cafe claro y limpio.
- `grocery_fresh`: supermercado, verdes, ofertas y productos diarios.
- `fashion`: moda/calzado base con variantes `female`, `male`, `mixed`.
- `tech_blue`: tecnologia, azul/frio, fichas claras.
- `general_market`: tienda general, multi categoria.
- `premium_catalog`: catalogo elegante sin carrito obligatorio.
- `whatsapp_catalog`: catalogo de consulta directa por WhatsApp.

No tocar por ahora:

- No crear 30 temas.
- No rehacer todo commerce de una vez.
- No hacer una app nativa.
- No cambiar la base de productos si no hace falta.
- No convertir `micatalogo` en tienda sin precio.
- No agregar carrito ni checkout al catalogo.

### Agenda

Prioridad: media-alta cuando el foco sea citas reales.

Objetivo:

- Convertirla progresivamente en `Klicor Agenda`, un workspace operativo propio para citas reales.
- Se debe beneficiar de la categoria del negocio, pero no mezclarse con tienda.
- Debe aparecer solo para categorias de cita real; comercio puro y servicios operativos no deben ver la opcion de crear Agenda en navegacion normal.
- Puede convivir con tienda/menu/catalogo en negocios de Agenda cuando vendan productos, bonos, paquetes o complementos.
- Dar control al negocio sobre solicitudes, confirmaciones y cambios de agenda.
- Convertir Agenda en una herramienta operativa para negocios con uno o varios profesionales.
- Mantener el dashboard de Agenda dentro del sistema visual de Klicor.
- Permitir que la experiencia publica de Agenda adapte tono por vertical sin duplicar el link in bio.
- Permitir una ruta inicial de Agenda con servicios, profesionales, horarios, link publico, solicitudes/citas, estados y confirmacion manual o automatica.
- Permitir una ruta pro con operacion diaria avanzada, citas manuales, reprogramacion, disponibilidad por profesional/horario, notificaciones, recordatorios, reactivacion e historial basico del cliente.

Estado MVP implementado en pruebas:

- La reserva publica respeta la configuracion del negocio: `pending` si hay confirmacion manual y `confirmed` si hay confirmacion automatica.
- El texto publico cambia entre "Solicitar cita" y "Agendar cita" segun esa configuracion.
- El cliente publico debe iniciar sesion con Google para enviar la cita y la cita guarda identidad autenticada cuando existe.
- El cliente publico debe aceptar terminos y politica de privacidad antes de crear su primera cita si no tiene consentimiento vigente de Agenda.
- La aceptacion de Agenda se guarda por `customerUid` en `publicBookingCustomers`, con version de terminos, version de privacidad, fecha servidor, origen, negocio asociado, user agent e IP hasheada. No se debe crear una cuenta Klicor de negocio solo por ser cliente final de Agenda.
- Desde 18 de mayo de 2026, Agenda y futuras Reservas tienen version legal propia (`booking-terms-2026-05-18` y `booking-privacy-2026-05-18`) para pedir nueva aceptacion al cliente final sin forzar una nueva aceptacion general al dueno del negocio.
- Si el cliente ya tiene consentimiento vigente, la vista publica no vuelve a mostrar la casilla. Solo se vuelve a pedir si cambia la version legal requerida.
- La disponibilidad publica consulta el servicio y profesional seleccionados, aplica hora de Colombia y exige al menos 30 minutos de anticipacion.
- El negocio recibe correo operativo cuando entra una solicitud o cita nueva, si `notifyBusinessOnRequest` esta activo.
- El cliente recibe correo de cita confirmada solo cuando la cita queda en `confirmed`; en confirmacion manual no recibe confirmacion definitiva hasta que el negocio acepte.
- Reprogramaciones y cancelaciones generan correo transaccional al cliente cuando hay correo autenticado.
- La falla de correo no bloquea la creacion de la cita; se registra en `emailDelivery`.
- El endpoint de recordatorios por correo existe en `/api/booking/reminders/cron` y puede ejecutarse con `CRON_SECRET`.
- GitHub Actions fue retirado como scheduler de recordatorios para evitar dependencia de la rama default y permitir jobs separados por ambiente.
- La ruta tecnica elegida para el siguiente paso es Google Cloud Scheduler llamando el endpoint cada 5 minutos con `Authorization: Bearer CRON_SECRET`.
- El panel de Agenda actualiza citas por escucha en tiempo real para la fecha/profesional visibles, sin recargar toda la pagina.
- El panel no debe usar polling permanente para simular tiempo real. Queda como respaldo el refresco al volver a enfocar la pestana y un boton manual `Actualizar`.
- Las reglas de Firestore para `users/{uid}/bookingAppointments` deben estar desplegadas en `bioimpulso` y `klicor-6fc3e`; Vercel no despliega esas reglas.
- La pantalla final publica ofrece WhatsApp, volver a Agenda e Inicio.

Pendiente funcional:

- Pulir UX de rechazo/cancelacion para que "rechazar solicitud" sea una accion explicita y no dependa solo del selector de estado.
- Mejorar operacion diaria avanzada con vistas por profesional, filtros y reprogramacion mas ergonomica.
- Completar agendamiento manual desde el negocio con menos pasos y mejor preseleccion desde la grilla.
- Crear navegacion interna contextual de `Klicor Agenda` como workspace especializado, accesible desde el dashboard principal.
- Configurar reactivacion de clientes por dias sin volver, apagada por defecto.
- Preparar historial basico de cliente cuando se pueda identificar por telefono.
- Crear una coleccion o subcoleccion de clientes por negocio para recordar nombre, email autenticado, telefono, ultima cita y preferencias/consentimiento de mensajes.
- Permitir mas adelante una lista opcional de destinatarios para avisos al negocio; por ahora se usa `user.email`.
- Opcionalmente permitir acuse de recibo de solicitud como configuracion separada, sin confundirlo con confirmacion definitiva.
- Definir plantillas oficiales de WhatsApp para recordatorio de cita antes de activar ese canal en produccion.

Decision tecnica sobre recordatorios:

- El endpoint `/api/booking/reminders/cron` usa `CRON_SECRET` y rechaza llamadas si el secreto no existe o no coincide.
- Segun la documentacion oficial vigente de Vercel Cron Jobs, en Hobby los cron solo pueden correr una vez al dia y con precision horaria aproximada; eso no sirve para recordatorios de 30 o 60 minutos antes de una cita.
- La ruta MVP elegida es Google Cloud Scheduler como scheduler externo, primero en `klicor-pruebas` y despues en `klicor` produccion.
- Cada ambiente debe tener su propio job y su propio `CRON_SECRET`; no compartir secretos entre pruebas y produccion.
- Si el proyecto Vercel tiene Deployment Protection, el job tambien debe enviar `x-vercel-protection-bypass` con un bypass secret de automatizacion del proyecto.
- Mientras el proyecto siga en Vercel Hobby, no agregar un cron frecuente a `vercel.json` porque rompe o degrada el despliegue.
- La respuesta del endpoint debe conservar diagnostico operativo (`stats`) para confirmar si envio, omitio por ventana, omitio por estado o ya estaba enviado.

Pendiente separado de Agenda:

- Validar Mercado Pago en entorno de pruebas con credenciales sandbox/test, sin copiar credenciales productivas a `klicor-pruebas`.
- Probar que cada plan cobre el valor correcto y que los limites de plan se apliquen tanto en UI como en backend.

No definido todavia:

- UX/UI final de la agenda operativa.
- Imagenes de apoyo.
- Copy final de correos, WhatsApp o mensajes automatizados.
- Variantes visuales finales del flujo publico por vertical.
- Proveedor final de WhatsApp si se usa Cloud API directo de Meta o un BSP; la regla funcional no cambia: deben ser plantillas aprobadas y mensajes configurables.
- Si habra modo invitado sin Google para negocios que quieran menos friccion; por ahora la ruta preferida para notificaciones por email es cliente autenticado.

No tocar por ahora:

- No rehacer booking mientras se trabaja commerce/onboarding.
- No mezclar Agenda con Reservas de turismo, planes o cupos.
- No mostrar Agenda a comercio puro ni servicios operativos con la idea de explicar que no aplica; si no aplica, se oculta.
- No activar automatizaciones de retorno sin decision explicita.
- No crear una portada publica de Agenda que repita el link in bio.
- No hacer que el dashboard de Agenda herede el tema publico del negocio.

### Dorika

Prioridad: media.

Objetivo:

- Usar datos de Klicor para mostrar negocios.
- No duplicar preguntas.

Pendiente:

- Eliminar o reducir campos duplicados de clasificacion en configuracion Dorika.
- Usar la clasificacion del negocio para filtros y sheets.

No tocar por ahora:

- No redisenar mapa ni rutas desde Klicor.
- No mezclar logica de Dorika con temas de commerce.

## 7. Referencias visuales

Las imagenes de referencia deben guardarse en:

```txt
docs/referencias/
```

Y enlazarse asi:

```md
![Tema pizzeria](./referencias/tema-pizzeria.png)
```

Referencias habladas en el hilo:

### Tema pizzeria / comida

Intencion:

- Producto grande.
- Emocional.
- Categorias con assets semanticos tipo miniatura de producto.
- Carrito visible.
- Oscuro calido o claro calido segun variante.

### Supermercado / tienda general / tecnologia

Intencion:

- Home comercial compacto.
- Categorias con assets semanticos tipo miniatura de producto.
- Producto visible.
- Secciones como ofertas, destacados, mas vendidos.
- Bottom cart claro.

### Catalogo premium / WhatsApp

Intencion:

- Sin compras directas cuando aplique.
- CTA principal a WhatsApp.
- Producto protagonista.
- Estilo premium configurable.

### Onboarding compacto

Intencion:

- Menos scroll.
- Indicadores de avance en una sola linea.
- Cards mas pequenas.
- Inputs mas densos.
- Mejor uso del ancho en pantallas pequenas de PC.

## 8. No hacer por ahora

Estas decisiones evitan perder tiempo y tokens en direcciones que no son MVP.

- No crear una cantidad grande de temas antes de validar 6 a 10 buenos.
- No usar fotos para categorias como flujo principal.
- No usar iconos lineales como representacion principal de categorias publicas.
- No poner assets, iconos ni colores propios en subcategorias.
- No mostrar todo el catalogo de assets abierto desde el inicio del selector.
- No duplicar en Dorika informacion que Klicor ya conoce.
- No mezclar tema del link in bio con tema de tienda/menu/catalogo.
- No rehacer backend completo de commerce sin necesidad.
- No hacer app nativa todavia.
- No mover Dorika dentro de Klicor.
- No tocar la autenticacion salvo bug real.
- No hacer cambios visuales grandes sin revisar este documento.

## 8.1 Pendiente pre-produccion: proteccion de trafico

Estado: pendiente para la semana previa a produccion.

Klicor ya tiene un limitador basico dentro de la aplicacion para frenar muchas solicitudes repetidas por IP en rutas publicas sensibles.

Ese limitador sirve como primera defensa, pero no debe ser la unica proteccion en produccion porque Vercel puede ejecutar varias instancias de la app y cada instancia puede tener memoria separada.

Antes de salir a produccion comercial se debe configurar una proteccion en la entrada de la plataforma, como Vercel Firewall/WAF o rate limiting equivalente, para que el trafico abusivo se frene antes de llegar al codigo de Klicor.

Prioridad recomendada:

1. Rutas publicas de comercio.
2. Rutas publicas de agenda, especialmente creacion de citas.
3. Redirecciones y analytics de clicks.
4. Verificador de usuarios.

No bloquear el avance actual por este punto, pero no dejarlo para despues de produccion.

## 8.2 Facturacion electronica manual y regla futura

Estado actual MVP:

- Klicor no genera factura electronica automaticamente.
- El cliente puede guardar datos privados de facturacion en el panel.
- Cuando esos datos se crean o cambian, Klicor debe avisar al correo administrativo para revision manual.
- Cuando Mercado Pago confirma un pago aprobado, Klicor debe avisar al correo administrativo con el pago, el plan y los datos de facturacion disponibles.
- Si el cliente no tiene datos completos y no solicita factura individual, el caso puede manejarse manualmente dentro del consolidado mensual a cliente indeterminado, segun criterio contable del negocio.

Regla futura antes de automatizar:

- Antes de abrir Mercado Pago, el cliente debe poder marcar `Necesito factura electronica a mi nombre`.
- Si marca esa opcion, el pago no debe continuar hasta completar datos minimos de facturacion.
- Si no marca esa opcion, Klicor debe registrar que no solicito factura individual en ese momento.
- Si paga sin datos completos, no se debe asumir automaticamente que necesita factura individual.
- Si solicita factura despues del pago, debe quedar como solicitud posterior/manual.

Motivo:

- Evitar emitir una factura individual con datos incompletos.
- Evitar mandar al cliente al consolidado de cliente indeterminado cuando expreso que necesita factura electronica a su nombre.
- Mantener el flujo simple mientras la facturacion siga siendo manual.

## 8.3 Dashboard de agencias y solicitudes de acceso

Estado: definido para implementacion posterior.

Objetivo:

- Permitir que una agencia de marketing administre Klicor de clientes sin pedirles correo, clave ni acceso directo a su cuenta.
- Mantener siempre al negocio como propietario y con control final.
- Evitar registro libre de agencias: solo pueden entrar correos habilitados por el administrador de Klicor.

Definicion de "modelo":

- En este contexto, modelo no es una pantalla.
- Es la forma en que se guardan los datos y relaciones en Firestore.
- Define colecciones, campos, estados, permisos, propiedad, trazabilidad y reglas de acceso.
- Antes de crear pantallas o APIs de agencia, el modelo debe quedar claro para no improvisar permisos ni romper seguridad.

Flujo MVP:

1. El negocio se registra y crea su Klicor normalmente desde el flujo actual.
2. La agencia entra a su dashboard de agencia.
3. La agencia escribe el correo del negocio ya registrado.
4. Klicor busca si existe un negocio con ese correo.
5. Si existe, Klicor crea una solicitud de acceso y envia correo al negocio.
6. El negocio ve la solicitud por correo y en su dashboard.
7. El negocio acepta o rechaza.
8. Si acepta, la agencia puede administrar solo modulos permitidos.
9. El negocio puede desvincular la agencia cuando quiera.

Acceso a dashboard de agencia:

- No hay registro publico de agencias.
- El administrador de Klicor debe habilitar primero el correo de la agencia.
- Una cuenta solo entra a `/agencia` si su correo esta autorizado y activo.
- Si no esta autorizada, debe ver un mensaje simple: `Este acceso es solo para agencias autorizadas por Klicor.`
- Para MVP, una agencia corresponde a un solo correo autorizado.
- A futuro se puede ampliar a varios usuarios por agencia si el uso real lo exige.

Coleccion propuesta `agencyAccounts`:

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

Coleccion propuesta `agencyAccessRequests`:

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
  respondedAt,
  revokedAt
}
```

Campo propuesto en usuario negocio:

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

Permisos permitidos para agencia:

- Enlaces.
- Diseno.
- Comercio.
- Comercio completo: crear, editar y borrar categorias, subcategorias y productos.
- Agenda solo configuracion: servicios, profesionales/colaboradores, disponibilidad base, recordatorios y correos.
- Perfil publico basico.
- Metodos de pago visibles en la pagina publica.
- Analiticas generales de marketing cuando existan.
- Renovacion limitada de suscripcion.

Perfil publico basico incluye:

- Nombre visible del negocio.
- Logo/foto visible.
- Descripcion publica.
- Categoria o tipo de negocio si afecta la presentacion publica.
- WhatsApp visible.
- Horarios publicos cuando apliquen.
- Username/link visible. El QR impreso no se pierde porque Klicor usa `publicLinkId` estable bajo `/u/{publicLinkId}` y redirige al username actual.

Permisos prohibidos para agencia:

- Seguridad.
- Correo principal.
- Correo o telefono de recuperacion.
- Facturacion privada.
- Datos para factura electronica.
- Administracion completa de suscripcion.
- Pagos administrativos.
- Cambio de plan.
- Eliminacion de cuenta.
- Cambio de propietario.
- Desvincular al dueno.
- Vincular otra agencia.
- Ver citas con datos de clientes.
- Agendar citas.
- Aceptar citas.
- Rechazar citas.
- Reprogramar citas.
- Cancelar citas.
- Marcar asistio/no asistio.
- Operar la agenda diaria del negocio.

Regla de Agenda para agencia:

- La agencia puede configurar la Agenda, pero no operarla.
- Puede crear y editar servicios.
- Puede crear y editar profesionales o colaboradores.
- Puede ajustar configuracion, recordatorios y correos.
- No puede ver ni administrar citas reales porque contienen datos personales de clientes y decisiones operativas del negocio.

Regla de suscripcion y renovacion:

- La agencia puede ver estado del plan, fecha de vencimiento y estado vencido/suspendido.
- Si el negocio esta en `trial` o `active`, la agencia puede editar los modulos permitidos.
- Si el negocio esta vencido o suspendido, la agencia no puede editar contenido operativo.
- En vencido o suspendido, la agencia si puede ayudar a renovar mediante un permiso limitado `subscriptionRenewal`.
- `subscriptionRenewal` permite abrir el flujo de renovacion o pago para ese negocio.
- `subscriptionRenewal` no permite cambiar precios, dar cortesia, alterar estados manualmente, modificar facturacion privada, cancelar cuenta ni cambiar propietario.
- Si una agencia paga por el negocio, el pago activa el negocio, pero no le da propiedad ni derechos adicionales sobre la cuenta.

Dorika:

- Queda fuera del MVP de agencia.
- Puede habilitarse despues solo para agencias autorizadas o casos especiales de Ocana.
- No mezclar Dorika con el primer flujo de permisos de agencia.

Reglas de UI:

- La ruta publica del dashboard de agencia sera `/agencia`.
- El dashboard de agencia debe mostrar negocios vinculados, solicitudes pendientes y boton `Solicitar acceso`.
- La lista de negocios debe mostrar logo, nombre, link, estado del plan, modulos activos, ultima actualizacion y accion `Administrar`.
- Para editar, la agencia debe reutilizar el dashboard del cliente con una barra o aviso visible: `Administrando Klicor de: {negocio}`.
- El dashboard cargado en modo agencia debe mostrar solo los modulos permitidos.
- Las secciones administrativas no deben mostrarse deshabilitadas; deben ocultarse para evitar confusion.
- El negocio debe ver en su dashboard la agencia vinculada, fecha de autorizacion, permisos y boton `Desvincular agencia`.
- La agencia vinculada puede mostrarse en Perfil del negocio.
- No enviar correo al negocio por cada cambio de la agencia en MVP.
- La solicitud debe explicar que la agencia podra ayudar a configurar Klicor y editar datos visibles, pero no podra ver ni modificar seguridad, facturacion privada, administracion de suscripcion, propietario ni datos de clientes de citas.
- La solicitud debe incluir aviso legal: Klicor facilita el acceso tecnico; el dueno del negocio decide autorizar a la agencia y asume responsabilidad por ese acceso; los acuerdos comerciales entre negocio y agencia son externos a Klicor.

Reglas de solicitud:

- La agencia solo puede solicitar acceso usando el correo exacto del negocio.
- No debe existir buscador publico de negocios para agencias.
- Una solicitud vence a los 7 dias.
- No puede haber dos solicitudes activas de la misma agencia al mismo negocio.
- Si una solicitud vence, la agencia puede crear o reenviar otra solo despues de 24 horas.
- Un negocio solo puede tener una agencia activa.
- Si un negocio ya tiene agencia activa, otra agencia no puede solicitar acceso.
- Klicor no arbitra cobros, entregas, deudas o acuerdos entre agencia y negocio.
- La agencia no puede bloquear el Klicor ni marcarlo como en construccion.
- La agencia publica cambios inmediatamente dentro de sus permisos.
- El negocio puede revocar acceso en cualquier momento.
- Al revocar, la agencia pierde acceso de inmediato.

Reglas de auditoria:

- Toda edicion hecha por agencia debe guardar quien la hizo.
- Campos sugeridos:

```js
{
  updatedBy: "agencyUid",
  updatedByRole: "agency",
  updatedByEmail: "agencia@dominio.com",
  updatedForUid: "uidNegocio",
  updatedAt
}
```

Rutas futuras:

- `/agencia`: dashboard principal de agencia.
- `/agencia/negocios`: negocios vinculados.
- `/agencia/solicitudes`: solicitudes enviadas.
- `/agencia/negocios/[uid]`: entrada al dashboard del cliente en modo agencia.

APIs futuras:

- `GET /api/agency/me`
- `GET /api/agency/businesses`
- `POST /api/agency/request-access`
- `POST /api/agency/respond-request`
- `POST /api/agency/revoke`

Orden recomendado de implementacion:

1. Crear modelo de datos y helpers de permisos.
2. Agregar en admin la habilitacion de correos de agencia.
3. Crear guard de acceso para `/agency`.
4. Crear pantalla base de `/agencia`.
5. Crear solicitud de acceso por correo de negocio.
6. Enviar correo al negocio.
7. Mostrar solicitud en dashboard del negocio.
8. Aceptar, rechazar y revocar.
9. Listar negocios vinculados.
10. Reutilizar el editor actual con permisos limitados.

## 9. Orden recomendado de implementacion

1. Compactar onboarding actual.
2. Ajustar textos actuales del onboarding.
3. Autogenerar usuario desde nombre del negocio.
4. Capturar ubicacion con mapa y coordenadas en onboarding.
5. Compactar editor completo: Enlaces, Diseno, Perfil y Dorika.
6. Mejorar lectura de colores del logo para temas sugeridos.
7. Reducir selector de temas del link in bio.
8. Agregar campos de clasificacion comercial de forma controlada.
9. Crear `commerceTheme` separado de `appearance`.
10. Crear catalogo curado de iconos por vertical.
11. Migrar categorias de commerce a icono/color/nombre.
12. Crear primeros temas MVP para commerce.
13. Conectar Dorika a la clasificacion real del negocio.

Orden recomendado cuando el foco sea Agenda:

1. Consolidar regla de solicitud pendiente y confirmacion manual por defecto.
2. Separar mensajes de solicitud recibida y cita confirmada segun configuracion del negocio.
3. Agregar acciones de aceptar, rechazar y reprogramar solicitud.
4. Mejorar agendamiento manual y cambios de cita desde el negocio.
5. Construir disponibilidad operativa por profesional y horario.
6. Agregar login de cliente publico con Google/Firebase Auth para Agenda.
7. Persistir cliente autenticado y asociarlo a citas del negocio.
8. Agregar notificaciones configurables para negocio y cliente.
9. Agregar recordatorios configurables antes de la cita.
10. Agregar reactivacion de clientes apagada por defecto y configurable por dias.
11. Agregar historial basico de cliente por telefono y/o usuario autenticado.

## 10. Estado del documento

Estado: vivo.

Regla:

- Si se decide algo importante en conversacion, agregarlo aqui.
- Si una decision se implementa, marcarla como implementada o moverla a "hecho".
- Si una idea se descarta, dejar razon corta para no repetir la discusion.
