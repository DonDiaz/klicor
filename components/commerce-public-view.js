"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ChevronRight,
  LoaderCircle,
  MessageCircle,
  Minus,
  Plus,
  Share2,
  ShoppingBag,
  ShoppingCart,
  X,
} from "lucide-react";
import { FONT_FAMILY_STYLE_MAP } from "@/app/fonts";
import { apiFetch } from "@/lib/client-api";
import { resolveCommerceModeMeta } from "@/lib/commerce-config";
import { buildWhatsappLink } from "@/lib/utils";
import { hexToRgba, normalizeAppearance } from "@/lib/theme-system";

function formatCurrency(value, currency = "COP") {
  if (value === null || value === undefined || value === "") return "";
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }
}

function buildOrderMessage({ businessName, items, total, customer, heading, currency }) {
  const lines = [`${heading} para ${businessName}`, "Productos:", ""];

  items.forEach((item) => {
    lines.push(`${item.quantity} x ${item.name} = ${formatCurrency(item.price * item.quantity, currency)}`);
  });

  lines.push("");
  lines.push(`Total: ${formatCurrency(total, currency)}`);
  lines.push("");
  lines.push("Cliente:");
  lines.push(`Nombre: ${customer.customerName}`);
  lines.push(`Dirección: ${customer.address}`);
  lines.push(`Teléfono: ${customer.phone}`);
  lines.push(`Observaciones: ${customer.notes || "Sin observaciones"}`);
  return lines.join("\n");
}

function normalizePagination(value) {
  return {
    hasMore: Boolean(value?.hasMore),
    nextCursor: value?.nextCursor ?? null,
  };
}

function normalizePublicProducts(value = []) {
  return Array.isArray(value)
    ? value
      .filter(Boolean)
      .map((product, index) => ({
        ...product,
        id: String(product.id || `product-${index}`),
        name: String(product.name || "Producto"),
        description: String(product.description || ""),
        imageUrl: String(product.imageUrl || ""),
        imageThumbUrl: String(product.imageThumbUrl || product.imageUrl || ""),
        price: product.price === null || product.price === undefined || product.price === "" ? null : Number(product.price || 0),
      }))
    : [];
}

function normalizePublicSubcategories(value = []) {
  return Array.isArray(value)
    ? value
      .filter(Boolean)
      .map((subcategory, index) => ({
        ...subcategory,
        id: String(subcategory.id || `subcategory-${index}`),
        name: String(subcategory.name || "Subcategoría"),
        productCount: Number(subcategory.productCount || 0) || 0,
      }))
    : [];
}

function normalizePublicCategories(value = []) {
  return Array.isArray(value)
    ? value
      .filter(Boolean)
      .map((category, index) => ({
        ...category,
        id: String(category.id || `category-${index}`),
        name: String(category.name || "Categoría"),
        hasSubcategories: Boolean(category.hasSubcategories),
        subcategoryCount: Number(category.subcategoryCount || 0) || 0,
        productCount: Number(category.productCount || 0) || 0,
      }))
    : [];
}

function ProductCard({
  product,
  preview,
  currency,
  supportsCart,
  quantity,
  onAdd,
  onConsult,
  onQuantityStep,
}) {
  return (
    <article className="commerce-product-card">
      <div className="commerce-product-main">
        <div className="commerce-product-image-shell">
          {product.imageThumbUrl || product.imageUrl ? (
            <img
              className="commerce-product-image"
              src={product.imageThumbUrl || product.imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span>{product.name.slice(0, 1)}</span>
          )}
        </div>
        <div className="commerce-product-copy">
          <div className="commerce-product-head">
            <strong>{product.name}</strong>
            {product.price !== null && product.price !== undefined ? (
              <span>{formatCurrency(product.price, currency)}</span>
            ) : null}
          </div>
          {product.description ? <p>{product.description}</p> : null}
        </div>
      </div>

      <div className="commerce-product-actions">
        {supportsCart ? (
          <>
            <div className="commerce-quantity-stepper" aria-label={`Cantidad de ${product.name}`}>
              <button type="button" onClick={() => onQuantityStep(product.id, -1)} disabled={preview || quantity <= 1} aria-label="Reducir cantidad">
                <Minus size={16} />
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => onQuantityStep(product.id, 1)} disabled={preview} aria-label="Aumentar cantidad">
                <Plus size={16} />
              </button>
            </div>
            <button className="commerce-product-add-button" type="button" onClick={() => onAdd(product)} disabled={preview}>
              Agregar <Plus size={16} />
            </button>
          </>
        ) : (
          <button className="commerce-product-add-button is-consult" type="button" onClick={() => onConsult(product)} disabled={preview}>
            Consultar <MessageCircle size={16} />
          </button>
        )}
      </div>
    </article>
  );
}

