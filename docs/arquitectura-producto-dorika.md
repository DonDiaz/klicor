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

## 21. Categorización Específica De Negocios

Dorika necesita entender mejor qué hace o vende cada negocio para ofrecer una experiencia más precisa en búsqueda, mapa, secciones y recomendaciones.

La categoría general de Klicor sigue siendo necesaria, pero no es suficiente para Dorika.

Ejemplo:

- Comida y bebidas es útil para decidir que el negocio pertenece a la intención Comer.
- Pero Dorika necesita saber si es restaurante, cafetería, pizzería, comidas rápidas, bar, panadería o heladería.

### 21.1 Regla De UX

Este dato no debe alargar el registro inicial.

Debe pedirse de forma progresiva dentro de la ficha:

**Haz que te encuentren en Dorika**

La pregunta debe ser humana:

**¿Qué describe mejor tu negocio?**

No debe sentirse como una clasificación técnica ni como un requisito obligatorio para publicar Klicor.

Microcopy sugerido:

**Esto ayuda a que Dorika te muestre en búsquedas, mapa y secciones más precisas.**

### 21.2 Modelo De Datos

Klicor debe guardar:

- `businessCategory`: categoría general
- `dorikaProfile.businessType`: tipo específico para Dorika

Ejemplo:

```js
{
  businessCategory: "food_drink",
  dorikaProfile: {
    businessType: "pizza"
  }
}
```

Esto permite que Dorika agrupe por intención sin perder precisión.

### 21.3 Fuentes De Criterio

La taxonomía inicial debe inspirarse en clasificaciones amplias y reconocidas, pero adaptarse al lenguaje local y comercial.

Referencias útiles:

- NAICS para sectores como comida, retail, servicios, alojamiento y entretenimiento.
- Schema.org para tipos generales como Restaurant, Store, HealthAndBeautyBusiness, TravelAgency y TouristAttraction.
- Google Business Profile como criterio UX: la categoría debe describir lo que el negocio es, no una lista de atributos.

### 21.4 Regla De Producto

Dorika debe usar este dato para:

- mostrar negocios en la intención correcta
- mejorar búsqueda textual
- mejorar resultados por cercanía
- construir secciones como "Cafeterías cerca de ti" o "Tiendas de ropa destacadas"
- ordenar el mapa sin saturarlo
- sugerir mejores iconos e imágenes por tipo de negocio

Si el negocio no completa este dato, Klicor sigue funcionando. Pero Dorika debe motivar a completarlo porque mejora su visibilidad.

## 22. Favoritos, Historial Y Acceso De Usuario

Dorika no debe requerir registro obligatorio para comenzar a usarse. La exploración, el descubrimiento y el acceso a la información deben ser libres desde el primer momento.

Sin embargo, funcionalidades como favoritos, historial y progreso sí requieren una estrategia de usuario, pero implementada de forma progresiva y sin fricción.

### 22.1 Principio General

El sistema de usuario debe seguir esta regla:

**Primero permitir usar. Luego invitar a guardar. Nunca bloquear la experiencia inicial.**

Esto permite:

- mayor adopción
- menor fricción de entrada
- validación real de uso
- captura progresiva de usuarios

### 22.2 Acceso Sin Registro

Un usuario no autenticado debe poder:

- explorar el home
- buscar
- ver negocios
- ver productos
- usar el mapa
- explorar rutas

El registro no debe ser requisito para descubrir.

### 22.3 Sistema De Favoritos

Dorika debe permitir guardar favoritos desde el primer momento, incluso sin cuenta.

Comportamiento inicial:

- al tocar el ícono de favorito, el elemento se guarda localmente
- debe haber feedback inmediato
- el ícono debe cambiar visualmente
- debe existir una microanimación suave

Esto asegura que el usuario sienta que la acción funcionó sin interrupciones.

### 22.4 Favoritos Sin Login

Mientras el usuario no esté autenticado:

- los favoritos se almacenan localmente en el dispositivo
- el usuario puede acceder a ellos dentro de la app
- no se deben perder durante la sesión normal

