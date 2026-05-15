# Contrato de Implementacion para Codex

Este archivo define reglas obligatorias para cualquier implementacion en Klicor. Su objetivo es evitar improvisacion, cambios fuera de alcance y decisiones visuales o tecnicas no aprobadas.

Antes de modificar codigo relacionado con onboarding, link in bio, commerce, agenda, Dorika, temas, categorias o experiencia publica, Codex debe leer:

1. `docs/contrato-codex.md`
2. `docs/klicor-producto-decisiones.md`
3. `docs/operacion-entornos-klicor.md`
4. Los archivos de codigo directamente afectados
5. La documentacion oficial vigente de las tecnologias involucradas cuando el cambio toque APIs externas, framework, seguridad, autenticacion, datos, reglas, storage, cache, imagenes, webhooks, pagos, correo, despliegue o infraestructura

## 0. Regla Operativa de Entornos

Klicor puede editarse desde un workspace local, pero el workspace local no es el entorno de ejecucion ni de validacion del producto.

- El workspace local se usa para leer codigo, editar archivos, revisar diferencias, hacer validaciones estaticas ligeras, preparar commits y hacer push.
- No se deben levantar servidores ni entornos locales por defecto: no `npm run dev`, no `next dev`, no emuladores Firebase y no validacion en `localhost`.
- `bioimpulso` es el entorno oficial de pruebas y reemplaza el uso local para validar cambios reales.
- `klicor` es el entorno de produccion.
- Todo cambio debe probarse primero en `bioimpulso` y solo despues promoverse a `klicor` produccion.
- Si el usuario no aclara entorno, Codex debe preguntar si el cambio va en `bioimpulso` pruebas o en `klicor` produccion.
- Antes de hacer commit/push, Codex debe confirmar a que repo/proyecto apunta el workspace activo.

La regla completa vive en `docs/operacion-entornos-klicor.md`.

## 1. Precedencia

Cuando haya conflicto entre fuentes, usar este orden:

1. Instruccion directa del usuario en el chat actual.
2. Este contrato.
3. `docs/klicor-producto-decisiones.md`.
4. Codigo existente.
5. Criterio propio del asistente.

Si una instruccion del usuario contradice este contrato, Codex debe mencionar el conflicto antes de implementar.

## 2. Reglas Globales

- No asumir comportamiento no definido.
- No redisenar flujos completos si la tarea es puntual.
- No modificar backend si la tarea es solo frontend, salvo necesidad demostrable.
- No cambiar modelos de datos sin revisar donde se guardan, leen y renderizan.
- No eliminar funcionalidad existente sin instruccion explicita.
- No simplificar logica existente si esa logica ya resuelve un caso real.
- No agregar dependencias nuevas sin justificar por que las actuales no sirven.
- No crear soluciones temporales si el usuario pidio una solucion de arquitectura.
- No hacer commit ni push salvo orden explicita del usuario.
- No codificar mirando solo el archivo o sintoma visible. Antes de tocar codigo, entender el flujo completo afectado y sus impactos en frontend, backend, datos, permisos, cache, rutas publicas, planes, entornos y experiencia real.
- No basar decisiones tecnicas sensibles solo en memoria o documentacion interna. Cuando el cambio dependa de Next.js, React, Firebase, Firestore, Storage, Firebase Rules, Firebase Admin, Vercel, Mercado Pago, Resend, Zod, `next/image`, cache, headers, webhooks o dependencias externas, contrastar con documentacion oficial o fuente primaria vigente.
- Si hay duda relevante que pueda romper producto, preguntar antes de implementar.

## 3. Proceso Obligatorio Antes de Implementar

Para cambios medianos o grandes:

1. Leer este contrato.
2. Leer el documento de producto.
3. Leer documentacion oficial vigente si el cambio depende de una tecnologia, API, servicio externo, seguridad, datos, despliegue o comportamiento de framework.
4. Buscar en codigo los archivos afectados.
5. Identificar donde nace el dato, donde se valida, donde se guarda, donde se lee, donde se cachea y donde se renderiza.
6. Identificar impactos laterales: rutas publicas/admin, permisos, reglas de plan/modulo, Storage, Firestore, billing, analytics, demos, pruebas y produccion.
7. Hacer cambios minimos y coherentes con el sistema actual.
8. Ejecutar build o verificacion equivalente.
9. Reportar archivos modificados y resultado de verificacion.

