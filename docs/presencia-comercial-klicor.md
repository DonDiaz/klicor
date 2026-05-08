# Presencia Comercial Klicor

## Modos soportados

- `mitienda`
- `mimenu`
- `micatalogo`

Cada negocio puede tener solo un modo activo a la vez.

## Relacion con workspaces operativos

Klicor principal no debe convertirse en un dashboard gigante para todas las operaciones. Tienda, menu y catalogo son presencia comercial publica y administracion comercial basica; cuando una operacion requiera caja, inventario avanzado, comandas, proveedores, ventas diarias o agenda compleja, debe evolucionar hacia un workspace especializado.

Workspaces relacionados:

- `Klicor POS Restaurante` para restaurantes, cafes, bares, mesas, comandas, cocina, caja y domicilios.
- `Klicor POS Retail` para ropa, zapatos, accesorios, joyerias, variantes, inventario, ventas y caja.
- `Klicor POS Supermercado` para supermercados, minimercados, codigo de barras, proveedores, compras, inventario rapido y caja.
- `Klicor Agenda` para servicios por cita.

La vista publica sigue usando `/{username}/mimenu`, `/{username}/mitienda` o `/{username}/micatalogo`. El workspace operativo administra el trabajo diario y alimenta esos datos cuando corresponda.

## Arquitectura de datos

La configuración comercial ligera se guarda en el usuario:

```js
users/{uid} {
  commerceMode: "mitienda" | "mimenu" | "micatalogo" | "",
  commerce: {
    activeMode,
    orderWhatsapp,
    currency,
    categoriesCount,
    subcategoriesCount,
    productsCount,
    visibleProductsCount,
    hasContent
  }
}
```

El contenido operativo va en subcolecciones separadas:

- `users/{uid}/commerceCategories/{categoryId}`
- `users/{uid}/commerceSubcategories/{subcategoryId}`
- `users/{uid}/commerceProducts/{productId}`

Esto evita inflar el documento principal del usuario y permite consultas pequeñas.

## Reglas de negocio implementadas

- un solo modo activo por negocio
- precio obligatorio en `Mi tienda` y `Mi menú`
- precio opcional en `Mi catálogo`
- imagen obligatoria para cada producto
- si una categoría usa subcategorías, el producto debe vivir en una subcategoría
- no se pueden crear subcategorías en una categoría que ya tiene productos directos
- las categorías principales usan assets semánticos de categoría
- las subcategorías no usan icono, asset ni color propio; solo ordenan por texto
- el selector de asset de categoría muestra recomendados primero y solo abre el catálogo completo cuando el usuario lo pide
- productos ocultos se muestran desaturados y con badge `Oculto` en el panel
- orden manual con mover arriba / abajo para categorías, subcategorías y productos

## Estrategia Firebase

### Lecturas

- la vista pública carga primero:
  - negocio
  - configuración comercial
  - categorías
  - primer bloque de productos
- las demás categorías o subcategorías se cargan bajo demanda por API
- no se usan listeners en tiempo real en la parte pública

### Escrituras

- cada cambio administrativo actualiza solo el nodo afectado
- los conteos de resumen se recalculan después de cambios estructurales
- el panel administrativo sí puede cargar toda la estructura porque su frecuencia es mucho menor que la vista pública

### Caché

- bootstrap y chunks públicos quedan cacheados con tags:
  - `public-commerce:{username}`
  - `public-commerce:{username}:{mode}`
- cualquier cambio administrativo invalida esos tags

## Imágenes

- solo se aceptan `jpg`, `png` y `webp`
- peso máximo de subida: `5MB`
- se generan dos versiones optimizadas:
  - `main.webp` para vista pública
  - `thumb.webp` para cards y listados
- almacenamiento:
  - `commerce-products/{uid}/{productId}/main.webp`
  - `commerce-products/{uid}/{productId}/thumb.webp`

## Assets de categoría

- las categorías no usan fotos como flujo principal
- cada categoría principal debe resolver a un asset semántico tipo miniatura de producto
- el asset debe verse como objeto/producto reconocible, no como icono lineal plano
- la base comercial canonica de Klicor vive en `lib/commerce-category-target-catalog.js`: 241 categorias objetivo por linea, con nombre y aliases
- los assets IA activos por categoria viven en `public/commerce-assets/categories-ai-1254-review`, exportados como PNG transparentes de 1024x1024; `lib/commerce-category-local-assets.js` enlaza cada categoria canonica con su archivo local
- el panel administrativo y la vista publica cargan esos assets IA locales como representacion principal de categorias
- esta base temporal no reemplaza la meta de crear un catalogo propio definitivo; sirve para validar demanda, ordenar categorias y evitar gasto inicial
- el dashboard administrativo y la vista pública deben mostrar el mismo asset para evitar confusión
- el objetivo de cobertura es un catálogo curado de 1200 assets semánticos
- la cobertura de 1200 assets debe lograrse por bloques reales; no cuentan variaciones nominales que reutilizan el mismo visual
- el primer bloque en trabajo es calzado, con categorías globales; color, talla, marca y material van como filtros/subcategorías/productos
- el catálogo extendido no debe cargarse completo en la vista pública; la vista pública solo resuelve el asset elegido por la categoría
- el usuario no debe ver 1200 opciones de entrada; debe ver 3 a 6 recomendadas según el nombre escrito y abrir `Ver más opciones` solo si lo necesita
- las subcategorías no guardan ni muestran asset; su función es organizar productos dentro de una categoría

## Vista pública

- rutas:
  - `/{username}/mitienda`
  - `/{username}/mimenu`
  - `/{username}/micatalogo`
- `Mi tienda` y `Mi menú` comparten:
  - carrito modal
  - suma total
  - datos del cliente
  - envío del pedido por WhatsApp
- `Mi catálogo` no tiene carrito

## Mensaje de WhatsApp

Formato:

```txt
Pedido para [Nombre del negocio]
Productos:

2 x Hamburguesa = $xx
1 x Gaseosa = $xx

Total: $xx

Cliente:
Nombre: xxx
Dirección: xxx
Teléfono: xxx
Observaciones: xxx
```

## Límites por plan

La base ya está preparada para varios planes:

- `trial`
- `annual`
- `agency`
- `institutional`
- `courtesy`

Hoy se aplican límites de categorías, subcategorías y productos desde `lib/commerce-config.js`.

## Fases siguientes recomendadas

1. mejorar drag and drop táctil para reordenar
2. agregar paginación visual más rica en la vista pública
3. sumar variantes visuales específicas para tienda, menú y catálogo
4. agregar analytics comerciales por categoría y producto
5. conectar planes comerciales más finos según el plan de Klicor
