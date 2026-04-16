# Dorika - Documento Base De Producto, UX Y Arquitectura

Este documento define la dirección inicial de Dorika para validarla antes de construir más código. La idea no es copiar un directorio, un mapa genérico ni un ecommerce. Dorika debe sentirse como una experiencia local, humana y visual para descubrir negocios, productos, lugares y rutas.

## 1. Principio Maestro

Dorika debe ser:

- 70% utilidad: rápido, claro, fácil de entender, enfocado en resolver.
- 30% emoción: visual, cercano, turístico, local y memorable.

La facilidad de uso y el diseño no son detalles secundarios. Son parte central del producto. Dorika debe diferenciarse porque cualquier persona pueda entrar y entender qué hacer sin pensar.

El mapa personalizado y visual debe existir desde el MVP. No debe dejarse como una fase futura, porque será una de las piezas que más ayude a vender la idea.

## 2. Qué Es Dorika

Dorika es una plataforma de descubrimiento local para Ocaña.

Permite que una persona pueda:

- encontrar dónde comer
- descubrir tiendas y productos
- ver negocios cercanos
- conocer horarios y ubicación
- entrar al Klicor de un negocio para pedir, comprar o contactar
- explorar rutas turísticas
- guardar o continuar experiencias más adelante

Dorika no reemplaza a Klicor. Klicor sigue siendo la herramienta simple para que el negocio administre su presencia digital. Dorika es la vitrina pública de descubrimiento.

## 3. Qué No Debe Ser Dorika

Dorika no debe sentirse como:

- un panel administrativo
- un marketplace pesado
- una copia de Google Maps
- un directorio frío de negocios
- una app llena de filtros técnicos
- un ecommerce tradicional

Dorika debe sentirse más como:

- una guía local inteligente
- un amigo que te muestra qué hacer
- una experiencia tipo app móvil
- una mezcla entre descubrimiento, turismo, comercio local y WhatsApp

## 4. Relación Entre Klicor Y Dorika

La regla base debe ser:

**Klicor es la fuente de verdad operativa. Dorika es una proyección optimizada para lectura y descubrimiento.**

Esto significa:

- El negocio crea y edita su información en Klicor.
- Dorika recibe una copia optimizada de esa información.
- Dorika no consulta Firestore en tiempo real para renderizar la experiencia pública.
- Dorika no debe editar productos, horarios o datos operativos que nacen en Klicor.
- Si algo cambia en Klicor, se sincroniza hacia Dorika.

Esto evita una doble verdad técnica. Si el negocio oculta un producto, cambia horarios o pausa su presencia en Dorika, el cambio nace en Klicor y se refleja en Dorika.

## 5. Decisión Técnica Recomendada

### Frontend

Next.js en Vercel.

Razón:

- ya existe experiencia de despliegue en Vercel
- permite iterar rápido
- funciona bien para frontend moderno
- permite separar Dorika de Klicor

### Base De Datos

Supabase Postgres con PostGIS.

Razón:

- Postgres permite un modelo relacional limpio
- PostGIS permite búsquedas por cercanía, zonas, mapas y rutas
- es más adecuado que Firestore para geodatos
- mantiene portabilidad si después se migra a otra infraestructura

La base debe diseñarse como **Postgres-first**, no como **Supabase-first**. Supabase debe ser plataforma de hosting y herramientas, no una dependencia conceptual imposible de reemplazar.

### Dominio, CDN Y Seguridad

Cloudflare.

Razón:

- DNS
- SSL
- cache
- protección
- reglas de seguridad
- posibilidad futura de usar Cloudflare R2 para imágenes

### Imágenes

Para MVP puede usarse Supabase Storage si el volumen inicial es bajo. Pero Dorika será un producto muy visual, así que debe quedar preparada una migración a Cloudflare R2 + CDN.

Regla técnica:

- nunca amarrar la lógica de negocio a un proveedor de storage
- guardar metadata de media
- generar thumbnails
- optimizar tamaños
- cargar imágenes con lazy loading
- evitar mandar imágenes enormes al cliente

## 6. Datos Que Klicor Debe Capturar Para Dorika

Klicor no debe volverse pesado. La captura debe ser progresiva y opcional.

### Registro Inicial

Debe seguir siendo simple. Solo agregar ciudad sin hablar de Dorika todavía.

Campos mínimos:

- nombre del negocio
- WhatsApp
- ciudad
- tipo de negocio
- logo o imagen principal
- enlaces básicos si el usuario los tiene
- métodos de pago

Si ciudad no es Ocaña, no se muestra el módulo Dorika por ahora.