## 4. Link In Bio

Reglas obligatorias:

- El link in bio usa `appearance`.
- El link in bio no debe heredar `commerceTheme`.
- El link in bio no debe mezclarse con logica interna de tienda, menu o catalogo.
- El link in bio es identidad y acceso rapido, no es tienda.
- Los botones publicos viven en `profileLinks`.
- Los metodos de pago viven en `paymentMethods`.
- Los botones automaticos de tienda, menu, catalogo y agenda deben ser editables desde configuracion de enlaces cuando existan.
- El link in bio es la pantalla publica de inicio del negocio; Agenda no debe duplicar esa portada.
- El acceso publico a Agenda debe nacer desde el boton/enlace de Agenda configurado en el link in bio.
- No volver a imponer limites artificiales de cantidad de enlaces o metodos de pago salvo instruccion explicita.

Prohibido:

- Convertir el link in bio en una tienda.
- Usar temas de comercio para pintar el link in bio.
- Ocultar botones automaticos del editor si aparecen en la vista publica.
- Crear una pantalla de inicio de Agenda que repita logo, redes, slogan y CTA principal del link in bio sin aprobacion explicita.

## 5. Commerce: Tienda, Menu y Catalogo

Reglas obligatorias:

- Commerce debe evolucionar hacia un tema separado de `appearance`.
- Tienda, menu y catalogo no deben depender visualmente del tema del link in bio.
- El producto debe ser protagonista.
- La experiencia debe adaptarse al modo:
  - `mimenu`: comida, lista vertical, cards horizontales, precio, boton `+`, carrito fijo y pedido por WhatsApp.
  - `mitienda`: ecommerce ligero, grid/lista de productos, precio, boton `+`, carrito fijo y pedido por WhatsApp.
  - `micatalogo`: catalogo visual tipo feed, precio opcional, SIN carrito, SIN boton `+`, consulta directa por WhatsApp.
- Si se crea `commerceTheme`, debe estar aislado de `appearance`.
- Catalogo no es tienda sin precio; catalogo es una experiencia visual de consulta.
- En `micatalogo`, al preguntar por un producto, el mensaje de WhatsApp debe incluir automaticamente el producto consultado.

Mensaje base esperado para catalogo:

```txt
Hola, vi este producto en tu catalogo:
[Nombre producto]

Esta disponible?
```

Prohibido:

- Usar `appearance` como unica fuente visual para tienda/menu/catalogo en nuevos redisenos.
- Rehacer todo commerce de una vez si la tarea es una fase puntual.
- Crear muchos temas antes de validar un set pequeno y bien hecho.
- Agregar carrito, checkout, totales o boton `+` al modo `micatalogo`.

## 6. Categorias de Commerce

Reglas obligatorias:

- Las categorias SIEMPRE deben usar icono/asset visual semantico y nombre.
- El color visible de categorias en tienda/menu/catalogo debe venir del tema, no de una decision manual del usuario.
- Las categorias NO deben depender de fotos como experiencia principal.
- Si existe un campo de imagen en categorias, no debe usarse como render principal sin aprobacion explicita.
- El selector de iconos debe ser visual y curado por vertical.
- El usuario debe escoger viendo iconos, no solo leyendo una lista de palabras.
- Los iconos deben sugerirse segun la informacion que ya dio el negocio.
- La base semantica debe cubrir comida, retail, servicios, salud/belleza y turismo, incluyendo sinonimos comunes.
- Las palabras ambiguas deben resolverse con la vertical del negocio cuando exista.

Render esperado:

```txt
icono/asset visual + nombre
```

Prohibido:

- Pedir foto obligatoria para una categoria.
- Renderizar categorias como tarjetas fotograficas por defecto.
- Usar iconos aleatorios sin curaduria por vertical.
- Pedir al usuario que escoja color manual para categorias en commerce publico.

