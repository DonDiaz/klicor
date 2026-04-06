"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  X,
} from "lucide-react";
import { FONT_FAMILY_STYLE_MAP } from "@/app/fonts";
import { PublicFloatingActions } from "@/components/public-floating-actions";
import { apiFetch } from "@/lib/client-api";
import { buildWhatsappLink } from "@/lib/utils";
import { hexToRgba, normalizeAppearance } from "@/lib/theme-system";

function formatCurrency(value, currency = "COP") {
  if (value === null || value === undefined || value === "") return "";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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

function ProductCard({
  product,
  preview,
  currency,
  supportsCart,
  onAdd,
  onConsult,
}) {
  return (
    <article className="commerce-product-card">
      <div className="commerce-product-image-shell">
        <img
          className="commerce-product-image"
          src={product.imageThumbUrl || product.imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
        />
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
      <div className="commerce-product-actions">
        {supportsCart ? (
          <button className="btn btn-primary" type="button" onClick={() => onAdd(product)} disabled={preview}>
            <Plus size={16} /> Agregar
          </button>
        ) : (
          <button className="btn btn-secondary" type="button" onClick={() => onConsult(product)} disabled={preview}>
            <MessageCircle size={16} /> Consultar
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
  emptyLabel,
}) {
  return (
    <div className="commerce-products-section">
      <div className="commerce-products-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            preview={preview}
            currency={bootstrap.config.currency}
            supportsCart={bootstrap.supportsCart}
            onAdd={onAdd}
            onConsult={onConsult}
          />
        ))}

        {!products.length ? (
          <div className="commerce-empty-state commerce-products-empty">
            <strong>{emptyLabel}</strong>
            <p>Publica productos desde tu dashboard para verlos aquí.</p>
          </div>
        ) : null}
      </div>

      {pagination.hasMore ? (
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
  const appearance = normalizeAppearance(bootstrap.business.settings);
  const fontFamily = FONT_FAMILY_STYLE_MAP[appearance.fontFamily] || FONT_FAMILY_STYLE_MAP.inter;
  const [selection, setSelection] = useState(bootstrap.initialSelection);
  const [subcategories, setSubcategories] = useState(bootstrap.initialSubcategories || []);
  const [products, setProducts] = useState(bootstrap.initialProducts || []);
  const [pagination, setPagination] = useState(bootstrap.initialPagination || { hasMore: false, nextCursor: null });
  const [cache, setCache] = useState(() => ({
    [`${bootstrap.initialSelection.categoryId}:${bootstrap.initialSelection.subcategoryId}`]: {
      subcategories: bootstrap.initialSubcategories || [],
      products: bootstrap.initialProducts || [],
      hasMore: bootstrap.initialPagination?.hasMore || false,
      nextCursor: bootstrap.initialPagination?.nextCursor || null,
    },
  }));
  const [cartItems, setCartItems] = useState([]);
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

  const pageBackground = appearance.backgroundStyle === "gradient"
    ? `linear-gradient(180deg, ${appearance.backgroundColor}, ${hexToRgba(appearance.primaryColor, 0.08)} 62%, ${hexToRgba(appearance.secondaryColor, 0.08)})`
    : appearance.backgroundColor;

  const rootStyle = {
    fontFamily,
    background: pageBackground,
    color: appearance.textPrimaryColor,
    "--commerce-surface": appearance.surfaceColor,
    "--commerce-primary": appearance.primaryColor,
    "--commerce-secondary": appearance.secondaryColor,
    "--commerce-tertiary": appearance.tertiaryColor,
    "--commerce-text": appearance.textPrimaryColor,
    "--commerce-muted": appearance.textSecondaryColor,
  };

  function resetOpenState() {
    setSelection({ categoryId: "", subcategoryId: "" });
    setSubcategories([]);
    setProducts([]);
    setPagination({ hasMore: false, nextCursor: null });
  }

  function applyChunk(nextSelection, nextChunk, append = false) {
    const key = `${nextSelection.categoryId}:${nextSelection.subcategoryId}`;
    const nextState = {
      subcategories: nextChunk.subcategories || [],
      products: append ? [...products, ...(nextChunk.products || [])] : (nextChunk.products || []),
      hasMore: Boolean(nextChunk.hasMore),
      nextCursor: nextChunk.nextCursor || null,
    };
    setSelection(nextSelection);
    setSubcategories(nextState.subcategories);
    setProducts(nextState.products);
    setPagination({ hasMore: nextState.hasMore, nextCursor: nextState.nextCursor });
    setCache((current) => ({
      ...current,
      [key]: nextState,
    }));
  }

  function loadChunk(nextSelection, { append = false, after = null } = {}) {
    if (preview) return;
    const cacheKey = `${nextSelection.categoryId}:${nextSelection.subcategoryId}`;
    if (!append && cache[cacheKey]) {
      const cached = cache[cacheKey];
      setSelection(nextSelection);
      setSubcategories(cached.subcategories);
      setProducts(cached.products);
      setPagination({ hasMore: cached.hasMore, nextCursor: cached.nextCursor });
      return;
    }

    startTransition(async () => {
      const params = new URLSearchParams({
        mode: bootstrap.mode,
        categoryId: nextSelection.categoryId,
      });
      if (nextSelection.subcategoryId) {
        params.set("subcategoryId", nextSelection.subcategoryId);
      }
      if (after !== null && after !== undefined && after !== "") {
        params.set("after", String(after));
      }
      const response = await apiFetch(`/api/public/commerce/${bootstrap.business.username}?${params.toString()}`);
      applyChunk(nextSelection, response.data, append);
    });
  }

  function handleToggleCategory(category) {
    if (selection.categoryId === category.id) {
      resetOpenState();
      return;
    }

    loadChunk({
      categoryId: category.id,
      subcategoryId: category.hasSubcategories ? "" : "",
    });
  }

  function handleToggleSubcategory(subcategoryId) {
    if (!selection.categoryId) return;
    if (selection.subcategoryId === subcategoryId) {
      setSelection((current) => ({ ...current, subcategoryId: "" }));
      setProducts([]);
      setPagination({ hasMore: false, nextCursor: null });
      return;
    }

    loadChunk({
      categoryId: selection.categoryId,
      subcategoryId,
    });
  }

  function handleAddToCart(product) {
    setCartItems((current) => {
      const exists = current.find((item) => item.id === product.id);
      if (exists) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { id: product.id, name: product.name, price: Number(product.price || 0), quantity: 1 }];
    });
  }

  function handleCartQuantity(productId, delta) {
    setCartItems((current) => current
      .map((item) => (item.id === productId ? { ...item, quantity: Math.max(item.quantity + delta, 0) } : item))
      .filter((item) => item.quantity > 0));
  }

  function handleDirectConsult(product) {
    if (preview || !bootstrap.orderWhatsapp) return;
    const message = encodeURIComponent(`Hola, quiero información sobre ${product.name} en ${bootstrap.business.businessName}.`);
    window.open(`https://wa.me/${bootstrap.orderWhatsapp}?text=${message}`, "_blank", "noopener,noreferrer");
  }

  function handleCheckout() {
    if (preview || !bootstrap.orderWhatsapp || !cartItems.length) return;
    const message = buildOrderMessage({
      businessName: bootstrap.business.businessName,
      heading: bootstrap.modeMeta.checkoutVerb,
      items: cartItems,
      total: cartTotal,
      customer,
      currency: bootstrap.config.currency,
    });
    window.open(buildWhatsappLink(bootstrap.orderWhatsapp, message), "_blank", "noopener,noreferrer");
  }

  return (
    <main className={`commerce-page ${preview ? "is-preview" : ""}`} style={rootStyle}>
      {!preview ? (
        <div className="commerce-floating-actions">
          <PublicFloatingActions businessName={bootstrap.business.businessName} style={{ background: appearance.primaryColor, color: "#FFFFFF" }} />
        </div>
      ) : null}

      <section className="commerce-shell">
        <header className="commerce-header">
          {bootstrap.business.photo ? (
            <img className="commerce-avatar" src={bootstrap.business.photo} alt={bootstrap.business.businessName} />
          ) : (
            <div className="commerce-avatar commerce-avatar-fallback">{bootstrap.business.businessName?.slice(0, 1) || "K"}</div>
          )}
          <span className="commerce-mode-badge">{bootstrap.modeMeta.label}</span>
          <h1>{bootstrap.business.businessName}</h1>
          <p className="commerce-headline">
            {bootstrap.business.businessHeadline || bootstrap.modeMeta.publicHeadlineFallback}
          </p>
          {bootstrap.business.businessSubheadline ? <p className="commerce-subheadline">{bootstrap.business.businessSubheadline}</p> : null}
        </header>

        <section className="commerce-accordion-list">
          {bootstrap.categories.map((category) => {
            const isCategoryOpen = selection.categoryId === category.id;
            const showDirectProducts = isCategoryOpen && !category.hasSubcategories;

            return (
              <article key={category.id} className={`commerce-accordion-card ${isCategoryOpen ? "is-open" : ""}`.trim()}>
                <button className="commerce-accordion-trigger" type="button" onClick={() => handleToggleCategory(category)}>
                  <span className="commerce-accordion-trigger-copy">
                    <strong>{category.name}</strong>
                    <small>
                      {category.hasSubcategories
                        ? formatCount(category.subcategoryCount, "subcategorías")
                        : formatCount(category.productCount, "productos")}
                    </small>
                  </span>
                  <ChevronDown className={`commerce-accordion-chevron ${isCategoryOpen ? "is-open" : ""}`.trim()} size={18} />
                </button>

                {isCategoryOpen ? (
                  <div className="commerce-accordion-body">
                    {category.hasSubcategories ? (
                      <>
                        <div className="commerce-subaccordion-list">
                          {subcategories.map((subcategory) => {
                            const isSubcategoryOpen = selection.subcategoryId === subcategory.id;

                            return (
                              <article key={subcategory.id} className={`commerce-subaccordion-card ${isSubcategoryOpen ? "is-open" : ""}`.trim()}>
                                <button className="commerce-subaccordion-trigger" type="button" onClick={() => handleToggleSubcategory(subcategory.id)}>
                                  <span className="commerce-accordion-trigger-copy">
                                    <strong>{subcategory.name}</strong>
                                    <small>{formatCount(subcategory.productCount, "productos")}</small>
                                  </span>
                                  <ChevronDown className={`commerce-accordion-chevron ${isSubcategoryOpen ? "is-open" : ""}`.trim()} size={18} />
                                </button>

                                {isSubcategoryOpen ? (
                                  <div className="commerce-subaccordion-body">
                                    <ProductsGrid
                                      bootstrap={bootstrap}
                                      preview={preview}
                                      products={products}
                                      pagination={pagination}
                                      isPending={isPending}
                                      onAdd={handleAddToCart}
                                      onConsult={handleDirectConsult}
                                      onLoadMore={() => loadChunk(selection, { append: true, after: pagination.nextCursor })}
                                      emptyLabel={bootstrap.modeMeta.emptyLabel}
                                    />
                                  </div>
                                ) : null}
                              </article>
                            );
                          })}
                        </div>

                        {!selection.subcategoryId ? (
                          <div className="commerce-empty-state commerce-subcategory-empty">
                            <strong>Selecciona una subcategoría</strong>
                            <p>Abre una subcategoría para ver sus productos.</p>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <ProductsGrid
                        bootstrap={bootstrap}
                        preview={preview}
                        products={showDirectProducts ? products : []}
                        pagination={showDirectProducts ? pagination : { hasMore: false, nextCursor: null }}
                        isPending={isPending}
                        onAdd={handleAddToCart}
                        onConsult={handleDirectConsult}
                        onLoadMore={() => loadChunk(selection, { append: true, after: pagination.nextCursor })}
                        emptyLabel={bootstrap.modeMeta.emptyLabel}
                      />
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      </section>

      {bootstrap.supportsCart && cartCount > 0 ? (
        <button className="commerce-cart-fab" type="button" onClick={() => setCartOpen(true)} disabled={preview}>
          <ShoppingCart size={18} />
          <span>{cartCount}</span>
          <strong>{formatCurrency(cartTotal, bootstrap.config.currency)}</strong>
        </button>
      ) : null}

      {cartOpen && bootstrap.supportsCart ? (
        <div className="commerce-modal-backdrop" role="dialog" aria-modal="true" aria-label={bootstrap.modeMeta.cartLabel}>
          <div className="commerce-modal-card">
            <button className="commerce-modal-close" type="button" onClick={() => { setCartOpen(false); setCheckoutStep("cart"); }}>
              <X size={18} />
            </button>

            {checkoutStep === "cart" ? (
              <>
                <div className="commerce-modal-head">
                  <strong>{bootstrap.modeMeta.cartLabel}</strong>
                  <span>{cartCount} productos</span>
                </div>
                <div className="commerce-cart-list">
                  {cartItems.map((item) => (
                    <article className="commerce-cart-row" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>{formatCurrency(item.price, bootstrap.config.currency)}</span>
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
                <div className="commerce-cart-total">
                  <span>Total</span>
                  <strong>{formatCurrency(cartTotal, bootstrap.config.currency)}</strong>
                </div>
                <button className="btn btn-primary" type="button" onClick={() => setCheckoutStep("details")}>
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
                  <button className="btn btn-primary" type="button" onClick={handleCheckout} disabled={!customer.customerName || !customer.address || !customer.phone || !bootstrap.orderWhatsapp}>
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