Esto permite que el usuario use la funcionalidad sin necesidad de crear cuenta.

### 22.5 Conversión A Usuario Registrado

El sistema debe invitar al registro solo cuando tenga sentido.

Ejemplos de disparadores:

- el usuario ha guardado varios favoritos
- el usuario intenta acceder a sus favoritos después de un tiempo
- el usuario quiere asegurar que no pierde lo guardado

Mensaje sugerido:

**Guarda tus favoritos y accede a ellos desde cualquier dispositivo.**

Opciones:

- continuar con Google
- continuar con correo

No se deben usar formularios largos ni fricción innecesaria.

### 22.6 Migración De Favoritos

Si el usuario decide registrarse:

- los favoritos almacenados localmente deben migrarse automáticamente a su cuenta
- el usuario no debe perder información
- el proceso debe ser transparente

### 22.7 Acceso A Favoritos

Debe existir un acceso claro dentro de la navegación principal, por ejemplo en el bottom nav.

El usuario debe poder:

- ver sus favoritos
- acceder rápidamente a negocios, productos o rutas guardadas
- continuar su exploración sin dificultad

### 22.8 Historial Y Evolución

Aunque no es obligatorio en la primera versión, el sistema debe quedar preparado para soportar:

- historial de exploración
- rutas vistas o iniciadas
- lugares visitados
- recomendaciones futuras basadas en comportamiento

### 22.9 Rol Estratégico De Favoritos

El sistema de favoritos no es solo una funcionalidad de usuario. También cumple un rol estratégico:

- identificar intereses reales
- entender comportamiento de usuarios
- detectar negocios y productos relevantes
- mejorar recomendaciones futuras
- aportar datos útiles para decisiones del producto

### 22.10 Objetivo Final

El sistema de usuario debe sentirse:

- ligero
- natural
- no invasivo
- útil desde el primer momento

Dorika no debe obligar a crear cuenta para ser usado.

Debe permitir descubrir libremente y luego invitar a guardar lo importante.

## 23. Sistema De Cards

Las cards en Dorika no son simples contenedores de información. Son la unidad principal de descubrimiento visual.

Cada tipo de card debe responder a un objetivo distinto y mantener una estructura coherente, clara y diferenciada.

### 23.1 Principio General

El sistema de cards debe seguir esta regla:

**Cada card debe comunicar en menos de 2 segundos qué es, si me interesa y qué puedo hacer con ella.**

Esto implica:

- jerarquía visual clara
- imagen protagonista
- texto mínimo necesario
- acciones simples

Dorika no debe sentirse como un catálogo técnico, sino como un flujo de contenido visual.

### 23.2 Tipos De Cards

Dorika debe manejar tres tipos principales de cards:

- cards de negocio
- cards de producto
- cards de rutas

Cada una tiene comportamiento, estructura y propósito diferente.

### 23.3 Card De Negocio

#### Propósito

Resolver una necesidad directa del usuario:

- dónde comer
- dónde comprar
- dónde ir

#### Estructura

```text
[ Imagen del negocio o representativa ]

Nombre del negocio
Rating opcional
Tipo de negocio + distancia

[ Ver ] [ Acción principal: Pedir / Reservar / Ir ]
```

#### Reglas Visuales

- imagen en la parte superior
- bloque inferior con fondo claro
- bordes suaves y consistentes
- espacio suficiente entre elementos
- no saturar con información

#### Acciones

- botón "Ver", siempre presente
- botón contextual según tipo:
  - Pedir
  - Reservar
  - Ir

No se deben incluir múltiples acciones innecesarias.

#### Uso

Se utilizan en secciones como:

- Cerca de ti
- Para comer
- Recomendados
- Categorías

### 23.4 Card De Producto

#### Propósito

Generar interés y deseo inmediato.

No busca explicar demasiado, sino llamar la atención.

#### Estructura

```text
[ Imagen grande del producto ]

Nombre del producto
Precio
Negocio + distancia, en tono ligero

Tap directo o acción mínima
```