## 7. Productos

Reglas obligatorias:

- Los productos SI deben usar imagenes cuando el negocio las tenga.
- La foto del producto es parte central de la experiencia comercial.
- Iconos no deben reemplazar fotos de producto salvo placeholder.

Prohibido:

- Usar iconos como sustituto permanente de imagenes de producto.
- Obligar una estetica unica para todos los productos.

## 8. Temas de Commerce

Reglas obligatorias:

- Los temas deben definirse por vertical, audiencia e intencion comercial.
- Los temas deben separar modulo, categoria, subcategoria y variante.
- Moda y calzado no deben tematizarse con estereotipos simples.
- Ropa y zapatos deben compartir sistema de moda cuando aplique.
- El usuario debe poder cambiar el tema sugerido.

Modelo recomendado general:

```txt
commerceExperience.module: mimenu | mitienda | micatalogo
commerceExperience.category: food | store | services | health | tourism
commerceExperience.subcategory: pizza | grocery | fashion | shoes | tech | general | etc
commerceExperience.variant: female | male | mixed | neutral
commerceLayout: menu_list | store_grid | catalog_feed
commerceTheme: food_warm | food_pizzeria | grocery_fresh | fashion_female | fashion_male | fashion_mixed | tech_blue | general_market | services_clean | health_soft | tourism_earth | etc
```

Modelo recomendado para moda:

```txt
theme.base: fashion
theme.variant: female | male | mixed
theme.subcategory: clothing | shoes | clothing_shoes | accessories | general
```

Reglas de variante para moda y calzado:

- Los tipos guardados desde registro deben ser explicitos cuando aplique:
  - `clothing_female`, `clothing_male`, `clothing_mixed`
  - `shoes_female`, `shoes_male`, `shoes_mixed`
- Los valores legacy `clothing` y `shoes` pueden existir, pero deben resolverse como `neutral`.
- `female`: fondo claro blanco/crema, primario rosado/nude/morado suave, mas aire visual, tipografia ligera, imagenes lifestyle cuando aplique.
- `male`: fondo blanco/gris claro, primario negro/azul oscuro/verde militar, cards mas compactas, tipografia solida, imagen producto directo o lifestyle sobrio.
- `mixed`: no es mezcla de colores; es neutralidad + organizacion.
- `mixed` debe usar fondo blanco/gris claro/beige, primario neutro negro/gris oscuro y acento suave tomado de marca cuando exista.
- En moda/calzado mixto debe existir filtro visible para separar `Mujer` y `Hombre` cuando el catalogo tenga ambos.
- En moda/calzado mixto las imagenes deben verse equilibradas y con mas enfoque en producto que en un solo perfil de modelo.
- Zapatos comparte base `fashion`, pero debe dar mas protagonismo a la imagen, usar cards mas grandes, menos texto y mas detalle visual del producto.

Prohibido:

- Asumir `ropa = rosado`.
- Asumir `zapatos = cafe`.
- Crear tema distinto para cada producto si la audiencia resuelve mejor el problema.
- Crear temas separados como `ropa_mujer` y `zapatos_mujer` si pueden resolverse con `base: fashion`, `variant` y `subcategory`.
- En `mixed`, combinar rosado y negro sin estructura o mezclar estilos incompatibles.
- En `mixed`, ocultar la separacion hombre/mujer cuando ambos tipos de producto existen.

## 9. Onboarding

Reglas obligatorias:

- No agregar nuevos pasos o preguntas sin compactar primero la UI actual.
- El onboarding debe funcionar bien en pantallas pequenas de PC y baja resolucion.
- Los indicadores de progreso deben ser compactos.
- Los formularios deben evitar scroll excesivo.
- Las cards de seleccion deben ser eficientes, no enormes.
- La ubicacion del negocio debe evolucionar a coordenadas seleccionadas en mapa, no a un link manual de Google Maps.
- Si se genera un enlace de mapa para el link in bio, debe salir de las coordenadas guardadas.

