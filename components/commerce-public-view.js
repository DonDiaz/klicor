"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { FONT_FAMILY_STYLE_MAP } from "@/app/fonts";
import { CommerceCategoryAsset } from "@/components/commerce-category-asset";
import { getBusinessOpenStatus } from "@/lib/business-hours";
import { apiFetch } from "@/lib/client-api";
import { buildCommerceProductPublicUrl, resolveCommerceModeMeta } from "@/lib/commerce-config";
import { buildWhatsappLink } from "@/lib/utils";
import { hexToRgba, normalizeAppearance } from "@/lib/theme-system";

function WhatsappIcon({ size = 18, ...props }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fill="currentColor"
        d="M16.04 3.2C9.02 3.2 3.32 8.9 3.32 15.92c0 2.24.58 4.42 1.69 6.35L3.2 28.8l6.68-1.75a12.67 12.67 0 0 0 6.16 1.57c7.01 0 12.72-5.7 12.72-12.71S23.05 3.2 16.04 3.2Zm0 23.28c-1.9 0-3.76-.51-5.38-1.48l-.38-.23-3.96 1.04 1.06-3.86-.25-.4a10.5 10.5 0 0 1-1.62-5.63c0-5.82 4.73-10.56 10.54-10.56 2.82 0 5.47 1.1 7.46 3.09a10.48 10.48 0 0 1 3.09 7.46c0 5.82-4.74 10.57-10.56 10.57Zm5.78-7.91c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.72.16-.21.32-.83 1.03-1.02 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57a9.5 9.5 0 0 1-1.76-2.19c-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.99-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.14 3.09 1.3 3.3.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.15-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z"
      />
    </svg>
  );
}

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