#### Reglas Visuales

- la imagen es el elemento dominante
- no debe existir cajón blanco pesado
- la información debe ser ligera y directa
- se puede usar overlay con degradado suave
- debe sentirse más cercana a un post que a una ficha técnica

#### Acciones

- tap en la card abre detalle
- opcionalmente, un solo botón pequeño:
  - Ver
  - Comprar

No usar múltiples botones ni lógica de carrito compleja en esta vista.

#### Uso

Se utilizan en secciones como:

- Productos que te pueden gustar
- Destacados
- Promociones
- Secciones de impacto visual

### 23.5 Card De Ruta O Turismo

#### Propósito

Inspirar exploración y descubrimiento.

#### Estructura

```text
[ Imagen de paisaje o experiencia ]

Nombre de la ruta
Información breve: distancia, número de paradas o tipo

[ Ver ruta ]
```

#### Reglas Visuales

- imagen amplia y atractiva
- texto claro y legible
- puede usar overlay sobre la imagen
- debe sentirse emocional, no técnica

#### Acciones

- botón principal: Ver ruta
- tap en la card abre detalle de la ruta

#### Uso

Se utilizan principalmente en:

- primer carrusel del home
- secciones de turismo
- exploración

### 23.6 Proporciones Y Layout

Las cards deben diseñarse para scroll horizontal tipo carrusel.

Reglas:

- deben mostrarse 2 cards completas y media card visible
- esto indica al usuario que puede deslizar horizontalmente
- el alto de las cards debe ser moderado
- no deben ocupar toda la pantalla
- se debe priorizar visibilidad de múltiples elementos sobre tamaño excesivo

### 23.7 Scroll Y Comportamiento

- scroll horizontal para cada sección
- scroll vertical para cambiar de sección
- siempre debe verse una card parcial al final del carrusel
- el movimiento debe ser fluido y natural

### 23.8 Consistencia Visual

El sistema debe mantener coherencia entre cards:

- mismos bordes
- mismas sombras
- misma lógica de espaciado
- consistencia en tipografía
- uso controlado del color

Evitar variaciones innecesarias que rompan la experiencia.

### 23.9 Reglas De Uso

- no mezclar tipos de card dentro de una misma sección sin intención clara
- no repetir estructuras visuales sin propósito
- no saturar con demasiada información
- no usar más de una acción principal por card

### 23.10 Objetivo Final

El sistema de cards debe permitir:

- entender rápido qué se está viendo
- generar interés visual inmediato
- facilitar la interacción
- mantener una experiencia fluida

Dorika no debe sentirse como una lista de datos, sino como un flujo continuo de descubrimiento visual donde cada card invita a explorar más.

## 24. Sistema De Rutas Y Previsualización Animada

Las rutas en Dorika no deben sentirse como registros estáticos ni como mapas técnicos. Deben construirse y mostrarse como experiencias guiadas, visuales y memorables.

La ruta no es solo una colección de puntos. La ruta es una narrativa espacial que debe ayudar al usuario a imaginar el recorrido antes de iniciarlo.

### 24.1 Principio General

El sistema de rutas debe seguir esta regla:

**Antes de empezar una ruta, el usuario debe poder entenderla y desear recorrerla.**

Por eso, cada ruta debe combinar:

- contexto visual
- secuencia clara de puntos
- previsualización del recorrido
- acciones simples para comenzar o revisar

Dorika no debe mostrar rutas como una lista fría de ubicaciones. Debe mostrar rutas como experiencias.

### 24.2 Estructura General De La Vista De Ruta

La vista pública de una ruta debe organizarse así:

- bloque superior con previsualización animada del recorrido
- bloque inferior con información y acciones

La animación debe ocupar aproximadamente la mitad superior de la pantalla.

Debajo de esa animación deben aparecer:

- nombre de la ruta
- descripción
- duración estimada
- dificultad
- cantidad de puntos u otra información útil
- botones de acción

Esto permite equilibrar emoción, comprensión y control.

### 24.3 Animación De Previsualización