### Sección En Klicor: Aparecer En Dorika

Esta sección debe ser separada del alta inicial.

Campos sugeridos:

- aparecer en Dorika: sí/no, habilitado por defecto
- mostrar ubicación: sí/no
- nivel de ubicación:
  - ubicación exacta
  - solo ciudad o zona
  - no mostrar ubicación, solo contacto
- ciudad
- barrio o zona
- coordenadas exactas
- dirección visible opcional
- nombre del edificio, centro comercial o lugar
- local, piso u oficina
- referencia interna
- indicaciones cortas para llegar
- foto de portada para Dorika
- descripción corta para Dorika
- productos destacados para Dorika

La categoría principal para Dorika no debe preguntarse de nuevo si ya se tiene desde el perfil del negocio.

## 7. Ubicación Y Usabilidad

La ubicación debe ser fácil de capturar incluso si el negocio está dentro de un centro comercial, edificio, plazuela de comidas o local interno.

Por eso se necesitan dos niveles:

### Coordenada Para El Mapa

Sirve para ubicar el punto visual en Dorika.

Debe poder capturarse con:

- ubicación actual desde celular cuando aplique
- selección manual en mapa
- búsqueda de lugar
- ajuste del punto con zoom real y controles cómodos

### Indicaciones Humanas

Sirven para que una persona sepa llegar después de estar cerca.

Ejemplos:

- Centro Comercial City Gold
- Local 203
- Segundo piso
- Plazoleta de comidas
- Entrando por la puerta principal, al fondo a la derecha

Esto es muy importante porque lat/lng no basta para negocios dentro de edificios.

## 8. Mapa Personalizado Desde El MVP

El mapa no debe ser una simple incrustación genérica.

Dorika necesita un mapa visual propio desde el inicio porque será una de sus diferencias comerciales.

### Objetivo Del Mapa

El mapa debe sentirse:

- humano
- amable
- visual
- local
- fácil de explorar
- no técnico

Debe ayudar a responder:

- qué tengo cerca
- dónde queda
- qué puedo hacer ahí
- cómo llego
- qué hay alrededor

### Pila Técnica Sugerida

Opción recomendada:

- MapLibre GL para el mapa interactivo
- OpenStreetMap como base de datos cartográfica
- tiles con proveedor económico o estilo propio
- PostGIS para consultas por cercanía y bounding box

No confundir:

- PostGIS calcula y consulta datos geográficos.
- MapLibre renderiza la experiencia visual del mapa.
- Los tiles son las imágenes/vector tiles del mapa base.
- La capa Dorika son nuestros puntos, colores, categorías, rutas y diseño.

### Diseño Del Mapa

El mapa debe tener estilo propio:

- colores suaves
- puntos por categoría
- tarjetas flotantes
- iconos de negocios con logo cuando aplique
- categorías visibles sin saturar
- rutas turísticas con líneas orgánicas
- estados abierto/cerrado
- cercanía por prioridad visual

No debe mostrar todos los negocios al mismo tiempo sin control.

### Reglas De Carga Del Mapa

Para evitar saturación y costos:

- cargar por categoría seleccionada
- cargar por zona visible del mapa
- mostrar primero lo cercano
- ampliar resultados cuando el usuario aleje el mapa
- usar clustering si hay muchos puntos
- si el usuario toca "Ver ubicación" de un negocio, enfocar solo ese negocio
- no cargar todos los negocios de la ciudad si no hace falta

### Mapa Y Secciones

La navegación de Dorika debe ser tipo secciones horizontales, no solo scroll infinito vertical.

Ejemplo:

- Cerca de ti
- Para comer hoy
- Tiendas destacadas
- Productos que te pueden gustar
- Agenda cerca de ti
- Rutas para explorar

Cada sección puede tener scroll horizontal, como Netflix. El mapa complementa esa navegación, no la reemplaza.

## 9. Modelo De Datos Inicial

Tablas sugeridas para Dorika:

### businesses

- id
- klicor_business_id
- name
- slug
- category
- city
- description
- logo_url
- cover_url
- status
- dorika_enabled
- klicor_url
- whatsapp_number
- business_hours_summary
- is_open_now
- created_at
- updated_at
- synced_at

### business_locations

- id
- business_id
- visibility_level
- city
- zone
- address_visible
- place_name
- building_name
- floor
- local_number
- internal_reference
- arrival_instructions
- latitude
- longitude
- geo_point
- created_at
- updated_at

### products

