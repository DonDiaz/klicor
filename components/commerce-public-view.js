"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MessageCircle,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Trash2,
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

function formatCashAmount(value, currency = "COP") {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return "";
  if (/^[\d\s.,$]+$/.test(cleanValue)) {
    const digits = cleanValue.replace(/\D/g, "");
    if (digits) return formatCurrency(Number(digits), currency);
  }
  return cleanValue;
}

function buildOrderMessage({ items, total, note, customer, payment, currency }) {
  const cleanCustomer = {
    name: String(customer?.customerName || "").trim(),
    phone: String(customer?.phone || "").trim(),
    address: String(customer?.address || "").trim(),
  };
  const cleanPayment = {
    method: payment?.method === "transfer" ? "transfer" : "cash",
    cashAmount: String(payment?.cashAmount || "").trim(),
  };
  const lines = ["Hola, quiero hacer el siguiente pedido:", "", "Pedido:"];

  items.forEach((item) => {
    lines.push(`- ${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity, currency)}`);
  });

  lines.push("");
  lines.push(`Total: ${formatCurrency(total, currency)}`);
  lines.push("");
  lines.push("Datos del cliente:");
  lines.push(`Nombre: ${cleanCustomer.name}`);
  lines.push(`Teléfono: ${cleanCustomer.phone}`);
  lines.push(`Dirección: ${cleanCustomer.address}`);
  lines.push("");
  lines.push("Forma de pago:");

  if (cleanPayment.method === "transfer") {
    lines.push("Transferencia. Por favor envíame el link de Klicor con los medios de pago.");
  } else {
    lines.push("Efectivo");
    lines.push(`Pago con: ${formatCashAmount(cleanPayment.cashAmount, currency)}`);
  }

  const cleanNote = String(note || "").trim();
  if (cleanNote) {
    lines.push("");
    lines.push("Nota:");
    lines.push(cleanNote);
  }

  lines.push("");
  lines.push("Quedo atento.");
  return lines.join("\n");
}

function normalizePagination(value) {
  return {
    hasMore: Boolean(value?.hasMore),
    nextCursor: value?.nextCursor ?? null,
  };
}

function normalizePublicProductImages(value = [], fallback = {}) {
  const items = Array.isArray(value)
    ? value
      .filter(Boolean)
      .map((image, index) => ({
        id: String(image.id || `image-${index + 1}`),
        imageUrl: String(image.imageUrl || "").trim(),
        imageThumbUrl: String(image.imageThumbUrl || image.imageUrl || "").trim(),
        imageWidth: Number(image.imageWidth || 0) || 0,
        imageHeight: Number(image.imageHeight || 0) || 0,
      }))
      .filter((image) => image.imageUrl || image.imageThumbUrl)
    : [];

  if (items.length) return items;

  const fallbackImageUrl = String(fallback.imageUrl || "").trim();
  const fallbackThumbUrl = String(fallback.imageThumbUrl || fallback.imageUrl || "").trim();
  if (!fallbackImageUrl && !fallbackThumbUrl) return [];

  return [{
    id: "image-1",
    imageUrl: fallbackImageUrl,
    imageThumbUrl: fallbackThumbUrl,
    imageWidth: Number(fallback.imageWidth || 0) || 0,
    imageHeight: Number(fallback.imageHeight || 0) || 0,
  }];
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
        images: normalizePublicProductImages(product.images, product),
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
        iconKey: String(subcategory.iconKey || "tag"),
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
        iconKey: String(category.iconKey || "tag"),
        imageUrl: String(category.imageUrl || category.previewImage?.imageUrl || ""),
        imageThumbUrl: String(category.imageThumbUrl || category.previewImage?.imageThumbUrl || category.previewImage?.imageUrl || category.imageUrl || ""),
        hasSubcategories: Boolean(category.hasSubcategories),
        firstSubcategoryId: String(category.firstSubcategoryId || ""),
        subcategoryCount: Number(category.subcategoryCount || 0) || 0,
        productCount: Number(category.productCount || 0) || 0,
      }))
    : [];
}

function normalizePrefetchedSections(value = []) {
  return Array.isArray(value)
    ? value
      .filter(Boolean)
      .map((section, index) => ({
        key: String(section.key || `section-${index}`),
        selection: {
          categoryId: String(section.categoryId || ""),
          subcategoryId: String(section.subcategoryId || ""),
        },
        subcategories: normalizePublicSubcategories(section.subcategories),
        products: normalizePublicProducts(section.products),
        hasMore: Boolean(section.hasMore),
        nextCursor: section.nextCursor ?? null,
      }))
      .filter((section) => section.selection.categoryId)
    : [];
}

