# Klicor - Producto, Estado Actual y Decisiones

Este documento es la fuente de verdad para seguir construyendo Klicor sin depender de la memoria de un chat. Antes de hacer cambios grandes de UX, UI, onboarding, tienda, menu, catalogo, agenda o Dorika, se debe leer este documento y contrastarlo con el codigo actual.

## 1. Que es Klicor

Klicor es una plataforma para que negocios pequenos creen una presencia digital rapida y util sin tener que construir una web completa desde cero.

Klicor debe permitir que un negocio tenga:

- Link in bio publico con identidad, botones, redes, metodos de pago y contacto.
- QR y enlace publico facil de compartir.
- Tienda, menu o catalogo segun lo que vende.
- Agenda para negocios de servicios o citas.
- Perfil comercial para aparecer en Dorika cuando aplique.
- Panel administrativo para configurar el negocio con el menor esfuerzo posible.

La promesa principal no es "hacer una pagina bonita", sino ayudar al negocio a vender, recibir pedidos, mostrar su oferta, ser encontrado y convertir conversaciones.

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

Debe mantenerse como modulo de citas/servicios.

### Dorika

Existe `dorikaProfile` y logica para decidir elegibilidad.

Decision importante:

- Dorika no debe volver a pedir informacion que Klicor ya sabe del negocio.
- Dorika debe usar los datos base del perfil, tipo de negocio, ubicacion y modulo activo.

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
- Llevar a tienda, menu, catalogo o agenda.

Tema visual:

- Usa `appearance`.
- Puede tomar colores del logo.
- Debe ser flexible y sencillo.

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

### Dorika

Es una capa de descubrimiento.

Sirve para:

- Mostrar negocios en ciudad.
- Filtrar por intencion.
- Aprovechar datos ya configurados en Klicor.

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

### 5.2 Categorias deben usar iconos, no fotos

Estado: aprobado, pendiente de implementar.

Regla:

- Categorias = iconos/assets visuales semanticos + nombre.
- El color visible de categorias lo decide el tema del comercio, no el usuario manualmente.
- Productos = fotos.
- Banners/portadas = imagenes emocionales.

No se deben pedir fotos para categorias como flujo principal.

Razon:

- Las fotos en categorias hacen la interfaz pesada.
- Son dificiles de mantener consistentes.
- Cargan visualmente la experiencia.
- Aumentan friccion para el usuario.

Se debe crear un selector visual de iconos, no una lista de texto.

Primera aproximacion:

- Usar un catalogo curado de iconos/assets por vertical.
- Cubrir sinonimos y negocios comunes de comida, retail, servicios, salud/belleza y turismo.
- Resolver palabras ambiguas usando la vertical del negocio cuando exista.
- Mantener compatibilidad con una libreria gratuita.
- Preferir catalogo controlado antes que un buscador infinito.

Posibles librerias:

- Lucide: ya esta en uso, buena para iconos generales.
- Tabler o Phosphor: considerar si se necesita mas variedad.
- Iconify: opcion potente, pero controlar peso y performance.

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
commerceTheme: food_warm | food_pizzeria | grocery_fresh | fashion_female | fashion_male | fashion_mixed | tech_blue | general_market | services_clean | health_soft | tourism_earth | etc
```

Reglas por modulo:

- `mimenu`: lista vertical, cards horizontales, imagen, nombre, precio, boton `+`, carrito fijo y pedido por WhatsApp.
- `mitienda`: grid de productos, cards compactas, precio, boton `+`, carrito fijo y pedido por WhatsApp.
- `micatalogo`: feed visual, imagen dominante, nombre minimo, precio opcional, SIN carrito, SIN checkout, SIN totales, consulta por WhatsApp.

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
- Crear catalogo de iconos por vertical.
- Cambiar categorias para usar icono/color en vez de foto.
- Definir si el modo usa carrito o consulta WhatsApp.
- Crear layout separado para `micatalogo` tipo feed visual.
- Generar mensaje automatico de WhatsApp con el nombre del producto consultado en `micatalogo`.

Temas MVP sugeridos:

- `food_pizzeria`: oscuro calido, naranja/rojo, producto protagonista.
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

Prioridad: media.

Objetivo:

- Mantenerla como modulo para servicios/citas.
- Se debe beneficiar de la categoria del negocio, pero no mezclarse con tienda.

No tocar por ahora:

- No rehacer booking mientras se trabaja commerce/onboarding.

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
- Categorias con iconos.
- Carrito visible.
- Oscuro calido o claro calido segun variante.

### Supermercado / tienda general / tecnologia

Intencion:

- Home comercial compacto.
- Categorias con iconos.
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
- No duplicar en Dorika informacion que Klicor ya conoce.
- No mezclar tema del link in bio con tema de tienda/menu/catalogo.
- No rehacer backend completo de commerce sin necesidad.
- No hacer app nativa todavia.
- No mover Dorika dentro de Klicor.
- No tocar la autenticacion salvo bug real.
- No hacer cambios visuales grandes sin revisar este documento.

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

## 10. Estado del documento

Estado: vivo.

Regla:

- Si se decide algo importante en conversacion, agregarlo aqui.
- Si una decision se implementa, marcarla como implementada o moverla a "hecho".
- Si una idea se descarta, dejar razon corta para no repetir la discusion.