- id
- business_id
- klicor_product_id
- name
- description
- price
- main_image_url
- status
- is_featured
- category_name
- subcategory_name
- klicor_url
- created_at
- updated_at
- synced_at

### product_media

- id
- product_id
- url
- thumbnail_url
- alt_text
- position
- provider
- created_at

### categories

- id
- name
- normalized_key
- icon_url
- image_url
- color
- parent_category
- created_at
- updated_at

### routes

- id
- name
- category
- short_description
- full_description
- cover_url
- duration_label
- difficulty
- route_type
- status
- badge_name
- created_at
- updated_at

### route_points

- id
- route_id
- name
- description
- image_url
- latitude
- longitude
- position
- estimated_time
- tip
- best_time_to_visit
- created_at
- updated_at

### sync_events

- id
- source
- source_id
- entity_type
- entity_id
- event_type
- payload_hash
- status
- attempts
- last_error
- created_at
- processed_at

### search_documents

Puede ser tabla, vista o materialized view.

Sirve para optimizar búsqueda por:

- negocio
- producto
- categoría
- zona
- keywords
- cercanía
- abierto/cerrado
- destacados

## 10. Estados De Publicación

Dorika necesita controlar publicación sin borrar datos.

Estados sugeridos:

- draft: existe, pero no se muestra
- ready: tiene datos mínimos, listo para revisar o publicar
- published: aparece en Dorika
- paused: oculto temporalmente por decisión del negocio
- blocked: oculto por decisión administrativa
- deleted: eliminado lógico o pendiente de limpieza definitiva

Reglas:

- Si el negocio desactiva Dorika en Klicor, pasa a paused.
- Si elimina la cuenta, debe eliminarse o anonimizarse todo rastro según la política definida.
- Si falta ubicación exacta pero permite contacto, puede aparecer sin punto exacto.
- Si no tiene portada, usar fallback visual temporal, pero pedir mejora.

## 11. Sincronización Klicor A Dorika

La sincronización debe ser explícita, no mágica.

### Eventos Que Deben Sincronizar

- cambio de nombre del negocio
- cambio de logo
- cambio de portada Dorika
- cambio de ciudad
- cambio de categoría
- cambio de ubicación
- cambio de visibilidad
- cambio de horarios
- cambio de productos
- cambio de productos destacados
- cambio de estado visible/oculto
- cambio de URL pública
- eliminación o pausa del negocio

### Reglas Técnicas

- cada evento debe ser idempotente
- si se procesa dos veces, no debe duplicar datos
- guardar estado del evento
- guardar errores
- permitir reintentos
- tener job de reconciliación
- tener botón administrativo futuro para resincronizar negocio

### Frecuencia

Tres niveles:

1. Sincronización inmediata para cambios importantes.
2. Job periódico para corregir inconsistencias.
3. Reconciliación manual administrativa si algo falla.

## 12. Búsqueda Y Descubrimiento

Dorika no debe ordenar solamente por cercanía.

Debe combinar:

- cercanía
- categoría
- texto buscado
- negocio abierto
- calidad del perfil
- productos destacados
- popularidad futura
- destacados editoriales o comerciales

Ejemplo:

Si el usuario busca "hamburguesa", Dorika puede mostrar:

- productos llamados hamburguesa
- negocios de comida rápida
- restaurantes cercanos
- rutas o lugares relacionados solo si aplica

## 13. Experiencia De Usuario

### Home

Debe tener:

- saludo o entrada cálida
- buscador grande
- banner emocional: "¿Qué quieres hacer hoy?"
- chips: Comer, Comprar, Agendar, Reservar, Explorar
- secciones horizontales
- mapa visible como acción importante
- bottom nav claro

### Navegación

La navegación debe ser:

- móvil primero
- por secciones
- con scroll horizontal dentro de cada bloque
- sin listas infinitas pesadas
- con acciones claras

### Cards De Negocio

Cada negocio debe mostrar:

- foto
- logo si aplica
- nombre
- categoría
- distancia
- abierto/cerrado
- barrio/zona
- productos destacados si aplica
- botones: Ver, Pedir, Ver menú o Ver tienda según caso

### Productos En Dorika

Dorika puede mostrar productos destacados o aleatorios, pero el cierre ocurre en Klicor.

Flujo:

- usuario ve producto en Dorika
- toca el producto
- ve negocio/producto resumido
- botón lo lleva al Klicor del negocio

Dorika descubre. Klicor convierte.

## 14. Rutas Turísticas

Las rutas sí viven dentro de Dorika.

MVP de rutas:

- listado de rutas
- detalle de ruta
- puntos de ruta
- progreso local
- mapa visual de ruta
- marcar punto visitado
- pantalla de ruta completada

El progreso puede iniciar con localStorage. Después se migra a usuario autenticado si el producto lo necesita.

## 15. Estrategia De Costos

Principales fuentes de costo:

- consultas frecuentes
- imágenes
- egress
- geocodificación
- tiles del mapa
- funciones serverless
- sincronización mal diseñada

Medidas desde el inicio:

- paginar resultados
- cargar por secciones
- cargar por bounding box en mapa
- cachear home y secciones populares
- cachear búsquedas frecuentes si aplica
- usar thumbnails
- lazy load de imágenes
- evitar llamadas a Firestore desde Dorika público
- evitar traer productos completos si solo se muestran previews
- invalidar cache solo cuando cambia algo relevante

## 16. Riesgos

### Riesgo 1: Doble Verdad

Solución:

Klicor edita. Dorika muestra.

### Riesgo 2: Costos Por Imágenes

Solución:

Optimización desde el inicio y arquitectura preparada para R2/CDN.

### Riesgo 3: Mapa Genérico

Solución:

Mapa personalizado desde MVP. Diseño propio, no solo mapa incrustado.

### Riesgo 4: Klicor Se Vuelve Pesado

Solución:

Captura progresiva. Dorika como sección opcional, no como requisito para publicar.

### Riesgo 5: Dorika Parece Un Directorio Más

Solución:

Diseño emocional, secciones editoriales, mapa visual, rutas, productos y experiencia local.

## 17. Fases Recomendadas

### Fase 1: Fundamento

- crear app Dorika separada
- configurar Postgres/PostGIS
- definir schema inicial
- crear migraciones
- crear diseño base mobile-first
- crear mapa visual MVP
- cargar datos mock reales de Ocaña

### Fase 2: Sincronización

- definir eventos desde Klicor
- crear API o job de sync
- poblar Dorika con negocios publicados
- sincronizar productos destacados
- sincronizar horarios y ubicación

### Fase 3: Descubrimiento

- home por secciones
- búsqueda
- categorías
- cerca de ti
- mapa por categoría y zona visible
- productos destacados

### Fase 4: Rutas

- rutas turísticas
- puntos
- progreso
- mapa de ruta
- detalle de punto
- completado

### Fase 5: Optimización

- cache
- CDN de imágenes
- ranking
- analytics
- panel administrativo Dorika

## 18. Decisiones Que Falta Cerrar

Antes de construir fuerte, debemos decidir:

- proveedor inicial de tiles para el mapa
- si usamos Supabase Storage o R2 desde el inicio
- esquema exacto de sincronización desde Klicor
- diseño visual del mapa
- reglas de ranking inicial
- qué datos mínimos hacen que un negocio pueda publicarse en Dorika
- si habrá revisión administrativa antes de publicar

## 19. Criterio De Éxito

Dorika funciona si una persona puede:

- entrar y entender qué puede hacer en menos de 5 segundos
- encontrar algo cerca sin aprender la interfaz
- ver un mapa bonito, claro y útil
- descubrir negocios o productos sin sentir que está en un listado frío
- llegar al Klicor del negocio cuando quiera comprar, pedir o contactar
- explorar rutas turísticas de forma guiada y emocional

La meta no es solo mostrar información. La meta es que Dorika se sienta como una nueva forma de vivir Ocaña.

## 20. Home, Intenciones Y Acceso Al Mapa

La entrada principal de Dorika debe priorizar búsqueda rápida, claridad visual e intención del usuario.

### 20.1 Orden Del Home

El home debe organizarse con este orden base:

1. Buscador principal
2. Banner dinámico
3. Chips de intención integrados al banner
4. Acceso persistente al mapa
5. Primer carrusel: rutas turísticas
6. Secciones posteriores del home

#### Buscador Principal

Debe ir en la parte superior y funcionar como la entrada más clara para quien ya sabe qué quiere buscar.

#### Banner Dinámico

Debe existir un banner visual y cálido que cambie según el momento del día:

- mañana
- tarde
- noche

El objetivo del banner es dar contexto emocional, hacer que Dorika se sienta viva y reforzar la identidad local y humana del producto.

#### Chips De Intención Integrados Al Banner

En la parte baja del banner deben estar siempre visibles los chips principales de navegación:

- Comer
- Comprar
- Turismo

Estos chips representan la intención principal del usuario y deben ser una de las entradas centrales del producto.

#### Acceso Persistente Al Mapa