Cambios de copy obligatorios cuando se toque onboarding:

- Usar `Nombre de tu negocio` como orientacion del campo de negocio.
- No autollenar el nombre del negocio desde nombre de persona o correo.
- El usuario publico debe generarse desde el nombre del negocio mientras se escribe.
- `Titulo comercial` debe cambiar a `Slogan de tu negocio`.
- Si no hay logo cargado, el upload debe decir `Carga el logo de tu negocio`.
- El enlace de Google Maps debe llamarse `Ubicacion`, no `Servicios`.

Prohibido:

- Agregar mas preguntas al onboarding actual sin reducir densidad visual.
- Mantener indicadores de progreso altos si pueden ir en una sola linea.
- Hacer que el usuario repita informacion ya conocida.

## 10. Dorika

Esta seccion aplica solo a cambios de Klicor que alimentan Dorika. Si la tarea toca Dorika publico, mapa, rutas, buscador, admin de Dorika o experiencia de descubrimiento, Codex debe leer el contrato especifico de Dorika en `../dorika/docs/contrato-codex-dorika.md` cuando ese repositorio exista en el workspace.

Reglas obligatorias:

- Dorika no debe pedir informacion que Klicor ya tiene.
- Dorika debe usar datos existentes del negocio.
- La clasificacion del negocio debe vivir en Klicor como dato base.
- Dorika debe leer categoria, tipo de negocio, vertical comercial, ubicacion, modulo activo y productos destacados si aplica.
- Si la tarea toca Dorika publico, Codex debe leer tambien `../dorika/docs/arquitectura-producto-dorika.md` cuando ese repositorio exista en el workspace.
- El buscador de Dorika es una experiencia de descubrimiento, no un modal tecnico ni un formulario que redirige sin contexto.
- El buscador de Dorika debe buscar negocios, productos, rutas, categorias y descripciones de productos.
- Las sugerencias del buscador deben modificar la experiencia visible o navegar a una vista con contexto real; esta prohibido que un click deje al usuario en el mismo home sin cambio perceptible.
- Los resultados del buscador deben abrir el detalle correcto: negocio, producto o ruta. No deben mandar a un home generico salvo que el resultado sea una intencion o seccion claramente definida.
- La UI del buscador debe respetar el patron existente de Dorika: al hacer scroll queda logo + barra de busqueda compacta. Al activar busqueda, la experiencia debe sentirse como extension de ese patron, no como popup pesado.
- La busqueda debe ser rapida; si consulta base de datos, debe usar limites, indices/vistas o fallback controlado. No cargar datasets completos en cliente.

Prohibido:

- Duplicar preguntas de tipo de negocio dentro de Dorika.
- Mezclar temas de commerce con logica visual de Dorika.
- Redisenar mapa o rutas desde tareas de Klicor salvo orden explicita.
- Crear overlays que rompan la navegacion, tapen el bottom nav sin intencion o corten el contexto visual.
- Implementar sugerencias falsas que parezcan accionables pero no cambien nada.

## 11. Agenda

Reglas obligatorias:

- Agenda debe mantenerse como modulo de citas/servicios.
- No debe mezclarse con tienda/menu/catalogo.
- Puede usar categoria del negocio para sugerencias, pero su flujo debe seguir separado.
- Agenda publica debe tratar una reserva como solicitud cuando la confirmacion manual esta activa.
- La confirmacion manual debe ser el comportamiento recomendado por defecto para evitar que el negocio reciba citas confirmadas sin revisar.
- Una cita solicitada por el cliente debe poder quedar en estado `pending` hasta que el negocio la acepte, rechace o reprograme.
- Si el negocio activa confirmacion automatica, la experiencia publica debe comunicar cita confirmada y no solicitud pendiente.
- El lenguaje publico de Agenda debe depender de la configuracion del negocio: solicitud cuando hay confirmacion manual, cita confirmada cuando hay confirmacion automatica.
- El correo o mensaje de confirmacion de cita solo debe enviarse cuando la cita pase a `confirmed`, salvo que exista una configuracion explicita para enviar acuse de recibo de solicitud.
- Los recordatorios por correo o WhatsApp deben ser configurables por el negocio y no asumirse como obligatorios.
- La reactivacion de clientes despues de varios dias sin volver debe ser opcional, apagada por defecto y configurable por cantidad de dias.
- Agenda puede evolucionar hacia una capa operativa diaria para negocios con varios profesionales, manteniendo servicios, profesionales, horarios, disponibilidad, citas manuales y cambios de agenda como conceptos separados.
- La experiencia publica de Agenda puede adaptar tono visual por vertical o marca del negocio.
- El dashboard administrativo de Agenda debe mantener el sistema visual de Klicor y no heredar el tema publico del negocio.
- La navegacion global de Klicor debe mantenerse lateral; la navegacion interna de Agenda debe tratarse como navegacion contextual del modulo.
- La identidad del cliente en Agenda publica debe resolverse preferiblemente con login de Google usando Firebase Auth, no pidiendo correo escrito manualmente como fuente principal.
- La persistencia de sesion en Agenda y dashboard debe ser una decision explicita de seguridad, no un comportamiento permanente automatico.
- Tarea pendiente preproduccion: usar sesion no permanente por defecto o agregar "recordarme" desmarcado por defecto, validando Google y enlace magico.
- El correo del cliente para notificaciones debe venir de la cuenta autenticada y verificada por el proveedor; no debe confiarse en un email libre escrito en el formulario publico.
- El telefono/WhatsApp del cliente puede seguir siendo requerido para contacto operativo y recordatorios, pero debe guardarse asociado al cliente autenticado cuando exista sesion.
- Las citas deben poder guardar referencia de cliente autenticado: `customerUid`, `customerEmail`, `customerEmailVerified`, `customerPhotoURL`, `customerAuthProvider` y telefono normalizado, sin romper citas antiguas que solo tengan nombre y telefono.
- El correo de notificacion al negocio debe enviarse por defecto al correo de la cuenta Klicor del negocio (`user.email`). Mas adelante puede existir una lista opcional de destinatarios, pero no debe obligarse al negocio a configurar otro correo para recibir solicitudes.
- Cuando la confirmacion manual este activa, el negocio debe recibir correo de nueva solicitud si `notifyBusinessOnRequest` esta activo; el cliente solo debe recibir confirmacion definitiva cuando el negocio acepte, salvo que exista acuse de recibo de solicitud claramente configurado.
- Cuando la confirmacion automatica este activa, la cita nace `confirmed`; el cliente puede recibir correo de cita confirmada inmediatamente si `notifyCustomerOnConfirmation` esta activo y el negocio debe recibir aviso operativo de la nueva cita.
- Reprogramaciones, cancelaciones, rechazo/no aceptacion y cambios de estado deben generar mensajes transaccionales coherentes al cliente cuando haya email autenticado, y al negocio cuando aplique como control operativo.
- WhatsApp debe usarse como recordatorio operativo, no como canal principal de confirmacion por defecto. Para mensajes iniciados por Klicor fuera de una conversacion activa se deben usar plantillas oficiales aprobadas de WhatsApp Business Platform, respetar consentimiento y evitar textos de reactivacion invasivos.
- Las fuentes tecnicas base para implementar esta capa son Firebase Auth para login/identidad, Resend para correo transaccional ya presente en el proyecto, y WhatsApp Business Platform/Cloud API para recordatorios por plantilla cuando se active ese canal.
- El dashboard de Agenda debe actualizar citas por escucha en tiempo real de Firestore, no por polling permanente. Puede existir refresco al volver al foco y boton manual `Actualizar`, pero no intervalos agresivos que lean Firestore todo el dia.
- Si se toca tiempo real, permisos o colecciones de Agenda, desplegar tambien `firestore.rules` en el Firebase correspondiente. Vercel no despliega reglas de Firestore.
- Los recordatorios automaticos MVP corren por GitHub Actions cada 15 minutos contra `/api/booking/reminders/cron`; antes de diagnosticar un fallo, revisar los `stats` del workflow.