const COMMERCE_THEME_PALETTES = {
  food_fast: {
    background: "#FFF6ED",
    surface: "#FFFFFF",
    primary: "#EA3B16",
    secondary: "#F97316",
    text: "#1F130D",
    muted: "#775C4D",
  },
  food_pizzeria: {
    background: "#FFF7ED",
    surface: "#FFFFFF",
    primary: "#F97316",
    secondary: "#B45309",
    text: "#1C1917",
    muted: "#78716C",
  },
  food_warm: {
    background: "#FFF7ED",
    surface: "#FFFFFF",
    primary: "#F97316",
    secondary: "#B45309",
    text: "#1C1917",
    muted: "#78716C",
  },
  food_healthy: {
    background: "#F1FAF1",
    surface: "#FFFFFF",
    primary: "#16A34A",
    secondary: "#65A30D",
    text: "#102014",
    muted: "#536A57",
  },
  grocery_fresh: {
    background: "#F3FAF2",
    surface: "#FFFFFF",
    primary: "#15803D",
    secondary: "#22C55E",
    text: "#102014",
    muted: "#556B5A",
  },
  fashion_female: {
    background: "#FFF5F7",
    surface: "#FFFFFF",
    primary: "#DB2777",
    secondary: "#B76E79",
    text: "#211018",
    muted: "#765B65",
  },
  fashion_male: {
    background: "#F5F7FA",
    surface: "#FFFFFF",
    primary: "#111827",
    secondary: "#1E3A8A",
    text: "#101828",
    muted: "#586174",
  },
  fashion_mixed: {
    background: "#F7F7F5",
    surface: "#FFFFFF",
    primary: "#1F2937",
    secondary: "#6B7280",
    text: "#111827",
    muted: "#5E6470",
  },
  fashion_neutral: {
    background: "#F7F7F5",
    surface: "#FFFFFF",
    primary: "#1F2937",
    secondary: "#6B7280",
    text: "#111827",
    muted: "#5E6470",
  },
  premium_catalog: {
    background: "#FAF7F2",
    surface: "#FFFFFF",
    primary: "#8B5A2B",
    secondary: "#D6A45E",
    text: "#1F1710",
    muted: "#6D6257",
  },
  whatsapp_catalog: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    primary: "#0F766E",
    secondary: "#22A98A",
    text: "#0F172A",
    muted: "#64748B",
  },
  tech_blue: {
    background: "#F1F6FF",
    surface: "#FFFFFF",
    primary: "#0F5EC8",
    secondary: "#2563EB",
    text: "#0F172A",
    muted: "#556174",
  },
  pharmacy_care: {
    background: "#F1FBF8",
    surface: "#FFFFFF",
    primary: "#0D9488",
    secondary: "#14B8A6",
    text: "#0F1F1D",
    muted: "#55716C",
  },
  stationery_clear: {
    background: "#F6F8FF",
    surface: "#FFFFFF",
    primary: "#2563EB",
    secondary: "#F59E0B",
    text: "#111827",
    muted: "#596579",
  },
  hardware_practical: {
    background: "#F8F7F4",
    surface: "#FFFFFF",
    primary: "#92400E",
    secondary: "#475569",
    text: "#1C1917",
    muted: "#6B6258",
  },
  beauty_soft: {
    background: "#FFF5FA",
    surface: "#FFFFFF",
    primary: "#BE185D",
    secondary: "#A855F7",
    text: "#22111A",
    muted: "#765B68",
  },
  pet_store: {
    background: "#F5FAF7",
    surface: "#FFFFFF",
    primary: "#15803D",
    secondary: "#D97706",
    text: "#102014",
    muted: "#5B6D60",
  },
  active_store: {
    background: "#F5FAFF",
    surface: "#FFFFFF",
    primary: "#0369A1",
    secondary: "#16A34A",
    text: "#0F172A",
    muted: "#596579",
  },
  playful_store: {
    background: "#FFF7ED",
    surface: "#FFFFFF",
    primary: "#EA580C",
    secondary: "#7C3AED",
    text: "#1C1917",
    muted: "#6B6258",
  },
  gift_store: {
    background: "#FFF7F9",
    surface: "#FFFFFF",
    primary: "#C026D3",
    secondary: "#F97316",
    text: "#211018",
    muted: "#765B70",
  },
  flower_store: {
    background: "#F7FEF4",
    surface: "#FFFFFF",
    primary: "#16A34A",
    secondary: "#DB2777",
    text: "#102014",
    muted: "#5B6D60",
  },
  home_warm: {
    background: "#FAF7F2",
    surface: "#FFFFFF",
    primary: "#7C2D12",
    secondary: "#B45309",
    text: "#1C1917",
    muted: "#6B6258",
  },
  general_market: {
    background: "#F7F5FF",
    surface: "#FFFFFF",
    primary: "#6D28D9",
    secondary: "#8B5CF6",
    text: "#171321",
    muted: "#655D74",
  },
  services_clean: {
    background: "#F6FAFF",
    surface: "#FFFFFF",
    primary: "#2563EB",
    secondary: "#0F766E",
    text: "#0F172A",
    muted: "#5B6575",
  },
  health_soft: {
    background: "#F2FBF8",
    surface: "#FFFFFF",
    primary: "#0D9488",
    secondary: "#8B5CF6",
    text: "#10201D",
    muted: "#58716B",
  },
  tourism_earth: {
    background: "#F8F6EF",
    surface: "#FFFFFF",
    primary: "#0F766E",
    secondary: "#B45309",
    text: "#171B17",
    muted: "#66675C",
  },
};

function resolveCommercePalette(experience = {}, appearance = {}) {
  const theme = String(experience?.theme || "general_market");
  return COMMERCE_THEME_PALETTES[theme] || {
    background: "#F7F5FF",
    surface: "#FFFFFF",
    primary: appearance.primaryColor || "#6D28D9",
    secondary: appearance.secondaryColor || "#8B5CF6",
    text: "#111827",
    muted: "#64748B",
  };
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
        imageCardUrl: String(image.imageCardUrl || image.imageUrl || image.imageThumbUrl || "").trim(),
        imageThumbUrl: String(image.imageThumbUrl || image.imageCardUrl || image.imageUrl || "").trim(),
        imageWidth: Number(image.imageWidth || 0) || 0,
        imageHeight: Number(image.imageHeight || 0) || 0,
      }))
      .filter((image) => image.imageUrl || image.imageCardUrl || image.imageThumbUrl)
    : [];

  if (items.length) return items;

  const fallbackImageUrl = String(fallback.imageUrl || "").trim();
  const fallbackCardUrl = String(fallback.imageCardUrl || fallback.imageUrl || fallback.imageThumbUrl || "").trim();
  const fallbackThumbUrl = String(fallback.imageThumbUrl || fallback.imageCardUrl || fallback.imageUrl || "").trim();
  if (!fallbackImageUrl && !fallbackCardUrl && !fallbackThumbUrl) return [];

  return [{
    id: "image-1",
    imageUrl: fallbackImageUrl,
    imageCardUrl: fallbackCardUrl,
    imageThumbUrl: fallbackThumbUrl,
    imageWidth: Number(fallback.imageWidth || 0) || 0,
    imageHeight: Number(fallback.imageHeight || 0) || 0,
  }];
}