Debe existir una acción visible y permanente para entrar al mapa, sin depender de una sección específica ni interrumpir el flujo principal del home.

#### Primer Carrusel: Rutas Turísticas

El primer carrusel del home debe ser siempre el de rutas turísticas.

Esta decisión busca posicionar a Dorika no solo como una herramienta para comercio local, sino también como una experiencia de descubrimiento territorial y turístico.

#### Secciones Posteriores Del Home

Después deben venir otras secciones horizontales como:

- Cerca de ti
- Para comer hoy
- Tiendas destacadas
- Turismo
- otras futuras según evolución del producto

### 20.2 Chips De Intención

Los chips del home no son filtros técnicos. Son puertas de entrada simples a la experiencia.

Por ahora deben existir solo estos tres:

- Comer
- Comprar
- Turismo

En el futuro podrán agregarse:

- Reservar
- Agendar

Pero por ahora no deben mostrarse hasta que esas experiencias estén realmente listas y claras.

Cada chip debe llevar al usuario a una experiencia coherente con esa intención.

Ejemplos:

- Comer: restaurantes, cafés, comidas rápidas, repostería y similares.
- Comprar: tiendas, productos, negocios comerciales y vitrinas de venta.
- Turismo: rutas, sitios de interés, experiencias y exploración local.

### 20.3 Acceso Al Mapa

El acceso al mapa no debe resolverse como un botón tradicional dentro del flujo del contenido.

Debe existir como un botón flotante persistente, visible en todo momento, pero sin interrumpir la navegación.

Reglas del botón flotante:

- siempre visible
- no debe tapar contenido importante
- debe sentirse integrado al diseño
- puede reducirse visualmente al hacer scroll
- debe mantener una pequeña animación o microinteracción sutil para seguir presente sin resultar molesto

El objetivo es que el usuario siempre sienta que el mapa está disponible como acción importante del producto, pero sin convertirlo en una distracción constante.

### 20.4 Comportamiento Del Botón Flotante

El botón flotante de mapa no debe abrir el mapa de forma inmediata en todos los casos.

#### Caso 1: Acceso General Al Mapa

Si el usuario toca el botón flotante sin venir desde una intención específica, primero debe abrirse un bottom sheet selector con la pregunta:

**¿Qué quieres ver en el mapa?**

Opciones:

- Comer
- Comprar
- Turismo

Solo después de elegir una intención se abre el mapa.

Esto evita que el mapa se abra vacío, genérico o sin contexto.

#### Caso 2: Acceso Al Mapa Desde Una Intención

Si el usuario ya viene desde un chip o flujo específico, el mapa debe abrirse directamente con esa intención activa, sin volver a preguntar.

Ejemplos:

- Si el usuario viene desde Comer, el mapa muestra solo opciones relacionadas con comida.
- Si viene desde Comprar, muestra negocios y productos relacionados con compra.
- Si viene desde Turismo, muestra rutas, lugares de interés y experiencias relacionadas.

### 20.5 Lógica Inicial Del Mapa

El mapa debe abrir siempre con contexto y relevancia, no como una vista genérica de toda la ciudad.

Reglas base:

- iniciar con una intención activa
- mostrar un radio inicial razonable
- priorizar resultados cercanos
- mantener una visual limpia
- no cargar todo al mismo tiempo

Si el usuario mueve el mapa o hace zoom out, el sistema puede ampliar la zona visible y cargar nuevos resultados según la intención elegida.

### 20.6 Relación Entre Intención Y Datos

Para que Dorika funcione bien a futuro, Klicor debe ir evolucionando hacia una categorización más precisa del negocio.

No basta con categorías demasiado generales.

Dorika se beneficia de que Klicor pueda distinguir con más precisión tipos de negocio como:

- restaurante
- cafetería
- comidas rápidas
- ferretería
- barbería
- estilista

Esto permitirá que las intenciones del home y del mapa sean más útiles, más precisas y más naturales para el usuario.

La lógica ideal es:

- Klicor administra y estructura la información del negocio.
- Dorika usa esa información para mostrar experiencias claras por intención.

### 20.7 Objetivo De Esta Estructura

Esta organización del home y del acceso al mapa busca que Dorika se entienda rápido, se sienta visual y mantenga una navegación clara.

La intención no es mostrar todo desde el inicio, sino ayudar al usuario a entrar por caminos simples:

- buscar
- elegir intención
- ver mapa
- descubrir rutas
- explorar contenido relevante sin saturación

Dorika no debe sentirse como una lista fría ni como un mapa técnico. Debe sentirse como una experiencia local, clara, visual y fácil de usar.
