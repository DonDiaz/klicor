# Contrato de Implementacion para Codex

Este archivo define reglas obligatorias para cualquier implementacion en Klicor. Su objetivo es evitar improvisacion, cambios fuera de alcance y decisiones visuales o tecnicas no aprobadas.

Antes de modificar codigo relacionado con onboarding, link in bio, commerce, agenda, Dorika, temas, categorias o experiencia publica, Codex debe leer:

1. `docs/contrato-codex.md`
2. `docs/klicor-producto-decisiones.md`
3. Los archivos de codigo directamente afectados

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
- Si hay duda relevante que pueda romper producto, preguntar antes de implementar.

## 3. Proceso Obligatorio Antes de Implementar

Para cambios medianos o grandes:

1. Leer este contrato.
2. Leer el documento de producto.
3. Buscar en codigo los archivos afectados.
4. Identificar donde nace el dato, donde se guarda y donde se renderiza.
5. Hacer cambios minimos y coherentes con el sistema actual.
6. Ejecutar build o verificacion equivalente.
7. Reportar archivos modificados y resultado de verificacion.

## 4. Link In Bio

Reglas obligatorias:

- El link in bio usa `appearance`.
- El link in bio no debe heredar `commerceTheme`.
- El link in bio no debe mezclarse con logica interna de tienda, menu o catalogo.
- El link in bio es identidad y acceso rapido, no es tienda.
- Los botones publicos viven en `profileLinks`.
- Los metodos de pago viven en `paymentMethods`.
- Los botones automaticos de tienda, menu, catalogo y agenda deben ser editables desde configuracion de enlaces cuando existan.
- No volver a imponer limites artificiales de cantidad de enlaces o metodos de pago salvo instruccion explicita.

Prohibido:

- Convertir el link in bio en una tienda.
- Usar temas de comercio para pintar el link in bio.
- Ocultar botones automaticos del editor si aparecen en la vista publica.

## 5. Commerce: Tienda, Menu y Catalogo

Reglas obligatorias:

- Commerce debe evolucionar hacia un tema separado de `appearance`.
- Tienda, menu y catalogo no deben depender visualmente del tema del link in bio.
- El producto debe ser protagonista.
- La experiencia debe adaptarse al modo:
  - `mitienda`: productos con precio y carrito.
  - `mimenu`: platos/bebidas con pedido.
  - `micatalogo`: catalogo flexible, sin precio obligatorio y sin carrito obligatorio.
- Si se crea `commerceTheme`, debe estar aislado de `appearance`.

Prohibido:

- Usar `appearance` como unica fuente visual para tienda/menu/catalogo en nuevos redisenos.
- Rehacer todo commerce de una vez si la tarea es una fase puntual.
- Crear muchos temas antes de validar un set pequeno y bien hecho.

## 6. Categorias de Commerce

Reglas obligatorias:

- Las categorias SIEMPRE deben usar icono, color y nombre.
- Las categorias NO deben depender de fotos como experiencia principal.
- Si existe un campo de imagen en categorias, no debe usarse como render principal sin aprobacion explicita.
- El selector de iconos debe ser visual.
- El usuario debe escoger viendo iconos, no solo leyendo una lista de palabras.
- Los iconos deben sugerirse segun la informacion que ya dio el negocio.

Render esperado:

```txt
icono + color + nombre
```

Prohibido:

- Pedir foto obligatoria para una categoria.
- Renderizar categorias como tarjetas fotograficas por defecto.
- Usar iconos aleatorios sin curaduria por vertical.

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
- Moda y calzado no deben tematizarse con estereotipos simples.
- Ropa y zapatos deben compartir sistema de moda cuando aplique.
- El usuario debe poder cambiar el tema sugerido.

Modelo recomendado para moda:

```txt
commerceVertical: fashion
fashionProductMix: clothing | shoes | clothing_shoes | accessories | general
fashionAudience: women | men | unisex
commerceTheme: fashion_women | fashion_men | fashion_unisex
```

Prohibido:

- Asumir `ropa = rosado`.
- Asumir `zapatos = cafe`.
- Crear tema distinto para cada producto si la audiencia resuelve mejor el problema.

## 9. Onboarding

Reglas obligatorias:

- No agregar nuevos pasos o preguntas sin compactar primero la UI actual.
- El onboarding debe funcionar bien en pantallas pequenas de PC y baja resolucion.
- Los indicadores de progreso deben ser compactos.
- Los formularios deben evitar scroll excesivo.
- Las cards de seleccion deben ser eficientes, no enormes.

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

Reglas obligatorias:

- Dorika no debe pedir informacion que Klicor ya tiene.
- Dorika debe usar datos existentes del negocio.
- La clasificacion del negocio debe vivir en Klicor como dato base.
- Dorika debe leer categoria, tipo de negocio, vertical comercial, ubicacion, modulo activo y productos destacados si aplica.

Prohibido:

- Duplicar preguntas de tipo de negocio dentro de Dorika.
- Mezclar temas de commerce con logica visual de Dorika.
- Redisenar mapa o rutas desde tareas de Klicor salvo orden explicita.

## 11. Agenda

Reglas obligatorias:

- Agenda debe mantenerse como modulo de citas/servicios.
- No debe mezclarse con tienda/menu/catalogo.
- Puede usar categoria del negocio para sugerencias, pero su flujo debe seguir separado.

Prohibido:

- Rehacer booking mientras la tarea es commerce/onboarding.
- Convertir agenda en catalogo de productos.

## 12. Diseno y UX

Reglas obligatorias:

- Priorizar claridad, conversion y velocidad de configuracion.
- Compactar antes de agregar complejidad.
- Reducir scroll en pantallas pequenas.
- Usar visuales donde ayudan a decidir, no como decoracion pesada.
- Las referencias visuales deben traducirse a reglas concretas antes de implementar.

Prohibido:

- Copiar referencias literalmente.
- Crear UI mas grande si el usuario pidio compactar.
- Usar cards enormes para selecciones simples.
- Agregar textos explicativos largos dentro de la UI.

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

- Ejecutar `npm run build` si el cambio afecta Next, UI importante, schemas o imports.
- Si el cambio es visual, verificar en navegador local cuando sea posible.
- Revisar `git diff` antes de responder.
- No incluir logs temporales en commit.

## 15. Criterio de Parada

Codex debe detenerse y preguntar si:

- Una instruccion exige cambiar arquitectura no documentada.
- Hay riesgo de perder datos existentes.
- Hay contradiccion entre el usuario y este contrato.
- El cambio requiere decidir una experiencia de producto no definida.

Codex no debe detenerse por detalles menores si puede resolverlos leyendo el codigo y siguiendo este contrato.