function ProductCard({
  product,
  preview,
  currency,
  supportsCart,
  onAdd,
  onOpenDetails,
}) {
  return (
    <article className={`commerce-product-card commerce-visual-product-card ${supportsCart ? "supports-cart" : "is-catalog-card"}`.trim()}>
      <button className="commerce-product-main" type="button" onClick={() => onOpenDetails(product)} disabled={preview}>
        <div className="commerce-product-image-shell" aria-hidden="true">
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
          <strong>{product.name}</strong>
          {product.price !== null && product.price !== undefined ? (
            <span>{formatCurrency(product.price, currency)}</span>
          ) : null}
        </div>
      </button>

      {supportsCart ? (
        <button className="commerce-product-add-button" type="button" onClick={() => onAdd(product, 1)} disabled={preview}>
          Agregar <Plus size={16} />
        </button>
      ) : null}
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
  onOpenDetails,
  onLoadMore,
  emptyLabel,
}) {
  const currency = bootstrap?.config?.currency || "COP";
  const supportsCart = Boolean(bootstrap?.supportsCart);
  const safeProducts = normalizePublicProducts(products);
  const safePagination = normalizePagination(pagination);
  return (
    <div className="commerce-products-section">
      <div className={`commerce-products-grid ${supportsCart ? "is-cart-grid" : "is-catalog-grid"}`.trim()}>
        {safeProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            preview={preview}
            currency={currency}
            supportsCart={supportsCart}
            onAdd={onAdd}
            onOpenDetails={onOpenDetails}
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

function ProductsLoading() {
  return (
    <div className="commerce-products-section" aria-live="polite" aria-busy="true">
      <div className="commerce-products-grid">
        {[0, 1, 2].map((item) => (
          <article className="commerce-product-card commerce-product-skeleton" key={item}>
            <div className="commerce-product-main">
              <span className="commerce-skeleton-thumb" />
              <div className="commerce-skeleton-copy">
                <span />
                <span />
              </div>
            </div>
            <div className="commerce-product-actions">
              <span className="commerce-skeleton-action" />
              <span className="commerce-skeleton-action" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function CommercePublicView({ bootstrap, preview = false }) {
  const safeBootstrap = bootstrap && typeof bootstrap === "object" ? bootstrap : {};
  const safeBusiness = {
    businessName: safeBootstrap.business?.businessName || "Tu negocio",
    photo: safeBootstrap.business?.photo || "",
    photoThumb: safeBootstrap.business?.photoThumb || safeBootstrap.business?.photo || "",
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
  const prefetchedSections = normalizePrefetchedSections(safeBootstrap.prefetchedSections);
  const appearance = normalizeAppearance(safeBusiness.settings);
  const fontFamily = FONT_FAMILY_STYLE_MAP[appearance.fontFamily] || FONT_FAMILY_STYLE_MAP.inter;
  const [selection, setSelection] = useState(safeInitialSelection);
  const [subcategories, setSubcategories] = useState(initialSubcategories);
  const [products, setProducts] = useState(initialProducts);
  const [pagination, setPagination] = useState(safeInitialPagination);
  const [cache, setCache] = useState(() => {
    const nextCache = {};

    prefetchedSections.forEach((section) => {
      nextCache[section.key] = {
        selection: section.selection,
        subcategories: section.subcategories,
        products: section.products,
        hasMore: section.hasMore,
        nextCursor: section.nextCursor,
      };
    });

    nextCache[`${safeInitialSelection.categoryId}:${safeInitialSelection.subcategoryId}`] = {
      selection: safeInitialSelection,
      subcategories: initialSubcategories,
      products: initialProducts,
      hasMore: safeInitialPagination.hasMore,
      nextCursor: safeInitialPagination.nextCursor,
    };

    return nextCache;
  });
  const [cartItems, setCartItems] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [customer, setCustomer] = useState({
    customerName: "",
    phone: "",
    address: "",
  });
  const [payment, setPayment] = useState({
    method: "cash",
    cashAmount: "",
  });
  const [detailProduct, setDetailProduct] = useState(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [pendingSelection, setPendingSelection] = useState(null);
  const requestCounterRef = useRef(0);
  const prefetchedKeysRef = useRef(new Set());
  const [isPending, startTransition] = useTransition();

  const cartTotal = useMemo(
    () => cartItems.reduce((accumulator, item) => accumulator + (Number(item.price || 0) * item.quantity), 0),
    [cartItems],
  );

  const cartCount = useMemo(
    () => cartItems.reduce((accumulator, item) => accumulator + item.quantity, 0),
    [cartItems],
  );
  const canSendOrder = Boolean(
    cartItems.length
    && safeBootstrap.orderWhatsapp
    && String(customer.customerName || "").trim()
    && String(customer.phone || "").trim()
    && String(customer.address || "").trim()
    && (payment.method === "transfer" || String(payment.cashAmount || "").trim()),
  );
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selection.categoryId) || null,
    [categories, selection.categoryId],
  );
  const shouldShowProducts = !selectedCategory?.hasSubcategories || Boolean(selection.subcategoryId);
  const isSectionLoading = Boolean(pendingSelection);
  const detailImages = normalizePublicProductImages(detailProduct?.images, detailProduct || {});
  const activeDetailImage = detailImages[detailImageIndex] || detailImages[0] || null;
  const coverImage = safeBusiness.photo || safeBusiness.photoThumb || "";

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
  const headerStyle = coverImage
    ? {
      backgroundImage: `linear-gradient(180deg, ${hexToRgba(appearance.textPrimaryColor, 0.08)}, ${hexToRgba(appearance.textPrimaryColor, 0.72)}), url("${coverImage}")`,
    }
    : {
      backgroundImage: `linear-gradient(135deg, ${appearance.primaryColor}, ${appearance.secondaryColor})`,
    };

  function applyChunk(nextSelection, nextChunk, append = false) {
    const resolvedSelection = {
      categoryId: String(nextChunk?.categoryId || nextSelection.categoryId || ""),
      subcategoryId: String(nextChunk?.subcategoryId ?? nextSelection.subcategoryId ?? ""),
    };
    const key = `${resolvedSelection.categoryId}:${resolvedSelection.subcategoryId}`;
    const requestKey = `${nextSelection.categoryId}:${nextSelection.subcategoryId}`;
    const nextProducts = normalizePublicProducts(nextChunk?.products);
    const hasSubcategoryPayload = Array.isArray(nextChunk?.subcategories);
    const nextSubcategories = hasSubcategoryPayload ? normalizePublicSubcategories(nextChunk?.subcategories) : subcategories;
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
    if (!append) setPendingSelection(null);
    setCache((current) => ({
      ...current,
      [key]: nextState,
      [requestKey]: nextState,
    }));
  }

  function loadChunk(nextSelection, { append = false, after = null, includeSubcategories = true } = {}) {
    if (preview) return;
    const cacheKey = `${nextSelection.categoryId}:${nextSelection.subcategoryId}`;
    const requestId = requestCounterRef.current + 1;
    requestCounterRef.current = requestId;

    if (!append && cache[cacheKey]) {
      const cached = cache[cacheKey];
      setPendingSelection(null);
      setSelection(cached.selection || nextSelection);
      setSubcategories(cached.subcategories);
      setProducts(cached.products);
      setPagination({ hasMore: cached.hasMore, nextCursor: cached.nextCursor });
      return;
    }

    if (!append) {
      setPendingSelection(nextSelection);
      setSelection(nextSelection);
      setProducts([]);
      setPagination({ hasMore: false, nextCursor: null });
      if (nextSelection.categoryId !== selection.categoryId) {
        setSubcategories([]);
      }
    }

    startTransition(async () => {
      try {
        const params = new URLSearchParams({
          mode: safeMode,
          categoryId: nextSelection.categoryId,
        });
        if (nextSelection.subcategoryId) {
          params.set("subcategoryId", nextSelection.subcategoryId);
        }
        if (!includeSubcategories) {
          params.set("includeSubcategories", "false");
        }
        if (after !== null && after !== undefined && after !== "") {
          params.set("after", String(after));
        }
        const response = await apiFetch(`/api/public/commerce/${safeBusiness.username}?${params.toString()}`);
        if (requestId !== requestCounterRef.current) return;
        applyChunk(nextSelection, response?.data || {}, append);
      } catch {
        if (requestId === requestCounterRef.current) setPendingSelection(null);
      }
    });
  }

  async function prefetchChunk(nextSelection, { includeSubcategories = true } = {}) {
    if (preview) return;
    const cacheKey = `${nextSelection.categoryId}:${nextSelection.subcategoryId}`;
    if (cache[cacheKey] || prefetchedKeysRef.current.has(cacheKey)) return;
    prefetchedKeysRef.current.add(cacheKey);

    const params = new URLSearchParams({
      mode: safeMode,
      categoryId: nextSelection.categoryId,
    });
    if (nextSelection.subcategoryId) {
      params.set("subcategoryId", nextSelection.subcategoryId);
    }
    if (!includeSubcategories) {
      params.set("includeSubcategories", "false");
    }

    try {
      const response = await apiFetch(`/api/public/commerce/${safeBusiness.username}?${params.toString()}`);
      const nextChunk = response?.data || {};
      const resolvedSelection = {
        categoryId: String(nextChunk?.categoryId || nextSelection.categoryId || ""),
        subcategoryId: String(nextChunk?.subcategoryId ?? nextSelection.subcategoryId ?? ""),
      };
      const key = `${resolvedSelection.categoryId}:${resolvedSelection.subcategoryId}`;
      const nextPagination = normalizePagination(nextChunk);
      const nextState = {
        selection: resolvedSelection,
        subcategories: normalizePublicSubcategories(nextChunk?.subcategories),
        products: normalizePublicProducts(nextChunk?.products),
        hasMore: nextPagination.hasMore,
        nextCursor: nextPagination.nextCursor,
      };
      setCache((current) => current[key]
        ? current
        : {
          ...current,
          [key]: nextState,
          [cacheKey]: nextState,
        });
    } catch {
      prefetchedKeysRef.current.delete(cacheKey);
    }
  }

  useEffect(() => {
    if (preview || !safeMode || !safeBusiness.username || categories.length < 2) return undefined;
    const currentIndex = categories.findIndex((category) => category.id === selection.categoryId);
    if (currentIndex === -1 || currentIndex >= categories.length - 1) return undefined;

    const nextCategory = categories[currentIndex + 1];
    if (!nextCategory) return undefined;
    const nextSelection = {
      categoryId: nextCategory.id,
      subcategoryId: nextCategory.hasSubcategories ? nextCategory.firstSubcategoryId || "" : "",
    };
    const cacheKey = `${nextSelection.categoryId}:${nextSelection.subcategoryId}`;
    if (cache[cacheKey] || prefetchedKeysRef.current.has(cacheKey)) return undefined;

    const schedulePrefetch = () => prefetchChunk(nextSelection);
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(schedulePrefetch, { timeout: 1800 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(schedulePrefetch, 700);
    return () => window.clearTimeout(timeoutId);
  }, [cache, categories, preview, safeBusiness.username, safeMode, selection.categoryId]);

  useEffect(() => {
    if (!detailProduct) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setDetailProduct(null);
        setDetailImageIndex(0);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [detailProduct]);

  useEffect(() => {
    if (!cartOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setCartOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [cartOpen]);

  function handleSelectCategory(category) {
    if (selection.categoryId === category.id) return;
    loadChunk({
      categoryId: category.id,
      subcategoryId: category.hasSubcategories ? category.firstSubcategoryId || "" : "",
    });
  }

  function handleSelectSubcategory(subcategoryId) {
    if (!selection.categoryId) return;
    if (selection.subcategoryId === subcategoryId) return;

    loadChunk({
      categoryId: selection.categoryId,
      subcategoryId,
    }, {
      includeSubcategories: false,
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

  function handleAddToCart(product, quantityOverride = null) {
    const quantity = Math.max(1, Number(quantityOverride || getProductQuantity(product.id)));
    setCartItems((current) => {
      const exists = current.find((item) => item.id === product.id);
      if (exists) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item));
      }
      return [...current, {
        id: product.id,
        name: product.name,
        price: Number(product.price || 0),
        quantity,
        imageUrl: product.imageUrl || "",
        imageThumbUrl: product.imageThumbUrl || product.imageUrl || "",
      }];
    });
  }

  function handleCartQuantity(productId, delta) {
    setCartItems((current) => current
      .map((item) => (item.id === productId ? { ...item, quantity: Math.max(item.quantity + delta, 0) } : item))
      .filter((item) => item.quantity > 0));
  }

  function handleRemoveCartItem(productId) {
    setCartItems((current) => current.filter((item) => item.id !== productId));
  }

  function openProductDetail(product) {
    setDetailProduct(product);
    setDetailImageIndex(0);
  }

  function closeProductDetail() {
    setDetailProduct(null);
    setDetailImageIndex(0);
  }

  function handleDetailWhatsapp(product) {
    if (preview || !safeBootstrap.orderWhatsapp || !product) return;
    const message = `Hola, vi este producto en su catálogo y quiero más información sobre: ${product.name}`;
    window.open(buildWhatsappLink(safeBootstrap.orderWhatsapp, message), "_blank", "noopener,noreferrer");
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
    if (preview || !canSendOrder) return;
    const message = buildOrderMessage({
      items: cartItems,
      total: cartTotal,
      note: orderNote,
      customer,
      payment,
      currency: safeConfig.currency,
    });
    window.open(buildWhatsappLink(safeBootstrap.orderWhatsapp, message), "_blank", "noopener,noreferrer");
  }

  return (
    <main className={`commerce-page ${preview ? "is-preview" : ""}`} style={rootStyle}>
      <section className="commerce-shell">
        <header className="commerce-header commerce-visual-hero" style={headerStyle}>
          <div className="commerce-hero-actions">
            {!preview ? (
              <button className="commerce-hero-action" type="button" onClick={handleShare} aria-label="Compartir">
                <Share2 size={18} />
              </button>
            ) : null}
          </div>

          <div className="commerce-hero-brand">
            {safeBusiness.photo ? (
              <img className="commerce-avatar" src={safeBusiness.photoThumb || safeBusiness.photo} alt={safeBusiness.businessName} />
            ) : (
              <div className="commerce-avatar commerce-avatar-fallback">{safeBusiness.businessName?.slice(0, 1) || "K"}</div>
            )}
            <h1>{safeBusiness.businessName}</h1>
          </div>
        </header>

        <div className={`commerce-shop-layout ${safeBootstrap.supportsCart ? "has-cart" : "has-no-cart"}`.trim()}>
          <section className="commerce-menu-board">
            <nav className="commerce-navigation-panel" aria-label="Navegación de productos">
              <div className="commerce-category-rail" aria-label="Categorías">
                {categories.map((category) => {
                  const isActive = selection.categoryId === category.id;
                  const categoryImage = category.imageThumbUrl || category.imageUrl;
                  return (
                    <button
                      key={category.id}
                      className={`commerce-category-chip ${isActive ? "is-active" : ""}`.trim()}
                      type="button"
                      onClick={() => handleSelectCategory(category)}
                      aria-pressed={isActive}
                    >
                      <span className="commerce-category-image" aria-hidden="true">
                        {categoryImage ? (
                          <img src={categoryImage} alt="" loading="lazy" decoding="async" />
                        ) : (
                          <span>{category.name.slice(0, 1)}</span>
                        )}
                      </span>
                      <span className="commerce-category-name">{category.name}</span>
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
                        aria-pressed={isActive}
                      >
                        <span>{subcategory.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </nav>

            {selection.categoryId && subcategories.length ? (
              <span className="commerce-current-section-label">
                {subcategories.find((subcategory) => subcategory.id === selection.subcategoryId)?.name || selectedCategory?.name}
              </span>
            ) : null}

            {isSectionLoading ? (
              <ProductsLoading />
            ) : shouldShowProducts ? (
              <ProductsGrid
                bootstrap={safeBootstrap}
                preview={preview}
                products={products}
                pagination={pagination}
                isPending={isPending}
                onAdd={handleAddToCart}
                onOpenDetails={openProductDetail}
                onLoadMore={() => loadChunk(selection, { append: true, after: pagination.nextCursor, includeSubcategories: false })}
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

      {detailProduct ? (
        <div className="commerce-modal-backdrop" role="dialog" aria-modal="true" aria-label={detailProduct.name} onMouseDown={closeProductDetail}>
          <div className="commerce-modal-card commerce-product-detail-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button
              className="commerce-modal-close"
              type="button"
              aria-label="Cerrar detalle del producto"
              onClick={closeProductDetail}
            >
              <X size={18} />
            </button>

            <div className="commerce-product-detail-gallery">
              <div className="commerce-product-detail-main-image">
                {activeDetailImage?.imageUrl || activeDetailImage?.imageThumbUrl ? (
                  <img src={activeDetailImage.imageUrl || activeDetailImage.imageThumbUrl} alt={detailProduct.name} />
                ) : (
                  <span>{detailProduct.name?.slice(0, 1) || "P"}</span>
                )}

                {detailImages.length > 1 ? (
                  <>
                    <button
                      className="commerce-product-detail-nav is-prev"
                      type="button"
                      aria-label="Imagen anterior"
                      onClick={() => setDetailImageIndex((current) => (current <= 0 ? detailImages.length - 1 : current - 1))}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      className="commerce-product-detail-nav is-next"
                      type="button"
                      aria-label="Imagen siguiente"
                      onClick={() => setDetailImageIndex((current) => (current >= detailImages.length - 1 ? 0 : current + 1))}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                ) : null}
              </div>

              {detailImages.length > 1 ? (
                <div className="commerce-product-detail-thumbs" aria-label="Galería del producto">
                  {detailImages.map((image, index) => (
                    <button
                      key={image.id}
                      className={`commerce-product-detail-thumb ${detailImageIndex === index ? "is-active" : ""}`.trim()}
                      type="button"
                      onClick={() => setDetailImageIndex(index)}
                    >
                      {image.imageThumbUrl || image.imageUrl ? <img src={image.imageThumbUrl || image.imageUrl} alt="" /> : <span>{index + 1}</span>}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="commerce-product-detail-copy">
              <div className="commerce-modal-head">
                <strong>{detailProduct.name}</strong>
                {detailProduct.price !== null && detailProduct.price !== undefined ? <span>{formatCurrency(detailProduct.price, safeConfig.currency)}</span> : null}
              </div>
              {detailProduct.description ? (
                <p>{detailProduct.description}</p>
              ) : (
                <p>Escríbenos por WhatsApp para conocer más detalles de este producto.</p>
              )}
            </div>

            {safeBootstrap.supportsCart ? (
              <div className="commerce-product-detail-actions">
                <div className="commerce-quantity-stepper" aria-label={`Cantidad de ${detailProduct.name}`}>
                  <button type="button" onClick={() => handleProductQuantityStep(detailProduct.id, -1)} disabled={preview || getProductQuantity(detailProduct.id) <= 1} aria-label="Reducir cantidad">
                    <Minus size={16} />
                  </button>
                  <span>{getProductQuantity(detailProduct.id)}</span>
                  <button type="button" onClick={() => handleProductQuantityStep(detailProduct.id, 1)} disabled={preview} aria-label="Aumentar cantidad">
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  className="btn btn-primary commerce-product-detail-whatsapp"
                  type="button"
                  onClick={() => {
                    handleAddToCart(detailProduct, getProductQuantity(detailProduct.id));
                    closeProductDetail();
                  }}
                  disabled={preview}
                >
                  <ShoppingCart size={18} /> Agregar al pedido
                </button>
              </div>
            ) : (
              <button className="btn btn-primary commerce-product-detail-whatsapp" type="button" onClick={() => handleDetailWhatsapp(detailProduct)} disabled={!safeBootstrap.orderWhatsapp || preview}>
                <MessageCircle size={18} /> Pedir por WhatsApp
              </button>
            )}
          </div>
        </div>
      ) : null}

      {cartOpen && safeBootstrap.supportsCart ? (
        <div
          className="commerce-modal-backdrop commerce-cart-sheet-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Tu pedido"
          onMouseDown={() => setCartOpen(false)}
        >
          <div className="commerce-modal-card commerce-cart-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <div className="commerce-cart-sheet-handle" aria-hidden="true" />
            <button
              className="commerce-modal-close"
              type="button"
              aria-label="Cerrar carrito"
              onClick={() => setCartOpen(false)}
            >
              <span className="commerce-modal-close-icon" aria-hidden="true">
                <span />
                <span />
              </span>
            </button>

            <div className="commerce-cart-sheet-content">
              <div className="commerce-modal-head commerce-cart-sheet-head">
                <strong>Tu pedido</strong>
                <span>{cartCount} productos</span>
              </div>

              {cartItems.length ? (
                <div className="commerce-cart-list">
                  {cartItems.map((item) => (
                    <article className="commerce-cart-item" key={item.id}>
                      <div className="commerce-cart-thumb" aria-hidden="true">
                        {item.imageThumbUrl || item.imageUrl ? (
                          <img src={item.imageThumbUrl || item.imageUrl} alt="" loading="lazy" decoding="async" />
                        ) : (
                          <span>{item.name.slice(0, 1)}</span>
                        )}
                      </div>

                      <div className="commerce-cart-item-main">
                        <div className="commerce-cart-item-copy">
                          <strong>{item.name}</strong>
                          <span>{formatCurrency(item.price, safeConfig.currency)} c/u</span>
                        </div>

                        <div className="commerce-cart-item-controls">
                          <div className="commerce-cart-qty" aria-label={`Cantidad de ${item.name}`}>
                            <button type="button" onClick={() => handleCartQuantity(item.id, -1)} aria-label={`Reducir ${item.name}`}>
                              <Minus size={14} />
                            </button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => handleCartQuantity(item.id, 1)} aria-label={`Aumentar ${item.name}`}>
                              <Plus size={14} />
                            </button>
                          </div>

                          <button className="commerce-cart-remove" type="button" onClick={() => handleRemoveCartItem(item.id)} aria-label={`Eliminar ${item.name}`}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <strong className="commerce-cart-item-total">{formatCurrency(item.price * item.quantity, safeConfig.currency)}</strong>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="commerce-empty-state commerce-cart-empty">
                  <strong>Tu pedido está vacío</strong>
                  <p>Agrega productos para ver el total y enviarlo por WhatsApp.</p>
                </div>
              )}

              <section className="commerce-cart-summary" aria-label="Resumen del pedido">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatCurrency(cartTotal, safeConfig.currency)}</strong>
                </div>
                <div className="commerce-cart-summary-total">
                  <span>Total</span>
                  <strong>{formatCurrency(cartTotal, safeConfig.currency)}</strong>
                </div>
              </section>

              <section className="commerce-cart-customer" aria-label="Datos del cliente">
                <div className="commerce-cart-section-title">
                  <strong>Datos de entrega</strong>
                  <span>Los necesita el negocio para confirmar tu pedido.</span>
                </div>
                <input
                  className="input"
                  placeholder="Nombre completo"
                  autoComplete="name"
                  value={customer.customerName}
                  onChange={(event) => setCustomer((current) => ({ ...current, customerName: event.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Teléfono"
                  inputMode="tel"
                  autoComplete="tel"
                  value={customer.phone}
                  onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Dirección de entrega"
                  autoComplete="street-address"
                  value={customer.address}
                  onChange={(event) => setCustomer((current) => ({ ...current, address: event.target.value }))}
                />
              </section>

              <section className="commerce-cart-payment" aria-label="Forma de pago">
                <div className="commerce-cart-section-title">
                  <strong>Forma de pago</strong>
                  <span>Así el negocio puede preparar cambio o enviarte su link Klicor.</span>
                </div>
                <div className="commerce-cart-payment-options">
                  <button
                    className={`commerce-payment-option ${payment.method === "cash" ? "is-active" : ""}`.trim()}
                    type="button"
                    onClick={() => setPayment((current) => ({ ...current, method: "cash" }))}
                  >
                    Efectivo
                  </button>
                  <button
                    className={`commerce-payment-option ${payment.method === "transfer" ? "is-active" : ""}`.trim()}
                    type="button"
                    onClick={() => setPayment((current) => ({ ...current, method: "transfer" }))}
                  >
                    Transferencia
                  </button>
                </div>

                {payment.method === "cash" ? (
                  <input
                    className="input"
                    placeholder="¿Con cuánto vas a pagar?"
                    inputMode="numeric"
                    autoComplete="off"
                    value={payment.cashAmount}
                    onChange={(event) => setPayment((current) => ({ ...current, cashAmount: event.target.value }))}
                  />
                ) : (
                  <p className="commerce-transfer-note">
                    El negocio te responderá con su link Klicor para que elijas el medio de pago.
                  </p>
                )}
              </section>

              <label className="commerce-cart-note">
                <span>Notas del pedido</span>
                <textarea
                  className="textarea"
                  placeholder="Notas del pedido (opcional)"
                  rows={3}
                  value={orderNote}
                  onChange={(event) => setOrderNote(event.target.value)}
                />
              </label>
            </div>

            <div className="commerce-cart-sheet-footer">
              {cartItems.length && !canSendOrder ? (
                <span className="commerce-cart-submit-hint">Completa datos de entrega y pago para enviar el pedido.</span>
              ) : null}
              <button
                className="commerce-whatsapp-checkout-button"
                type="button"
                onClick={handleCheckout}
                disabled={!canSendOrder || preview}
              >
                <MessageCircle size={18} /> Enviar pedido por WhatsApp
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