Prohibido:

- Rehacer booking mientras la tarea es commerce/onboarding.
- Convertir agenda en catalogo de productos.
- Enviar confirmaciones definitivas antes de que el negocio acepte una cita cuando la confirmacion manual esta activa.
- Activar recordatorios invasivos o campanas de retorno sin configuracion explicita del negocio.
- Pedir al cliente que escriba un correo si ya existe una sesion autenticada que lo entrega de forma confiable.
- Enviar al cliente una "cita confirmada" cuando el negocio esta en confirmacion manual y aun no acepto la solicitud.
- Enviar mensajes de WhatsApp libres como recordatorio automatico fuera de las reglas oficiales de plantillas y ventanas de conversacion.
- Mezclar Agenda con Reservas de turismo, planes, cupos o experiencias.
- Hacer que el dashboard administrativo de Agenda cambie de estilo por barberia, salon, consultorio u otra vertical.

## 11.1 Planes, Modulos y Suscripcion

Reglas obligatorias:

- El plan define capacidad maxima, precio y ciclo de cobro; no debe usarse como unico indicador de modulo activo.
- La cuenta debe poder guardar que modulos tiene habilitados realmente mediante una regla equivalente a `enabledModules`.
- El tipo de negocio define el modulo recomendado al registrarse.
- Para usar un modulo deben cumplirse tres condiciones: cuenta en trial o activa, modulo habilitado para esa cuenta y plan con capacidad suficiente.
- `trial` dura 30 dias por defecto, habilita el modulo principal segun el registro y permite activar el otro modulo durante el mes de prueba.
- `trial` permite probar Commerce y Agenda.
- `trial` permite Commerce hasta 50 productos.
- Si el cliente paga durante el trial, los dias gratis restantes no se pierden; el ano pagado empieza despues de terminar el trial.
- `basic` es solo link in bio: perfil publico, link personalizado, QR, botones/enlaces, metodos de pago, horarios y personalizacion basica.
- `basic` no incluye Commerce, Agenda, tienda, menu, catalogo, reservas, automatizaciones ni analiticas avanzadas.
- Una cuenta que pasa de trial a `basic` no debe conservar Commerce ni Agenda por haberlos probado durante el trial.
- `commercial` es para un modulo operativo principal: Commerce o Agenda segun lo que el cliente pago/configuro.
- `commercial` con Commerce permite hasta 50 productos.
- `commercial` no debe tener Commerce y Agenda al mismo tiempo.
- Si un cliente `commercial` quiere Commerce + Agenda, debe pasar a `plus`.
- `plus` permite combinar Commerce + Agenda.
- `plus` permite Commerce hasta 300 productos.
- `plus` puede activar Agenda si el cliente la desea.
- `pro`, `institutional`, `agency` y `courtesy` son planes ocultos o administrativos para casos especiales.
- En upgrade de `commercial` a `plus`, se cobra un ano nuevo de Plus desde la fecha del upgrade y se descuenta el valor no usado de Comercial.
- En upgrade de `commercial` a `plus`, la nueva fecha de vencimiento debe ser un ano desde la fecha del upgrade.
- El pago de upgrade debe guardar metadatos como `paymentType`, `fromPlan`, `toPlan`, `creditAmount`, `amountCharged`, `previousExpiresAt` y `newExpiresAt`.

Formula aprobada para upgrade:

```txt
credito = precioComercial * diasRestantes / 365
valorUpgrade = precioPlus - credito
nuevoVencimiento = fechaUpgrade + 1 ano
```

Prohibido:

- Dejar Commerce o Agenda activos en `basic`.
- Activar Commerce y Agenda al mismo tiempo en `commercial`.
- Cobrar un upgrade proporcional pequeno que mantenga el vencimiento anterior cuando la regla aprobada es reiniciar Plus por un ano con credito de Comercial no usado.
- Duplicar reglas de planes en otros documentos sin apuntar a esta decision.

## 12. Diseno y UX

Reglas obligatorias:

