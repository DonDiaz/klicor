# Presencia Comercial Klicor

## Modos soportados

- `mitienda`
- `mimenu`
- `micatalogo`

Cada negocio puede tener solo un modo activo a la vez.

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