function ProductsGrid({
  bootstrap,
  preview,
  products,
  pagination,
  isPending,
  onAdd,
  onConsult,
  onLoadMore,
  getQuantity,
  onQuantityStep,
  emptyLabel,
}) {
  const currency = bootstrap?.config?.currency || "COP";
  const supportsCart = Boolean(bootstrap?.supportsCart);
  const safeProducts = normalizePublicProducts(products);
  const safePagination = normalizePagination(pagination);
  return (
    <div className="commerce-products-section">
      <div className="commerce-products-grid">
        {safeProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            preview={preview}
            currency={currency}
            supportsCart={supportsCart}
            quantity={getQuantity(product.id)}
            onAdd={onAdd}
            onConsult={onConsult}
            onQuantityStep={onQuantityStep}
          />
        ))}

        {!safeProducts.length ? (
          <div className="commerce-empty-state commerce-products-empty">
            <strong>{emptyLabel}</strong>
            <p>Publica productos desde tu dashboard para verlos aquí.</p>
          </div>
        ) : null}
      </div>

      {safePagination.hasMore ? (
        <button
          className="btn btn-secondary commerce-load-more"
          type="button"
          onClick={onLoadMore}
          disabled={preview || isPending}
        >
          {isPending ? <LoaderCircle size={16} className="spin" /> : <ChevronRight size={16} />}
          Cargar más
        </button>
      ) : null}
    </div>
  );
}