- Priorizar claridad, conversion y velocidad de configuracion.
- Compactar antes de agregar complejidad.
- Reducir scroll en pantallas pequenas.
- El editor completo debe usar densidad compacta por defecto, especialmente en Enlaces, Diseno, Perfil y Dorika.
- Usar visuales donde ayudan a decidir, no como decoracion pesada.
- Las referencias visuales deben traducirse a reglas concretas antes de implementar.

Prohibido:

- Copiar referencias literalmente.
- Crear UI mas grande si el usuario pidio compactar.
- Usar cards enormes para selecciones simples.
- Agregar textos explicativos largos dentro de la UI.

## 12.1 Mantenimiento de CSS y Cambios Visuales

Reglas obligatorias:

- No agregar CSS nuevo encima de CSS viejo sin revisar primero que reglas existentes afectan el componente, vista o modulo.
- Cuando se modifique una tarjeta, boton, modal, grilla, vista publica, dashboard o preview, se deben buscar las clases relacionadas completas antes de editar.
- Si una regla nueva contradice una regla vieja, no se debe dejar la pelea en cascada: se debe reemplazar, consolidar o eliminar la regla anterior cuando ya no aplique.
- Todo cambio visual debe considerar donde mas se usa el componente o clase: publico, dashboard, preview, movil, desktop y estados dinamicos.
- Cuando se reemplace comportamiento visual, el codigo viejo relacionado debe eliminarse en el mismo cambio si ya no tiene uso real.
- Si no es seguro eliminar una regla vieja porque puede estar ligada a clases dinamicas, se debe dejar constancia en el informe y no borrar a ciegas.
- Los bloques CSS nuevos deben tener contexto claro por modulo o superficie: base, link publico, dashboard, agenda, commerce, landing, admin o preview.
- Antes de cerrar una modificacion visual, revisar `git diff` para detectar si se esta duplicando una solucion ya existente.

Prohibido:

- Parchear visualmente agregando selectores mas especificos sin revisar la causa original.
- Dejar dos fuentes de verdad para el mismo comportamiento visual.
- Usar `!important` para resolver conflictos de cascada salvo emergencia justificada y documentada.
- Hacer limpiezas masivas de CSS sin pruebas visuales por modulo.
- Borrar clases sospechosas solo porque no aparecen en busqueda textual; primero validar clases dinamicas, estados y vistas condicionales.

## 12.2 Lector de Logo y Temas

Reglas obligatorias:

- El color principal sugerido desde un logo debe priorizar colores de marca, no fondos.
- El fondo de una imagen no debe usarse como color principal salvo que sea claramente parte de la marca.
- Si un color dominante esta en bordes o zonas de fondo, debe penalizarse frente a colores con mas intencion visual.
- Los temas generados por logo deben seguir siendo editables por el usuario.

## 13. Referencias Visuales

Las referencias deben guardarse en:

```txt
docs/referencias/
```

Reglas:

- Cada referencia debe tener una nota de que se toma de ella.
- No copiar marca, logo o contenido literal.
- Extraer patrones: jerarquia, layout, ritmo, tipo de card, CTA, uso de imagen, densidad.

## 14. Verificacion

Antes de entregar cambios de codigo:

- No levantar servidores locales ni validar en `localhost` salvo instruccion explicita del usuario.
- Ejecutar validaciones estaticas ligeras cuando apliquen y no saturen el PC.
- Si el cambio afecta UI o flujo real, verificar en `bioimpulso` pruebas.
- Revisar `git diff` antes de responder.
- No incluir logs temporales en commit.

## 15. Criterio de Parada

Codex debe detenerse y preguntar si:

- Una instruccion exige cambiar arquitectura no documentada.
- Hay riesgo de perder datos existentes.
- Hay contradiccion entre el usuario y este contrato.
- El cambio requiere decidir una experiencia de producto no definida.
- El cambio parece puntual, pero su impacto real cruza datos, permisos, billing, planes, rutas publicas, integraciones externas o produccion y no hay suficiente claridad.

Codex no debe detenerse por detalles menores si puede resolverlos leyendo el codigo y siguiendo este contrato.