function normalizeBusinessHoursStatus(value = {}) {
  return {
    configured: Boolean(value?.configured),
    isOpen: value?.isOpen !== false,
    label: value?.label || "Pedidos disponibles",
    detail: value?.detail || "",
    nextOpeningLabel: value?.nextOpeningLabel || "",
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
        imageCardUrl: String(product.imageCardUrl || product.imageUrl || product.imageThumbUrl || ""),
        imageThumbUrl: String(product.imageThumbUrl || product.imageCardUrl || product.imageUrl || ""),
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
        productCount: Number(subcategory.productCount || 0) || 0,
        visibleProductCount: Number(subcategory.visibleProductCount ?? subcategory.productCount ?? 0) || 0,
      }))
      .filter((subcategory) => subcategory.visibleProductCount > 0)
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
        color: String(category.color || ""),
        imageUrl: String(category.imageUrl || category.previewImage?.imageUrl || ""),
        imageThumbUrl: String(category.imageThumbUrl || category.previewImage?.imageThumbUrl || category.previewImage?.imageUrl || category.imageUrl || ""),
        hasSubcategories: Boolean(category.hasSubcategories),
        firstSubcategoryId: String(category.firstSubcategoryId || ""),
        subcategoryCount: Number(category.subcategoryCount || 0) || 0,
        productCount: Number(category.productCount || 0) || 0,
        visibleProductCount: Number(category.visibleProductCount ?? category.productCount ?? 0) || 0,
      }))
      .filter((category) => category.visibleProductCount > 0)
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
  orderingEnabled,
  whatsappAvailable,
  onAdd,
  onOpenDetails,
  onWhatsapp,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasDescription = Boolean(String(product.description || "").trim());
  const hasPrice = product.price !== null && product.price !== undefined;
  const isCatalog = !supportsCart;
  const productImageUrl = product.imageCardUrl || product.imageThumbUrl || product.imageUrl || "";

  return (
    <article className={`commerce-product-card commerce-visual-product-card ${supportsCart ? "supports-cart" : "is-catalog-card"}`.trim()}>
      <div
        className="commerce-product-main"
        role="button"
        tabIndex={preview ? -1 : 0}
        aria-disabled={preview}
        onClick={() => {
          if (!preview) onOpenDetails(product);
        }}
        onKeyDown={(event) => {
          if (preview) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenDetails(product);
          }
        }}
      >
        <div className="commerce-product-image-shell" aria-hidden="true">
          {productImageUrl && !imageFailed ? (
            <Image
              className="commerce-product-image"
              src={productImageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 46vw, (max-width: 960px) 30vw, 220px"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span>{product.name.slice(0, 1)}</span>
          )}
        </div>
        <div className="commerce-product-copy">
          <strong>{product.name}</strong>
          {hasDescription && !isCatalog ? <p>{product.description}</p> : null}
          <div className="commerce-product-footer">
            {hasPrice ? (
              <span>{formatCurrency(product.price, currency)}</span>
            ) : (
              <span className="commerce-product-price-placeholder">{isCatalog ? "Consultar" : "Ver detalle"}</span>
            )}
            {supportsCart ? (
              <button
                className="commerce-product-add-button"
                type="button"
                aria-label={orderingEnabled ? `Agregar ${product.name}` : "Tienda cerrada"}
                title={orderingEnabled ? "Agregar" : "Cerrado"}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onAdd(product, 1);
                }}
                disabled={preview || !orderingEnabled}
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                className="commerce-product-add-button is-whatsapp"
                type="button"
                aria-label={orderingEnabled && whatsappAvailable ? `Consultar ${product.name} por WhatsApp` : "Cerrado ahora"}
                title={orderingEnabled && whatsappAvailable ? "WhatsApp" : "Cerrado"}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onWhatsapp(product);
                }}
                disabled={preview || !orderingEnabled || !whatsappAvailable}
              >
                <WhatsappIcon size={18} />
              </button>
            )}
          </div>
        </div>
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
  orderingEnabled,
  onAdd,
  onWhatsapp,
  onOpenDetails,
  onLoadMore,
  emptyLabel,
}) {
  const currency = bootstrap?.config?.currency || "COP";
  const supportsCart = Boolean(bootstrap?.supportsCart);
  const whatsappAvailable = Boolean(bootstrap?.orderWhatsapp);
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
            orderingEnabled={orderingEnabled}
            whatsappAvailable={whatsappAvailable}
            onAdd={onAdd}
            onWhatsapp={onWhatsapp}
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
    businessCategory: safeBootstrap.business?.businessCategory || "",
    businessHours: safeBootstrap.business?.businessHours || {},
  };
  const safeConfig = {
    currency: safeBootstrap.config?.currency || "COP",
  };
  const [businessHoursStatus, setBusinessHoursStatus] = useState(() => normalizeBusinessHoursStatus(safeBootstrap.businessHoursStatus));
  const orderingEnabled = Boolean(businessHoursStatus.isOpen);
  const safeMode = safeBootstrap.mode || safeBootstrap.config?.activeMode || "";
  const safeExperience = safeBootstrap.experience || {};
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
  const [deepLinkProductId, setDeepLinkProductId] = useState("");
  const [pendingSelection, setPendingSelection] = useState(null);
  const requestCounterRef = useRef(0);
  const prefetchedKeysRef = useRef(new Set());
  const deepLinkHandledRef = useRef("");
  const [isPending, startTransition] = useTransition();
  const businessHoursKey = useMemo(() => JSON.stringify(safeBusiness.businessHours || {}), [safeBusiness.businessHours]);

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
    && orderingEnabled
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
  const activeDetailImageUrl = activeDetailImage?.imageUrl || activeDetailImage?.imageCardUrl || activeDetailImage?.imageThumbUrl || "";
  const commercePalette = resolveCommercePalette(safeExperience, appearance);
  const pageBackground = commercePalette.background;

  const rootStyle = {
    fontFamily,
    background: pageBackground,
    color: commercePalette.text,
    "--commerce-background": pageBackground,
    "--commerce-surface": commercePalette.surface,
    "--commerce-surface-soft": hexToRgba(commercePalette.surface, 0.92),
    "--commerce-surface-strong": hexToRgba(commercePalette.surface, 0.96),
    "--commerce-primary": commercePalette.primary,
    "--commerce-primary-strong": commercePalette.primary,
    "--commerce-primary-soft": hexToRgba(commercePalette.primary, 0.12),
    "--commerce-primary-border": hexToRgba(commercePalette.primary, 0.16),
    "--commerce-primary-shadow": hexToRgba(commercePalette.primary, 0.24),
    "--commerce-secondary": commercePalette.secondary,
    "--commerce-tertiary": appearance.tertiaryColor,
    "--commerce-text": commercePalette.text,
    "--commerce-muted": commercePalette.muted,
    "--commerce-line": hexToRgba(commercePalette.text, 0.1),
    "--commerce-shadow": hexToRgba(commercePalette.text, 0.08),
    "--commerce-button-text": appearance.buttonPrimaryTextColor,
  };
  function findLoadedProduct(productId) {
    const cleanProductId = String(productId || "").trim();
    if (!cleanProductId) return null;

    const currentProduct = normalizePublicProducts(products).find((product) => product.id === cleanProductId);
    if (currentProduct) {
      return { product: currentProduct, section: null };
    }

    const cachedSection = Object.values(cache).find((section) => (
      normalizePublicProducts(section?.products).some((product) => product.id === cleanProductId)
    ));
    if (!cachedSection) return null;

    return {
      product: normalizePublicProducts(cachedSection.products).find((product) => product.id === cleanProductId),
      section: cachedSection,
    };
  }

  function openDeepLinkedProduct(product, section = null) {
    if (!product) return;

    const nextSelection = {
      categoryId: String(product.categoryId || section?.selection?.categoryId || selection.categoryId || ""),
      subcategoryId: String(product.subcategoryId ?? section?.selection?.subcategoryId ?? ""),
    };
    const cacheKey = `${nextSelection.categoryId}:${nextSelection.subcategoryId}`;
    const cachedSection = cache[cacheKey] || section;

    if (cachedSection) {
      setSelection(cachedSection.selection || nextSelection);
      setSubcategories(cachedSection.subcategories || subcategories);
      setProducts(cachedSection.products || products);
      setPagination({
        hasMore: Boolean(cachedSection.hasMore),
        nextCursor: cachedSection.nextCursor ?? null,
      });
    } else {
      setSelection(nextSelection);
    }

    openProductDetail(product);
  }

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
    if (preview || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    setDeepLinkProductId(String(params.get("producto") || params.get("product") || params.get("productId") || "").trim());
  }, [preview]);

  useEffect(() => {
    if (preview || !deepLinkProductId || !safeMode || !safeBusiness.username) return undefined;
    if (deepLinkHandledRef.current === deepLinkProductId) return undefined;

    const loadedMatch = findLoadedProduct(deepLinkProductId);
    if (loadedMatch?.product) {
      deepLinkHandledRef.current = deepLinkProductId;
      openDeepLinkedProduct(loadedMatch.product, loadedMatch.section);
      return undefined;
    }

    let cancelled = false;
    deepLinkHandledRef.current = deepLinkProductId;

    startTransition(async () => {
      try {
        const params = new URLSearchParams({
          mode: safeMode,
          producto: deepLinkProductId,
        });
        const response = await apiFetch(`/api/public/commerce/${safeBusiness.username}?${params.toString()}`);
        if (cancelled) return;

        const data = response?.data || {};
        const nextSelection = {
          categoryId: String(data.categoryId || data.product?.categoryId || ""),
          subcategoryId: String(data.subcategoryId ?? data.product?.subcategoryId ?? ""),
        };
        applyChunk(nextSelection, data, false);

        const targetProduct = normalizePublicProducts([data.product]).find(Boolean)
          || normalizePublicProducts(data.products).find((product) => product.id === deepLinkProductId);
        if (targetProduct) {
          openProductDetail(targetProduct);
        }
      } catch {
        deepLinkHandledRef.current = "";
      }
    });

    return () => {
      cancelled = true;
    };
  }, [deepLinkProductId, preview, safeBusiness.username, safeMode]);

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
    const updateBusinessHoursStatus = () => {
      setBusinessHoursStatus(normalizeBusinessHoursStatus(getBusinessOpenStatus(safeBusiness.businessHours)));
    };

    updateBusinessHoursStatus();

    if (preview || !safeBusiness.businessHours?.enabled) return undefined;

    const intervalId = window.setInterval(updateBusinessHoursStatus, 30000);
    return () => window.clearInterval(intervalId);
  }, [businessHoursKey, preview]);

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
    if (!orderingEnabled) return;
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
        imageCardUrl: product.imageCardUrl || product.imageUrl || "",
        imageThumbUrl: product.imageThumbUrl || product.imageCardUrl || product.imageUrl || "",
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

  function getProductImageUrl(product = {}) {
    return product.imageUrl || product.imageCardUrl || product.imageThumbUrl || "";
  }

  function buildAbsoluteProductUrl(product = {}) {
    const path = buildCommerceProductPublicUrl(safeBusiness.username, safeMode, product?.id);
    if (!path) return "";
    if (typeof window === "undefined") return path;
    return new URL(path, window.location.origin).toString();
  }

  function buildProductWhatsappMessage(product = {}) {
    const lines = [
      "Hola, quiero informacion de este producto:",
      "",
      product.name || "Producto",
    ];
    if (product.price !== null && product.price !== undefined) {
      lines.push(`Precio: ${formatCurrency(product.price, safeConfig.currency)}`);
    }
    const productUrl = buildAbsoluteProductUrl(product);
    if (productUrl) lines.push(`Link: ${productUrl}`);
    const imageUrl = getProductImageUrl(product);
    if (imageUrl) lines.push(`Imagen: ${imageUrl}`);
    return lines.filter(Boolean).join("\n");
  }

  function handleProductWhatsapp(product) {
    if (preview || !safeBootstrap.orderWhatsapp || !orderingEnabled || !product) return;
    window.open(buildWhatsappLink(safeBootstrap.orderWhatsapp, buildProductWhatsappMessage(product)), "_blank", "noopener,noreferrer");
  }

  function handleDetailWhatsapp(product) {
    if (preview || !safeBootstrap.orderWhatsapp || !orderingEnabled || !product) return;
    window.open(buildWhatsappLink(safeBootstrap.orderWhatsapp, buildProductWhatsappMessage(product)), "_blank", "noopener,noreferrer");
  }

  async function handleShareProduct(product) {
    if (preview || typeof window === "undefined" || !product) return;
    const shareUrl = buildAbsoluteProductUrl(product);
    if (!shareUrl) return;
    const shareData = {
      title: product.name || safeBusiness.businessName,
      text: `Mira este producto de ${safeBusiness.businessName}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        return;
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    }
  }

  async function handleShareStore() {
    if (preview || typeof window === "undefined") return;
    const shareUrl = window.location.href;
    const shareData = {
      title: safeBusiness.businessName,
      text: `Mira la tienda de ${safeBusiness.businessName} en Klicor`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        return;
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    }
  }

  function handleCheckout() {
    if (preview || !orderingEnabled || !canSendOrder) return;
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
    <main className={`commerce-page commerce-mode-${safeMode || "commerce"} commerce-layout-${safeExperience.layout || "standard"} commerce-theme-${safeExperience.theme || "default"} commerce-variant-${safeExperience.variant || "neutral"} ${safeBootstrap.supportsCart ? "has-cart-mode" : "has-catalog-mode"} ${preview ? "is-preview" : ""}`} style={rootStyle}>
      <section className="commerce-shell">
        <header className="commerce-header commerce-public-summary">
          <div className="commerce-hero-brand">
            {safeBusiness.photo ? (
              <Image
                className="commerce-avatar"
                src={safeBusiness.photoThumb || safeBusiness.photo}
                alt={safeBusiness.businessName}
                width={56}
                height={56}
                sizes="56px"
              />
            ) : (
              <div className="commerce-avatar commerce-avatar-fallback">{safeBusiness.businessName?.slice(0, 1) || "K"}</div>
            )}
            <div className="commerce-hero-brand-copy" aria-label={safeBusiness.businessName}>
              <h1>{safeBusiness.businessName}</h1>
            </div>
            <div className="commerce-header-actions">
              <span className={`commerce-hours-pill ${orderingEnabled ? "is-open" : "is-closed"}`.trim()}>
                {orderingEnabled ? "Abierto" : "Cerrado"}
              </span>
              <button type="button" className="commerce-share-button" onClick={handleShareStore} aria-label="Compartir tienda">
                <Share2 size={17} />
              </button>
            </div>
          </div>
        </header>

        <div className={`commerce-shop-layout ${safeBootstrap.supportsCart ? "has-cart" : "has-no-cart"}`.trim()}>
          <section className="commerce-menu-board">
            <nav className="commerce-navigation-panel" aria-label="Navegación de productos">
              <div className="commerce-category-rail" aria-label="Categorías">
                {categories.map((category) => {
                  const isActive = selection.categoryId === category.id;
                  return (
                    <button
                      key={category.id}
                      className={`commerce-category-chip ${isActive ? "is-active" : ""}`.trim()}
                      type="button"
                      onClick={() => handleSelectCategory(category)}
                      aria-pressed={isActive}
                    >
                      <span className="commerce-category-image" aria-hidden="true">
                        <CommerceCategoryAsset iconKey={category.iconKey} vertical={safeBusiness.businessCategory} label={category.name} />
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

            {isSectionLoading ? (
              <ProductsLoading />
            ) : shouldShowProducts ? (
              <ProductsGrid
                bootstrap={safeBootstrap}
                preview={preview}
                products={products}
                pagination={pagination}
                isPending={isPending}
                orderingEnabled={orderingEnabled}
                onAdd={handleAddToCart}
                onWhatsapp={handleProductWhatsapp}
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
              <button className="commerce-cart-panel-button" type="button" onClick={() => setCartOpen(true)} disabled={preview || !orderingEnabled}>
                {orderingEnabled ? `Ver pedido (${cartCount})` : "Cerrado ahora"}
              </button>
            </aside>
          ) : null}
        </div>
      </section>

      {safeBootstrap.supportsCart ? (
        <button className="commerce-order-bar" type="button" onClick={() => setCartOpen(true)} disabled={preview || !orderingEnabled}>
          <span className="commerce-order-bar-icon" aria-hidden="true">
            <ShoppingCart size={20} />
            {orderingEnabled && cartCount ? <em>{cartCount}</em> : null}
          </span>
          <span className="commerce-order-bar-copy">
            <strong>{orderingEnabled ? "Ver pedido" : "Cerrado ahora"}</strong>
            <small>{orderingEnabled ? `${cartCount} ${cartCount === 1 ? "producto" : "productos"}` : "Pedidos desactivados"}</small>
          </span>
          <span className="commerce-order-bar-total">
            {orderingEnabled ? formatCurrency(cartTotal, safeConfig.currency) : "—"}
          </span>
          <ChevronRight size={20} aria-hidden="true" />
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
                {activeDetailImageUrl ? (
                  <Image
                    src={activeDetailImageUrl}
                    alt={detailProduct.name}
                    fill
                    sizes="(max-width: 760px) 100vw, 620px"
                    loading="eager"
                  />
                ) : (
                  <span>{detailProduct.name?.slice(0, 1) || "P"}</span>
                )}

                {detailImages.length ? (
                  <span className="commerce-product-detail-counter">
                    {detailImageIndex + 1}/{detailImages.length}
                  </span>
                ) : null}

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
                      {image.imageThumbUrl || image.imageCardUrl || image.imageUrl ? (
                        <Image
                          src={image.imageThumbUrl || image.imageCardUrl || image.imageUrl}
                          alt=""
                          fill
                          sizes="70px"
                          loading="lazy"
                        />
                      ) : <span>{index + 1}</span>}
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
                <div className="commerce-product-detail-quantity-label">Cantidad</div>
                <div className="commerce-quantity-stepper" aria-label={`Cantidad de ${detailProduct.name}`}>
                  <button type="button" onClick={() => handleProductQuantityStep(detailProduct.id, -1)} disabled={preview || !orderingEnabled || getProductQuantity(detailProduct.id) <= 1} aria-label="Reducir cantidad">
                    <Minus size={16} />
                  </button>
                  <span>{getProductQuantity(detailProduct.id)}</span>
                  <button type="button" onClick={() => handleProductQuantityStep(detailProduct.id, 1)} disabled={preview || !orderingEnabled} aria-label="Aumentar cantidad">
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
                  disabled={preview || !orderingEnabled}
                >
                  <ShoppingCart size={18} />
                  <span>{orderingEnabled ? "Agregar al pedido" : "Cerrado ahora"}</span>
                  {detailProduct.price !== null && detailProduct.price !== undefined ? (
                    <strong>{formatCurrency(Number(detailProduct.price || 0) * getProductQuantity(detailProduct.id), safeConfig.currency)}</strong>
                  ) : null}
                </button>
                <button
                  className="btn btn-secondary commerce-product-detail-share"
                  type="button"
                  onClick={() => handleShareProduct(detailProduct)}
                  disabled={preview}
                >
                  <Share2 size={18} />
                  Compartir producto
                </button>
              </div>
            ) : (
              <div className="commerce-product-detail-actions">
                <button className="btn btn-primary commerce-product-detail-whatsapp" type="button" onClick={() => handleDetailWhatsapp(detailProduct)} disabled={!safeBootstrap.orderWhatsapp || preview || !orderingEnabled}>
                  <WhatsappIcon size={20} /> {orderingEnabled ? "Pedir informacion" : "Cerrado ahora"}
                </button>
                <button
                  className="btn btn-secondary commerce-product-detail-share"
                  type="button"
                  onClick={() => handleShareProduct(detailProduct)}
                  disabled={preview}
                >
                  <Share2 size={18} />
                  Compartir producto
                </button>
              </div>
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
              <X size={18} aria-hidden="true" />
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
                        {item.imageThumbUrl || item.imageCardUrl || item.imageUrl ? (
                          <Image
                            src={item.imageThumbUrl || item.imageCardUrl || item.imageUrl}
                            alt=""
                            fill
                            sizes="70px"
                            loading="lazy"
                          />
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
              {!orderingEnabled ? (
                <span className="commerce-cart-submit-hint">El negocio está cerrado. Podrás enviar el pedido cuando vuelva a abrir.</span>
              ) : cartItems.length && !canSendOrder ? (
                <span className="commerce-cart-submit-hint">Completa datos de entrega y pago para enviar el pedido.</span>
              ) : null}
              <button
                className="commerce-whatsapp-checkout-button"
                type="button"
                onClick={handleCheckout}
                disabled={!canSendOrder || preview}
              >
                <WhatsappIcon size={20} /> Enviar pedido por WhatsApp
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