Cada ruta debe incluir una animación automática que se reproduce al abrir el detalle de la ruta.

No debe depender de que el usuario descubra un botón para verla.

Objetivos de esta animación:

- generar impacto emocional
- explicar visualmente el recorrido
- preparar al usuario antes de iniciar la experiencia

La animación no debe parecer un replay técnico de GPS ni un mapa de navegación frío. Debe sentirse visual, suave y propia de Dorika.

### 24.4 Tipo De Recorrido

Por ahora, la ruta debe representarse con una línea conceptual estilizada entre puntos.

No es necesario en esta fase que siga calles o caminos exactos.

Razones:

- mejor control visual
- implementación más rápida
- mejor resultado estético para las primeras rutas
- suficiente para presentar el concepto y conseguir respaldo institucional

En fases futuras, si el producto lo requiere, podrá evaluarse una evolución hacia recorridos más precisos.

### 24.5 Comportamiento De La Animación

La secuencia ideal debe ser:

1. Vista general del área de la ruta.
   El mapa aparece limpio, con la zona general visible.

2. Inicio del trazo.
   La línea comienza a dibujarse desde el primer punto.

3. Avance entre puntos.
   La línea continúa dibujándose de forma suave, punto a punto.

4. Aparición de mini cards por punto.
   Cuando la animación llega a cada punto, debe aparecer una mini card breve con:

   - imagen del lugar
   - nombre del punto

   Ejemplos:

   - Casa Antón García de Bonilla
   - Columna de los Esclavos
   - Complejo Histórico La Gran Convención

5. Finalización del recorrido.
   La ruta completa queda visible en el mapa.

La animación debe sentirse fluida, no interrumpida, y no debe convertirse en un slideshow.

### 24.6 Regla De Las Mini Cards De Puntos

Cuando la animación alcance cada punto, no debe cortar a una pantalla nueva ni reemplazar la experiencia completa del mapa.

Debe mostrarse una mini card flotante rápida, integrada a la animación.

La mini card debe contener:

- imagen representativa del punto
- nombre del punto

Reglas:

- aparición breve
- transición suave
- no bloquear el recorrido
- desaparecer para permitir continuar la animación

La intención es enriquecer la experiencia, no romperla.

### 24.7 Duración Y Ritmo

La animación debe ser breve y agradable.

Recomendación:

- duración aproximada entre 3 y 6 segundos
- depende de la cantidad de puntos y del ritmo visual

No debe sentirse lenta ni convertirse en una intro excesiva.

Debe reproducirse automáticamente una sola vez al entrar.

Luego, la vista puede quedar estática con la ruta visible.

### 24.8 Estado Final Después De La Animación

Una vez terminada la animación, la ruta debe quedar visible y estable.

Debajo deben mantenerse disponibles los botones de acción principales:

- Empezar ruta
- Ver puntos
- Guardar

Esto permite que el usuario elija si quiere comenzar de inmediato, revisar antes o guardar la experiencia para después.

### 24.9 Diseño Del Mapa En Rutas

El mapa dentro de la vista de ruta debe ser claro, suave y visual.

Reglas:

- mapa limpio
- fondo discreto
- la ruta debe ser protagonista
- color propio Dorika para la línea
- puntos bien visibles
- transiciones suaves

No debe sentirse como una herramienta técnica de navegación, sino como una vista guiada de exploración.

### 24.10 Rol Estratégico De Las Primeras Rutas

Las primeras rutas deben verse especialmente bien, ya que cumplirán un rol estratégico para validación y presentación del proyecto.

Estas primeras rutas deben:

- tener buena portada
- usar imágenes atractivas de cada punto
- estar bien ordenadas
- tener narrativa clara
- reflejar el potencial turístico y cultural de Ocaña

No son solo contenido de prueba. Son parte del argumento de valor del producto.

### 24.11 Constructor De Rutas En El Panel Administrativo

El panel administrativo de Dorika debe permitir crear rutas de forma visual y controlada.

No debe sentirse como un formulario tradicional, sino como un constructor de experiencias.

