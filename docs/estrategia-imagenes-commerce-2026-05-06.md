# Estrategia de imagenes para comercio - 2026-05-06

## Problema

La tienda publica no debe sentirse lenta con 50 productos y una imagen por producto.

El problema no se debe tratar como "hay muchas imagenes", sino como una combinacion de:

- Tamano real descargado por cada tarjeta.
- Cache del archivo en Storage y del optimizador de Next.
- Payload inicial que se envia al cliente.
- Cantidad de imagenes que el navegador intenta resolver al entrar.

## Fuentes consultadas

- Next.js Image Component: https://nextjs.org/docs/app/api-reference/components/image
- Firebase Storage metadata `cacheControl`: https://firebase.google.com/docs/reference/js/storage.settablemetadata
- Firebase Resize Images Extension: https://extensions.dev/extensions/firebase/storage-resize-images

## Hallazgos en Klicor

### La tienda publica usaba `<img>` directo

En `components/commerce-public-view.js`, las tarjetas de producto, el detalle, las miniaturas del detalle, el carrito y el logo del negocio usaban `<img>`.

Eso funciona, pero no aprovecha el optimizador de imagenes de Next.js.

Segun la documentacion oficial de Next.js:

- Las imagenes remotas necesitan dimensiones o `fill`.
- `sizes` ayuda al navegador a escoger el tamano correcto.
- Sin `sizes`, una imagen responsive puede descargar mas grande de lo necesario.
- `loading="lazy"` difiere imagenes que no estan cerca del viewport.

Decision aplicada:

- Se cambio la vista publica de comercio para usar `next/image`.
- Las tarjetas usan `fill` con `sizes` especifico para grilla movil, tablet y escritorio.
- Las miniaturas del detalle y carrito usan `sizes="70px"`.
- La imagen principal del detalle usa el archivo grande, pero solo cuando el usuario abre el modal.

### El thumbnail de producto era demasiado grande para tarjetas

Antes:

- Thumbnail: `640x640`
- Uso frecuente en tarjeta: entre `72x72`, `84x84` o una tarjeta visual pequena.

Decision aplicada:

- Los nuevos thumbnails de producto se guardan como `384x384`.
- Se conserva la imagen principal en `1440px` para detalle del producto.

Esto reduce peso para nuevas cargas sin perder calidad visual en tarjetas.

Nota:

- Las imagenes ya existentes no cambian automaticamente.
- Aun asi, al usar `next/image`, Next puede servir versiones optimizadas de esas imagenes existentes.
- Para limpiar imagenes antiguas de forma perfecta, se necesita una migracion posterior que regenere thumbnails.

### Faltaba cache largo en imagenes de producto

Firebase Storage permite configurar `cacheControl` como metadata del objeto.

Decision aplicada:

- Las nuevas imagenes de producto se guardan con:
  - `Cache-Control: public, max-age=31536000, immutable`

Justificacion:

- Las rutas de producto incluyen un `imageId` unico.
- Si el negocio cambia una foto, se crea otro archivo.
- Por eso es seguro cachear fuerte: el archivo viejo no se pisa.

### El payload publico podia crecer demasiado

Klicor precarga secciones publicas cuando la tienda es pequena.

Antes:

- Se precargaban secciones si habia hasta 72 productos.

Riesgo:

- Una tienda con 50 productos podia entrar en modo "precargar demasiado".
- Eso no descarga todas las imagenes como bytes, pero si manda mas JSON/Flight al cliente.

Decision aplicada:

- El limite de precarga inline bajo a 36 productos visibles.
- Para tiendas medianas y grandes, se carga primero la seccion inicial y las otras secciones se piden bajo demanda.

## Estrategia recomendada

### Ahora

- Usar `next/image` en la vista publica.
- Usar thumbnails de 384px para tarjetas nuevas.
- Mantener imagen principal de 1440px para detalle.
- Cachear imagenes de producto con `immutable`.
- No precargar todas las secciones cuando la tienda ya es mediana.

### Siguiente paso

Medir con una tienda real:

- Tiempo de primera carga.
- Peso total descargado.
- Cuantas imagenes entran antes de que el usuario haga scroll.
- Si las imagenes se sirven desde `/_next/image` y no directo desde Firebase.

### Pendiente posterior

Crear una migracion controlada para productos existentes:

- Leer productos con thumbnails antiguos.
- Regenerar thumbnails de 384px.
- Guardar metadata de cache.
- Actualizar `imageThumbUrl` solo cuando el nuevo archivo exista.

No se debe hacer esa migracion a ciegas porque toca datos reales y archivos del negocio.