export function CommercePublicView({ bootstrap, preview = false }) {
  const safeBootstrap = bootstrap && typeof bootstrap === "object" ? bootstrap : {};
  const safeBusiness = {
    businessName: safeBootstrap.business?.businessName || "Tu negocio",
    photo: safeBootstrap.business?.photo || "",
    settings: safeBootstrap.business?.settings || {},
    username: safeBootstrap.business?.username || "",
  };
  const safeConfig = {
    currency: safeBootstrap.config?.currency || "COP",
  };
  const safeMode = safeBootstrap.mode || safeBootstrap.config?.activeMode || "";
  const safeModeMeta = safeBootstrap.modeMeta || resolveCommerceModeMeta(safeMode);
  const safeInitialSelection = {
    categoryId: String(safeBootstrap.initialSelection?.categoryId || ""),
    subcategoryId: String(safeBootstrap.initialSelection?.subcategoryId || ""),
  };
  const safeInitialPagination = normalizePagination(safeBootstrap.initialPagination);
  const categories = normalizePublicCategories(safeBootstrap.categories);
  const initialSubcategories = normalizePublicSubcategories(safeBootstrap.initialSubcategories);
  const initialProducts = normalizePublicProducts(safeBootstrap.initialProducts);
  const appearance = normalizeAppearance(safeBusiness.settings);
  const fontFamily = FONT_FAMILY_STYLE_MAP[appearance.fontFamily] || FONT_FAMILY_STYLE_MAP.inter;
  const [selection, setSelection] = useState(safeInitialSelection);
  const [subcategories, setSubcategories] = useState(initialSubcategories);
  const [products, setProducts] = useState(initialProducts);
  const [pagination, setPagination] = useState(safeInitialPagination);
  const [cache, setCache] = useState(() => ({
    [`${safeInitialSelection.categoryId}:${safeInitialSelection.subcategoryId}`]: {
      selection: safeInitialSelection,
      subcategories: initialSubcategories,
      products: initialProducts,
      hasMore: safeInitialPagination.hasMore,
      nextCursor: safeInitialPagination.nextCursor,
    },
  }));
  const [cartItems, setCartItems] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("cart");
  const [customer, setCustomer] = useState({
    customerName: "",
    address: "",
    phone: "",
    notes: "",
  });
  const [isPending, startTransition] = useTransition();

  const cartTotal = useMemo(
    () => cartItems.reduce((accumulator, item) => accumulator + (Number(item.price || 0) * item.quantity), 0),
    [cartItems],
  );

  const cartCount = useMemo(
    () => cartItems.reduce((accumulator, item) => accumulator + item.quantity, 0),
    [cartItems],
  );
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selection.categoryId) || null,
    [categories, selection.categoryId],
  );
  const shouldShowProducts = !selectedCategory?.hasSubcategories || Boolean(selection.subcategoryId);

  const pageBackground = appearance.backgroundStyle === "gradient"
    ? `linear-gradient(180deg, ${appearance.backgroundColor} 0%, ${hexToRgba(appearance.tertiaryColor, 0.72)} 58%, ${hexToRgba(appearance.secondaryColor, 0.28)} 100%)`
    : appearance.backgroundColor;

  const rootStyle = {
    fontFamily,
    background: pageBackground,
    color: appearance.textPrimaryColor,
    "--commerce-background": pageBackground,
    "--commerce-surface": appearance.surfaceColor,
    "--commerce-surface-soft": hexToRgba(appearance.surfaceColor, 0.92),
    "--commerce-surface-strong": hexToRgba(appearance.surfaceColor, 0.96),
    "--commerce-primary": appearance.primaryColor,
    "--commerce-primary-strong": appearance.primaryColor,
    "--commerce-primary-soft": hexToRgba(appearance.primaryColor, 0.12),
    "--commerce-primary-border": hexToRgba(appearance.primaryColor, 0.16),
    "--commerce-primary-shadow": hexToRgba(appearance.primaryColor, 0.24),
    "--commerce-secondary": appearance.secondaryColor,
    "--commerce-tertiary": appearance.tertiaryColor,
    "--commerce-text": appearance.textPrimaryColor,
    "--commerce-muted": appearance.textSecondaryColor,
    "--commerce-line": hexToRgba(appearance.textPrimaryColor, 0.1),
    "--commerce-shadow": hexToRgba(appearance.textPrimaryColor, 0.08),
    "--commerce-button-text": appearance.buttonTextColor,
  };

  function applyChunk(nextSelection, nextChunk, append = false) {
    const resolvedSelection = {
      categoryId: String(nextChunk?.categoryId || nextSelection.categoryId || ""),
      subcategoryId: String(nextChunk?.subcategoryId ?? nextSelection.subcategoryId ?? ""),
    };
    const key = `${resolvedSelection.categoryId}:${resolvedSelection.subcategoryId}`;
    const requestKey = `${nextSelection.categoryId}:${nextSelection.subcategoryId}`;
    const nextProducts = normalizePublicProducts(nextChunk?.products);
    const nextSubcategories = normalizePublicSubcategories(nextChunk?.subcategories);
    const nextPagination = normalizePagination(nextChunk);
    const nextState = {
      selection: resolvedSelection,
      subcategories: nextSubcategories,
      products: append ? [...normalizePublicProducts(products), ...nextProducts] : nextProducts,
      hasMore: nextPagination.hasMore,
      nextCursor: nextPagination.nextCursor,
    };
    setSelection(resolvedSelection);
    setSubcategories(nextState.subcategories);
    setProducts(nextState.products);
    setPagination({ hasMore: nextState.hasMore, nextCursor: nextState.nextCursor });
    setCache((current) => ({
      ...current,
      [key]: nextState,
      [requestKey]: nextState,
    }));
  }

  function loadChunk(nextSelection, { append = false, after = null } = {}) {
    if (preview) return;
    const cacheKey = `${nextSelection.categoryId}:${nextSelection.subcategoryId}`;
    if (!append && cache[cacheKey]) {
      const cached = cache[cacheKey];
      setSelection(cached.selection || nextSelection);
      setSubcategories(cached.subcategories);
      setProducts(cached.products);
      setPagination({ hasMore: cached.hasMore, nextCursor: cached.nextCursor });
      return;
    }

    startTransition(async () => {
      const params = new URLSearchParams({
        mode: safeMode,
        categoryId: nextSelection.categoryId,
      });
      if (nextSelection.subcategoryId) {
        params.set("subcategoryId", nextSelection.subcategoryId);
      }
      if (after !== null && after !== undefined && after !== "") {
        params.set("after", String(after));
      }
      const response = await apiFetch(`/api/public/commerce/${safeBusiness.username}?${params.toString()}`);
      applyChunk(nextSelection, response?.data || {}, append);
    });
  }

  function handleSelectCategory(category) {
    if (selection.categoryId === category.id) return;
    loadChunk({
      categoryId: category.id,
      subcategoryId: category.hasSubcategories ? "" : "",
    });
  }

  function handleSelectSubcategory(subcategoryId) {
    if (!selection.categoryId) return;
    if (selection.subcategoryId === subcategoryId) return;

    loadChunk({
      categoryId: selection.categoryId,
      subcategoryId,
    });
  }

  function getProductQuantity(productId) {
    return Math.max(1, Number(productQuantities[productId] || 1));
  }

  function handleProductQuantityStep(productId, delta) {
    setProductQuantities((current) => ({
      ...current,
      [productId]: Math.max(1, Number(current[productId] || 1) + delta),
    }));
  }

  function handleAddToCart(product) {
    const quantity = getProductQuantity(product.id);
    setCartItems((current) => {
      const exists = current.find((item) => item.id === product.id);
      if (exists) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item));
      }
      return [...current, { id: product.id, name: product.name, price: Number(product.price || 0), quantity }];
    });
  }

  function handleCartQuantity(productId, delta) {
    setCartItems((current) => current
      .map((item) => (item.id === productId ? { ...item, quantity: Math.max(item.quantity + delta, 0) } : item))
      .filter((item) => item.quantity > 0));
  }

  function handleDirectConsult(product) {
    if (preview || !safeBootstrap.orderWhatsapp) return;
    const message = encodeURIComponent(`Hola, quiero información sobre ${product.name} en ${safeBusiness.businessName}.`);
    window.open(`https://wa.me/${safeBootstrap.orderWhatsapp}?text=${message}`, "_blank", "noopener,noreferrer");
  }

  async function handleShare() {
    if (preview || typeof window === "undefined") return;
    const payload = {
      title: safeBusiness.businessName,
      text: `Mira ${safeBusiness.businessName} en Klicor.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard?.writeText(window.location.href);
    } catch {
      // El usuario puede cancelar el diálogo nativo de compartir.
    }
  }

  function handleCheckout() {
    if (preview || !safeBootstrap.orderWhatsapp || !cartItems.length) return;
    const message = buildOrderMessage({
      businessName: safeBusiness.businessName,
      heading: safeModeMeta.checkoutVerb,
      items: cartItems,
      total: cartTotal,
      customer,
      currency: safeConfig.currency,
    });
    window.open(buildWhatsappLink(safeBootstrap.orderWhatsapp, message), "_blank", "noopener,noreferrer");
  }

  return (
    <main className={`commerce-page ${preview ? "is-preview" : ""}`} style={rootStyle}>
      <section className="commerce-shell">
        <header className="commerce-header">
          <div className="commerce-brand-lockup">
            {safeBusiness.photo ? (
              <img className="commerce-avatar" src={safeBusiness.photo} alt={safeBusiness.businessName} />
            ) : (
              <div className="commerce-avatar commerce-avatar-fallback">{safeBusiness.businessName?.slice(0, 1) || "K"}</div>
            )}
            <h1>{safeBusiness.businessName}</h1>
          </div>
          {!preview ? (
            <button className="commerce-share-button" type="button" onClick={handleShare} aria-label="Compartir">
              <Share2 size={18} />
            </button>
          ) : null}
        </header>

        <div className="commerce-shop-layout">
          <aside className="commerce-navigation-panel" aria-label="Navegación de productos">
            <div className="commerce-category-rail" aria-label="Categorías">
              {categories.map((category) => {
                const isActive = selection.categoryId === category.id;
                return (
                  <button
                    key={category.id}
                    className={`commerce-category-chip ${isActive ? "is-active" : ""}`.trim()}
                    type="button"
                    onClick={() => handleSelectCategory(category)}
                  >
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>

            {selection.categoryId && subcategories.length ? (
              <div className="commerce-subcategory-rail" aria-label="Subcategorías">
                {subcategories.map((subcategory) => {
                  const isActive = selection.subcategoryId === subcategory.id;
                  return (
                    <button
                      key={subcategory.id}
                      className={`commerce-subcategory-chip ${isActive ? "is-active" : ""}`.trim()}
                      type="button"
                      onClick={() => handleSelectSubcategory(subcategory.id)}
                    >
                      <span>{subcategory.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </aside>

          <section className="commerce-menu-board">
            {shouldShowProducts ? (
              <ProductsGrid
                bootstrap={safeBootstrap}
                preview={preview}
                products={products}
                pagination={pagination}
                isPending={isPending}
                onAdd={handleAddToCart}
                onConsult={handleDirectConsult}
                onLoadMore={() => loadChunk(selection, { append: true, after: pagination.nextCursor })}
                getQuantity={getProductQuantity}
                onQuantityStep={handleProductQuantityStep}
                emptyLabel={safeModeMeta.emptyLabel}
              />
            ) : (
              <div className="commerce-empty-state commerce-subcategory-empty">
                <strong>Selecciona una subcategoría</strong>
                <p>Elige una opción para ver sus productos.</p>
              </div>
            )}
          </section>

          {safeBootstrap.supportsCart ? (
            <aside className="commerce-cart-panel" aria-label="Resumen del pedido">
              <div className="commerce-cart-panel-head">
                <strong>Pedido</strong>
                <span>{cartCount} productos</span>
              </div>
              {cartItems.length ? (
                <div className="commerce-cart-panel-list">
                  {cartItems.map((item) => (
                    <article className="commerce-cart-panel-row" key={item.id}>
                      <span>{item.quantity} x {item.name}</span>
                      <strong>{formatCurrency(item.price * item.quantity, safeConfig.currency)}</strong>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="commerce-cart-panel-empty">Agrega productos para armar tu pedido.</p>
              )}
              <div className="commerce-cart-panel-total">
                <span>Total</span>
                <strong>{formatCurrency(cartTotal, safeConfig.currency)}</strong>
              </div>
              <button className="commerce-cart-panel-button" type="button" onClick={() => setCartOpen(true)} disabled={preview}>
                Ver pedido ({cartCount})
              </button>
            </aside>
          ) : null}
        </div>
      </section>

      {safeBootstrap.supportsCart ? (
        <button className="commerce-order-bar" type="button" onClick={() => setCartOpen(true)} disabled={preview}>
          <ShoppingCart size={20} />
          <span>Ver pedido ({cartCount}) - {formatCurrency(cartTotal, safeConfig.currency)}</span>
          <ChevronRight size={20} />
        </button>
      ) : null}

      {cartOpen && safeBootstrap.supportsCart ? (
        <div className="commerce-modal-backdrop" role="dialog" aria-modal="true" aria-label={safeModeMeta.cartLabel}>
          <div className="commerce-modal-card">
            <button className="commerce-modal-close" type="button" onClick={() => { setCartOpen(false); setCheckoutStep("cart"); }}>
              <X size={18} />
            </button>

            {checkoutStep === "cart" ? (
              <>
                <div className="commerce-modal-head">
                  <strong>{safeModeMeta.cartLabel}</strong>
                  <span>{cartCount} productos</span>
                </div>
                {cartItems.length ? (
                  <div className="commerce-cart-list">
                    {cartItems.map((item) => (
                      <article className="commerce-cart-row" key={item.id}>
                        <div>
                          <strong>{item.name}</strong>
                          <span>{formatCurrency(item.price * item.quantity, safeConfig.currency)}</span>
                        </div>
                        <div className="commerce-cart-qty">
                          <button type="button" onClick={() => handleCartQuantity(item.id, -1)}>
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => handleCartQuantity(item.id, 1)}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="commerce-empty-state commerce-cart-empty">
                    <strong>Tu pedido está vacío</strong>
                    <p>Agrega productos para ver el total y enviarlo por WhatsApp.</p>
                  </div>
                )}
                <div className="commerce-cart-total">
                  <span>Total</span>
                  <strong>{formatCurrency(cartTotal, safeConfig.currency)}</strong>
                </div>
                <button className="btn btn-primary" type="button" onClick={() => setCheckoutStep("details")} disabled={!cartItems.length}>
                  Continuar pedido
                </button>
              </>
            ) : (
              <>
                <div className="commerce-modal-head">
                  <strong>Datos del pedido</strong>
                  <span>Completamos el mensaje para WhatsApp</span>
                </div>
                <div className="section-stack">
                  <input className="input" placeholder="Nombre" value={customer.customerName} onChange={(event) => setCustomer((current) => ({ ...current, customerName: event.target.value }))} />
                  <input className="input" placeholder="Dirección" value={customer.address} onChange={(event) => setCustomer((current) => ({ ...current, address: event.target.value }))} />
                  <input className="input" placeholder="Teléfono" value={customer.phone} onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))} />
                  <textarea className="textarea" placeholder="Observaciones" rows={3} value={customer.notes} onChange={(event) => setCustomer((current) => ({ ...current, notes: event.target.value }))} />
                </div>
                <div className="commerce-modal-actions">
                  <button className="btn btn-secondary" type="button" onClick={() => setCheckoutStep("cart")}>
                    Volver
                  </button>
                  <button className="btn btn-primary" type="button" onClick={handleCheckout} disabled={!customer.customerName || !customer.address || !customer.phone || !safeBootstrap.orderWhatsapp}>
                    <ShoppingBag size={16} /> Enviar a WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