### 24.12 Flujo Del Constructor De Rutas

La creación de una ruta debe incluir al menos estos pasos:

#### Paso 1: Información Base

- nombre de la ruta
- descripción corta
- descripción completa
- tipo de ruta
- portada principal

#### Paso 2: Puntos De La Ruta

Cada punto debe permitir definir:

- nombre
- descripción
- imagen
- ubicación
- orden dentro de la ruta

#### Paso 3: Organización Visual

- reordenar puntos
- editar puntos
- eliminar puntos
- revisar secuencia

#### Paso 4: Vista Previa

- ver cómo se verá la ruta en Dorika
- ver el trazado conceptual
- ver la secuencia de mini cards

#### Paso 5: Publicación

- guardar borrador
- publicar
- pausar

### 24.13 Generación De La Animación

La animación no debe diseñarse manualmente punto por punto.

Debe generarse automáticamente a partir de:

- orden de puntos
- coordenadas
- imágenes asociadas
- estilo visual definido por Dorika

Esto permite mantener escalabilidad y consistencia.

### 24.14 Nivel De Control En El Panel

Para esta fase, el panel debe permitir controlar solo lo necesario para lograr un resultado visual fuerte sin convertir el sistema en una herramienta compleja de edición.

Debe permitir:

- ordenar puntos
- cambiar imagen de cada punto
- editar textos
- previsualizar el resultado

No debe exigir edición avanzada tipo timeline, keyframes o animación manual.

La idea es:

**El usuario construye la ruta y Dorika genera automáticamente la experiencia visual.**

### 24.15 Uso Exclusivo De La Animación

En esta fase, la animación de recorrido debe existir solo dentro del detalle de la ruta.

No debe reproducirse en cards del home ni como mini preview automática en listados.

Esto ayuda a:

- conservar el impacto
- evitar sobrecarga visual
- reducir complejidad y costo
- hacer que la experiencia de abrir una ruta se sienta especial

### 24.16 Objetivo Final

El sistema de rutas debe lograr que una persona:

- entienda rápidamente el recorrido
- se imagine haciendo la experiencia
- sienta interés por empezarla
- vea que Dorika ofrece algo más que listados o mapas comunes

Las rutas deben sentirse como experiencias guiadas de descubrimiento, no como una secuencia técnica de ubicaciones.

## 25. Sistema De Home Y Secciones

El home de Dorika no debe ser una lista estática de contenido.

Debe funcionar como un sistema dinámico de descubrimiento visual que organiza negocios, productos y rutas según intención, contexto y relevancia.

### 25.1 Principio General

El home debe seguir esta regla:

**Mostrar primero lo más útil, luego lo más interesante, sin saturar al usuario.**

Esto implica:

- jerarquía clara de secciones
- contenido organizado por intención
- carga progresiva
- descubrimiento visual fluido

Dorika no muestra todo el contenido disponible. Dorika decide qué mostrar primero.

### 25.2 Estructura Base Del Home

El home debe organizarse en este orden:

1. Buscador
2. Banner dinámico con chips de intención
3. Secciones horizontales tipo carrusel

### 25.3 Límite De Secciones

Reglas:

- máximo 6 secciones visibles inicialmente
- al hacer scroll vertical, se cargan más secciones progresivamente
- no se deben cargar todas las secciones al mismo tiempo

Esto mantiene rendimiento y claridad.

### 25.4 Secciones Fijas

Las siguientes secciones forman parte de la estructura base:

- Rutas
- Negocios cerca de ti
- Productos cerca de ti

Estas secciones deben intentar mostrarse siempre.

### 25.5 Condición De Visibilidad De Secciones

Una sección solo debe mostrarse si tiene suficiente contenido.

Ejemplos:

- si no hay suficientes productos, no se muestra “Productos cerca de ti”
- si no hay suficientes negocios, no se muestra esa sección

Regla:

**No mostrar secciones vacías o débiles.**

### 25.6 Tipos De Secciones

Cada sección debe contener un solo tipo de contenido:

- solo negocios
- solo productos
- solo rutas

No se deben mezclar dentro del mismo carrusel.

### 25.7 Scroll Y Layout

El comportamiento base debe ser:

- cada sección usa scroll horizontal
- el home usa scroll vertical

Reglas:

- deben verse 2 cards completas y media card
- esto indica que hay más contenido hacia la derecha
- no usar botón “Ver más”
- la exploración se hace mediante scroll e intención

### 25.8 Carga De Contenido Por Sección

Reglas:

- cargar inicialmente 5 elementos por sección
- permitir expansión hasta 10 elementos
- cargar elementos adicionales de forma progresiva, uno a uno o en pequeños bloques

Esto evita sobrecarga inicial.

### 25.9 Tipos De Secciones Dinámicas

Además de las secciones base, Dorika puede generar secciones dinámicas como:

- Para comer hoy
- Abiertos ahora
- Recomendados
- Populares
- Destacados
- Turismo

Estas secciones deben generarse automáticamente según reglas.

### 25.10 Priorización De Contenido

El orden de los elementos dentro de cada sección debe seguir esta prioridad:

1. Calidad del perfil
2. Cercanía
3. Estado, abierto o cerrado
4. Intención del usuario
5. Destacados automáticos

### 25.11 Calidad Del Perfil

La calidad del perfil se determina por:

- imagen de portada
- ubicación definida
- descripción
- horario
- logo
- tipo de negocio
- indicaciones humanas, como referencias de ubicación

Los negocios con mejor perfil tienen mayor visibilidad.

### 25.12 Destacados Automáticos

Los elementos destacados deben generarse automáticamente a partir de una mezcla de:

- calidad del perfil
- interacción del usuario, como clics
- favoritos
- cercanía
- novedad, con peso menor

No se deben definir destacados manualmente en esta fase.

### 25.13 Comportamiento Según Intención

El home cambia su orden según la intención seleccionada.

#### Home General

- Rutas
- Negocios cerca de ti
- Productos cerca de ti
- Secciones dinámicas

#### Intención Comer

- Negocios de comida cerca de ti
- Productos de comida
- Abiertos ahora, comida
- Recomendados, comida
- Rutas gastronómicas, opcional

#### Intención Comprar

- Productos cerca de ti
- Negocios de compra
- Recomendados
- Destacados

#### Intención Turismo

- Rutas
- Lugares turísticos
- Experiencias
- Recomendados

### 25.14 Reglas De Intención

Reglas:

- toda la información debe filtrarse según la intención activa
- el sistema reorganiza el contenido, no reconstruye completamente el home
- las rutas solo son primera sección en home general y turismo

### 25.15 Comportamiento Según Hora

El contenido debe adaptarse al contexto:

- priorizar negocios abiertos
- mostrar información clara de horarios
- evitar confusión con negocios cerrados

Los negocios cerrados pueden mostrarse, pero con menor prioridad y señalización clara.

### 25.16 Aprendizaje Del Usuario

El home debe adaptarse progresivamente al comportamiento del usuario:

- lo que explora
- lo que toca
- lo que guarda

Esto permitirá mejorar recomendaciones en el tiempo.

### 25.17 Publicación Y Visibilidad De Negocios

Los negocios se sincronizan automáticamente desde Klicor.

Reglas:

- no todos los negocios tienen la misma visibilidad
- la visibilidad depende de la calidad del perfil
- negocios incompletos aparecen menos
- negocios completos tienen mayor prioridad

### 25.18 Estado De Preparación Para Dorika

Un negocio puede existir en Klicor pero no estar listo para Dorika.

Reglas:

- si está incompleto, tiene menor visibilidad
- si está completo, tiene mayor exposición

Esto incentiva al negocio a mejorar su información.

### 25.19 Objetivo Final

El sistema de home debe lograr:

- descubrimiento rápido
- claridad visual
- contenido relevante
- navegación intuitiva

Dorika no debe sentirse como una lista de opciones, sino como un flujo organizado de descubrimiento donde cada sección invita a explorar más.
