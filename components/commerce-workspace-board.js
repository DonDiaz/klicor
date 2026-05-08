"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Star,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { CommerceCategoryAsset } from "@/components/commerce-category-asset";
import { apiFetch } from "@/lib/client-api";
import { resolveCommerceCategoryAsset } from "@/lib/commerce-category-assets";
import { COMMERCE_CATEGORY_COLORS, getCommerceCategoryIconGroups, resolveCommerceCategoryIcon } from "@/lib/commerce-category-icons";
import { COMMERCE_MODE_OPTIONS, requiresCommercePrice, resolveCommerceModeMeta } from "@/lib/commerce-config";
import { resolveCommerceExperience } from "@/lib/commerce-experience";

function countLabel(value, singular, plural) {
  const count = Number(value || 0) || 0;
  return `${count} ${count === 1 ? singular : plural}`;
}

function money(value) {
  if (value === null || value === undefined || value === "") return "Sin precio";
  return `$${Number(value || 0).toLocaleString("es-CO")}`;
}

function cleanName(value = "") {
  return String(value || "").trim().toLowerCase();
}

function subcats(category) {
  return Array.isArray(category?.subcategories) ? category.subcategories : [];
}

function directProductCount(category) {
  if (!category) return 0;
  const nestedCount = subcats(category).reduce((total, subcategory) => total + (Number(subcategory?.productCount || 0) || 0), 0);
  return Math.max((Number(category.productCount || 0) || 0) - nestedCount, 0);
}

function buildSectionKey(categoryId = "", subcategoryId = "") {
  return `${String(categoryId || "").trim()}:${String(subcategoryId || "").trim()}`;
}

function adjustCount(value, delta) {
  return Math.max(0, (Number(value || 0) || 0) + delta);
}

function buildPendingImageId(index = 0) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pending-${crypto.randomUUID()}`;
  }
  return `pending-${Date.now()}-${index + 1}-${Math.random().toString(16).slice(2, 8)}`;
}

function createPendingImageEntries(fileList = []) {
  return fileList
    .filter(Boolean)
    .map((file, index) => ({
      id: buildPendingImageId(index),
      file,
      previewUrl: typeof URL !== "undefined" ? URL.createObjectURL(file) : "",
      name: String(file?.name || "Nueva foto").trim() || "Nueva foto",
    }));
}

function revokePendingImageEntries(entries = []) {
  entries
    .filter((entry) => entry?.previewUrl)
    .forEach((entry) => {
      try {
        URL.revokeObjectURL(entry.previewUrl);
      } catch {
        // Ignore already released object URLs.
      }
    });
}

const COMMERCE_MODES_BY_BUSINESS_CATEGORY = {
  food_drink: ["mimenu", "micatalogo"],
  retail_sales: ["mitienda", "micatalogo"],
};
const COMMERCE_PRODUCT_MAX_IMAGES = 4;

function getCommerceModeOptionsForCategory(category = "") {
  const allowedModes = COMMERCE_MODES_BY_BUSINESS_CATEGORY[String(category || "").trim()];
  if (!allowedModes) return COMMERCE_MODE_OPTIONS;
  const allowedSet = new Set(allowedModes);
  return COMMERCE_MODE_OPTIONS.filter((option) => allowedSet.has(option.value));
}

function ProductRow({ product, sectionLabel, disabled, visibilityPending = false, onEdit, onToggleVisibility, onDelete }) {
  const visible = product.visible !== false;

  return (
    <article className={`commerce-board-product-row ${visible ? "" : "is-hidden"}`.trim()}>
      <div className="commerce-board-product-thumb">
        {product.imageThumbUrl || product.imageUrl ? (
          <img src={product.imageThumbUrl || product.imageUrl} alt={product.name} />
        ) : (
          <span>{product.name?.slice(0, 1) || "P"}</span>
        )}
        {!visible ? <span className="commerce-board-hidden-badge">OCULTO</span> : null}
      </div>
      <div className="commerce-board-product-copy">
        <div>
          <strong>{product.name}</strong>
          <small>{sectionLabel}</small>
        </div>
        <div className="commerce-board-product-meta">
          <span>{money(product.price)}</span>
          {product.featuredInDorika ? (
            <span className="commerce-board-status is-featured">
              <Star size={13} /> Dorika
            </span>
          ) : null}
          <span className={`commerce-board-status ${visible ? "is-visible" : "is-hidden"}`}>
            {visible ? "Visible" : "Oculto"}
          </span>
        </div>
      </div>
      <div className="commerce-board-product-actions">
        <button type="button" onClick={() => onEdit(product)} disabled={disabled} title="Editar producto" aria-label={`Editar producto ${product.name || ""}`.trim()}>
          <Pencil size={15} />
        </button>
        <button type="button" onClick={() => onToggleVisibility(product, !visible)} disabled={disabled} title={visible ? "Ocultar producto" : "Mostrar producto"} aria-label={`${visible ? "Ocultar" : "Mostrar"} producto ${product.name || ""}`.trim()}>
          {visibilityPending ? <LoaderCircle size={15} className="spin" /> : visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button type="button" onClick={() => onDelete(product.id)} disabled={disabled} title="Eliminar producto" aria-label={`Eliminar producto ${product.name || ""}`.trim()}>
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

export function CommerceWorkspace({ token, profile, active = false, canEdit = true }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mobileView, setMobileView] = useState("categories");
  const [sectionMode, setSectionMode] = useState("products");
  const [configForm, setConfigForm] = useState({ activeMode: "", orderWhatsapp: "", currency: "COP" });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(COMMERCE_CATEGORY_COLORS[0]);
  const [iconPickerQuery, setIconPickerQuery] = useState("");
  const [showAllCategoryAssets, setShowAllCategoryAssets] = useState(false);
  const [subcategoryDrafts, setSubcategoryDrafts] = useState({});
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState({});
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryIcon, setEditingCategoryIcon] = useState("");
  const [editingCategoryColor, setEditingCategoryColor] = useState(COMMERCE_CATEGORY_COLORS[0]);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState("");
  const [editingSubcategoryName, setEditingSubcategoryName] = useState("");
  const [productEditor, setProductEditor] = useState(null);
  const [productEditorError, setProductEditorError] = useState("");
  const [visibilityPendingProducts, setVisibilityPendingProducts] = useState({});
  const [sectionCache, setSectionCache] = useState({});
  const sectionCacheRef = useRef({});
  const sectionRequestRef = useRef(0);
  const productEditorRef = useRef(null);

  const categories = useMemo(() => (
    Array.isArray(state?.categories) ? state.categories : []
  ), [state?.categories]);
  const availableCommerceModes = useMemo(() => getCommerceModeOptionsForCategory(profile?.businessCategory), [profile?.businessCategory]);
  const modeMeta = resolveCommerceModeMeta(configForm.activeMode);
  const savedActiveMode = state?.config?.activeMode || "";
  const commerceExperience = useMemo(() => resolveCommerceExperience({ activeMode: configForm.activeMode }, profile), [configForm.activeMode, profile]);
  const commerceAssetContext = useMemo(() => ({
    businessCategory: profile?.businessCategory,
    businessType: profile?.businessType || profile?.dorikaProfile?.businessType,
    activeMode: configForm.activeMode || savedActiveMode,
    module: commerceExperience.module,
    subcategory: commerceExperience.subcategory,
    variant: commerceExperience.variant,
    theme: commerceExperience.theme,
  }), [commerceExperience, configForm.activeMode, profile?.businessCategory, profile?.businessType, profile?.dorikaProfile?.businessType, savedActiveMode]);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) || null;
  const selectedSubcategories = subcats(selectedCategory);
  const selectedSubcategoryId = selectedCategory
    ? selectedSubcategoryIds[selectedCategory.id] || selectedCategory.firstSubcategoryId || selectedSubcategories[0]?.id || ""
    : "";
  const selectedSubcategory = selectedSubcategories.find((subcategory) => subcategory.id === selectedSubcategoryId) || null;
  const activeSectionKey = selectedCategory
    ? buildSectionKey(selectedCategory.id, selectedSubcategory?.id || (selectedSubcategories.length ? selectedSubcategoryId : ""))
    : "";
  const activeSection = activeSectionKey ? sectionCache[activeSectionKey] : null;
  const activeProducts = Array.isArray(activeSection?.products) ? activeSection.products : [];
  const visibleProducts = activeProducts.filter((product) => product.visible !== false).length;
  const hiddenProducts = activeProducts.length - visibleProducts;
  const savedUsername = profile?.savedUsername || profile?.username || "";
  const commercePublicPath = savedActiveMode && savedUsername ? `/${savedUsername}/${savedActiveMode}` : "";
  const commercePublicUrl = useMemo(() => {
    if (!commercePublicPath) return "";
    const baseUrl = typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://klicor.com";
    return `${baseUrl}${commercePublicPath}`;
  }, [commercePublicPath]);

  useEffect(() => {
    productEditorRef.current = productEditor;
  }, [productEditor]);

  useEffect(() => () => {
    revokePendingImageEntries(productEditorRef.current?.pendingImages || []);
  }, []);

  useEffect(() => {
    if (!configForm.activeMode) return;
    if (availableCommerceModes.some((option) => option.value === configForm.activeMode)) return;
    setConfigForm((current) => ({
      ...current,
      activeMode: availableCommerceModes[0]?.value || "",
    }));
  }, [availableCommerceModes, configForm.activeMode]);

  const syncState = useCallback((nextState) => {
    setState(nextState);
    setConfigForm({
      activeMode: nextState?.config?.activeMode || "",
      orderWhatsapp: nextState?.config?.orderWhatsapp || "",
      currency: nextState?.config?.currency || "COP",
    });
    return nextState;
  }, []);

  const replaceSectionCache = useCallback((nextValue) => {
    setSectionCache((current) => {
      const next = typeof nextValue === "function" ? nextValue(current) : nextValue;
      sectionCacheRef.current = next;
      return next;
    });
  }, []);

  const clearSectionCache = useCallback(() => {
    sectionCacheRef.current = {};
    setSectionCache({});
  }, []);

  const fetchStructure = useCallback(async () => {
    const response = await apiFetch("/api/commerce?view=structure", { token });
    return syncState(response.state);
  }, [syncState, token]);

  const fetchSection = useCallback(async ({ categoryId = "", subcategoryId = "", force = false } = {}) => {
    const normalizedCategoryId = String(categoryId || "").trim();
    const normalizedSubcategoryId = String(subcategoryId || "").trim();
    if (!normalizedCategoryId) {
      return { categoryId: "", subcategoryId: "", products: [] };
    }

    const key = buildSectionKey(normalizedCategoryId, normalizedSubcategoryId);
    if (!force && sectionCacheRef.current[key]) {
      return sectionCacheRef.current[key];
    }

    const requestId = sectionRequestRef.current + 1;
    sectionRequestRef.current = requestId;
    setSectionLoading(true);

    try {
      const params = new URLSearchParams({
        view: "products",
        categoryId: normalizedCategoryId,
      });
      if (normalizedSubcategoryId) {
        params.set("subcategoryId", normalizedSubcategoryId);
      }

      const response = await apiFetch(`/api/commerce?${params.toString()}`, { token });
      const nextSection = {
        categoryId: String(response.section?.categoryId || normalizedCategoryId).trim(),
        subcategoryId: String(response.section?.subcategoryId || normalizedSubcategoryId).trim(),
        products: Array.isArray(response.section?.products) ? response.section.products : [],
      };

      if (sectionRequestRef.current !== requestId) {
        return nextSection;
      }

      replaceSectionCache((current) => ({
        ...current,
        [buildSectionKey(nextSection.categoryId, nextSection.subcategoryId)]: nextSection,
      }));

      return nextSection;
    } finally {
      if (sectionRequestRef.current === requestId) {
        setSectionLoading(false);
      }
    }
  }, [replaceSectionCache, token]);

  const patchProductInSectionCache = useCallback((productId, patch) => {
    const normalizedProductId = String(productId || "").trim();
    if (!normalizedProductId) return;

    replaceSectionCache((current) => {
      let changed = false;
      const next = Object.fromEntries(Object.entries(current).map(([key, section]) => {
        const products = Array.isArray(section?.products) ? section.products : [];
        let sectionChanged = false;
        const nextProducts = products.map((product) => {
          if (product.id !== normalizedProductId) return product;
          sectionChanged = true;
          return {
            ...product,
            ...patch,
          };
        });

        if (!sectionChanged) return [key, section];
        changed = true;
        return [key, {
          ...section,
          products: nextProducts,
        }];
      }));

      return changed ? next : current;
    });
  }, [replaceSectionCache]);

  const patchStructureVisibilityCounts = useCallback((product, delta) => {
    if (!product || !delta) return;

    setState((current) => {
      if (!current) return current;
      return {
        ...current,
        config: {
          ...(current.config || {}),
          visibleProductsCount: adjustCount(current.config?.visibleProductsCount, delta),
        },
        categories: (Array.isArray(current.categories) ? current.categories : []).map((category) => {
          if (category.id !== product.categoryId) return category;
          return {
            ...category,
            visibleProductCount: adjustCount(category.visibleProductCount, delta),
            subcategories: subcats(category).map((subcategory) => (
              product.subcategoryId && subcategory.id === product.subcategoryId
                ? {
                  ...subcategory,
                  visibleProductCount: adjustCount(subcategory.visibleProductCount, delta),
                }
                : subcategory
            )),
          };
        }),
      };
    });
  }, []);

  const resolveSelectionFromState = useCallback((nextState, preferred = {}) => {
    const nextCategories = Array.isArray(nextState?.categories) ? nextState.categories : [];
    if (!nextCategories.length) return null;

    const nextCategory = nextCategories.find((category) => category.id === preferred.categoryId) || nextCategories[0];
    const nextSubcategories = subcats(nextCategory);
    if (!nextSubcategories.length) {
      return {
        categoryId: nextCategory.id,
        subcategoryId: "",
      };
    }

    const nextSubcategory = nextSubcategories.find((subcategory) => subcategory.id === preferred.subcategoryId)
      || nextSubcategories.find((subcategory) => subcategory.id === nextCategory.firstSubcategoryId)
      || nextSubcategories[0];

    return {
      categoryId: nextCategory.id,
      subcategoryId: nextSubcategory?.id || "",
    };
  }, []);

  useEffect(() => {
    if (!active || !token) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    fetchStructure()
      .catch((nextError) => {
        if (!cancelled) setError(nextError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, fetchStructure, token]);

  useEffect(() => {
    if (!categories.length) {
      setSelectedCategoryId("");
      setSelectedSubcategoryIds({});
      setSectionMode("products");
      setMobileView("categories");
      return;
    }

    setSelectedCategoryId((current) => (
      categories.some((category) => category.id === current) ? current : categories[0].id
    ));

    setSelectedSubcategoryIds((current) => {
      const next = {};
      categories.forEach((category) => {
        const options = subcats(category);
        if (!options.length) return;
        next[category.id] = options.some((subcategory) => subcategory.id === current[category.id])
          ? current[category.id]
          : category.firstSubcategoryId || options[0].id;
      });
      return next;
    });
  }, [categories]);

  useEffect(() => {
    if (!selectedCategory) return;
    setSectionMode(subcats(selectedCategory).length ? "subcategories" : "products");
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!active || !token || !selectedCategory || loading) return;
    if (selectedSubcategories.length && !selectedSubcategoryId) return;

    fetchSection({
      categoryId: selectedCategory.id,
      subcategoryId: selectedSubcategories.length ? selectedSubcategoryId : "",
    }).catch((nextError) => setError(nextError.message));
  }, [
    active,
    fetchSection,
    loading,
    selectedCategory,
    selectedSubcategories.length,
    selectedSubcategoryId,
    token,
  ]);

  async function sendCommerceAction(action, payload = {}, image = null) {
    const body = new FormData();
    body.append("action", action);
    body.append("payload", JSON.stringify(payload));
    if (Array.isArray(image)) {
      image.filter(Boolean).forEach((file) => body.append("images", file));
    } else if (image) {
      body.append("image", image);
    }

    return apiFetch("/api/commerce", {
      method: "POST",
      token,
      body,
      isFormData: true,
    });
  }

  async function runAction(action, payload = {}, image = null) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await sendCommerceAction(action, payload, image);

      if (action !== "save_config") {
        clearSectionCache();
      }

      const result = response.result || {};
      const nextState = await fetchStructure();
      const nextSelection = resolveSelectionFromState(nextState, {
        categoryId: result.categoryId || payload.categoryId || selectedCategoryId,
        subcategoryId: result.subcategoryId || payload.subcategoryId || selectedSubcategoryId,
      });

      if (!nextSelection) {
        setSelectedCategoryId("");
        setSelectedSubcategoryIds({});
      } else {
        setSelectedCategoryId(nextSelection.categoryId);
        if (nextSelection.subcategoryId) {
          setSelectedSubcategoryIds((current) => ({
            ...current,
            [nextSelection.categoryId]: nextSelection.subcategoryId,
          }));
        }
      }

      if (action === "create_category" && result.categoryId) {
        setSectionMode("products");
        setMobileView("section");
      }

      if (action === "create_subcategory" && result.categoryId && result.subcategoryId) {
        setSelectedSubcategoryIds((current) => ({
          ...current,
          [result.categoryId]: result.subcategoryId,
        }));
        setSectionMode("products");
      }

      if (action !== "save_config" && nextSelection?.categoryId) {
        await fetchSection({
          categoryId: nextSelection.categoryId,
          subcategoryId: nextSelection.subcategoryId,
          force: true,
        });
      }

      setMessage("Cambios guardados.");
      return result;
    } catch (nextError) {
      setError(nextError.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function toggleProductVisibility(product, visible) {
    const productId = String(product?.id || "").trim();
    if (!productId || visibilityPendingProducts[productId]) return;

    const previousVisible = product.visible !== false;
    const nextVisible = Boolean(visible);
    if (previousVisible === nextVisible) return;

    const delta = nextVisible ? 1 : -1;
    setMessage("");
    setError("");
    setVisibilityPendingProducts((current) => ({ ...current, [productId]: true }));
    patchProductInSectionCache(productId, { visible: nextVisible });
    patchStructureVisibilityCounts(product, delta);

    try {
      await sendCommerceAction("toggle_product_visibility", { productId, visible: nextVisible });
      setMessage(nextVisible ? "Producto visible." : "Producto oculto.");
    } catch (nextError) {
      patchProductInSectionCache(productId, { visible: previousVisible });
      patchStructureVisibilityCounts(product, -delta);
      setError(nextError.message || "No pudimos actualizar el estado del producto.");
    } finally {
      setVisibilityPendingProducts((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
    }
  }

  async function copyCommerceUrl() {
    if (!commercePublicUrl || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(commercePublicUrl);
      setMessage("Link público copiado.");
    } catch {
      setError("No pudimos copiar el link. Puedes abrirlo y copiarlo desde el navegador.");
    }
  }

  function openCommerceUrl() {
    if (!commercePublicUrl || typeof window === "undefined") return;
    window.open(commercePublicUrl, "_blank", "noopener,noreferrer");
  }

  function confirmAction(question, callback) {
    if (typeof window !== "undefined" && !window.confirm(question)) return;
    callback();
  }

  function resetAssetPicker() {
    setIconPickerQuery("");
    setShowAllCategoryAssets(false);
  }

  function startEditCategory(category) {
    resetAssetPicker();
    setEditingSubcategoryId("");
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setEditingCategoryIcon(category.iconKey || "");
    setEditingCategoryColor(category.color || COMMERCE_CATEGORY_COLORS[0]);
  }

  function stopEditCategory() {
    setEditingCategoryId("");
    resetAssetPicker();
  }

  function stopEditSubcategory() {
    setEditingSubcategoryId("");
    setEditingSubcategoryName("");
  }

  function resolveAssetGroups(name = "", { includeAll = false } = {}) {
    const suggestedIcon = resolveCommerceCategoryIcon(name, profile?.businessCategory).iconKey;
    const query = includeAll
      ? iconPickerQuery
      : iconPickerQuery.trim() || String(name || "").trim();
    return getCommerceCategoryIconGroups(profile?.businessCategory, query, suggestedIcon, {
      ...commerceAssetContext,
      includeAll,
    });
  }

  function limitAssetRecommendations(groups = []) {
    const options = [];
    groups.forEach((group) => {
      (group.options || []).forEach((option) => {
        if (!options.some((item) => item.iconKey === option.iconKey)) {
          options.push(option);
        }
      });
    });
    return [{ title: "Recomendados", options: options.slice(0, 6) }];
  }

  function renderIconPicker({ name, value, onIconChange }) {
    const searchText = iconPickerQuery.trim() || String(name || "").trim();
    const allGroups = resolveAssetGroups(name, { includeAll: showAllCategoryAssets });
    const groups = !searchText && !showAllCategoryAssets
      ? []
      : showAllCategoryAssets
        ? allGroups
        : limitAssetRecommendations(allGroups);
    const selectedIconRaw = value || resolveCommerceCategoryIcon(name, profile?.businessCategory).iconKey || "tag";
    const selectedIcon = resolveCommerceCategoryAsset(selectedIconRaw, profile?.businessCategory).key || selectedIconRaw;

    return (
      <div className="commerce-icon-picker" aria-label="Selector visual de asset de categoria">
        <input
          className="input commerce-icon-search"
          value={iconPickerQuery}
          onChange={(event) => {
            setIconPickerQuery(event.target.value);
            setShowAllCategoryAssets(false);
          }}
          placeholder="Buscar asset: sandalias, aretes, pizza..."
          type="search"
        />
        {!searchText && !showAllCategoryAssets ? (
          <small className="commerce-board-note">Escribe el nombre de la categoria para ver recomendaciones.</small>
        ) : null}
        <div className="commerce-icon-picker-groups">
          {groups.map((group) => (
            <section key={group.title} className="commerce-icon-picker-group" aria-label={group.title}>
              <strong>{group.title}</strong>
              <div className="commerce-icon-picker-grid">
                {group.options.map((option) => (
                  <button
                    key={option.iconKey}
                    className={`commerce-icon-option ${selectedIcon === option.iconKey ? "is-active" : ""}`.trim()}
                    type="button"
                    onClick={() => onIconChange(option.iconKey)}
                    title={option.label}
                    aria-pressed={selectedIcon === option.iconKey}
                  >
                    <CommerceCategoryAsset iconKey={option.iconKey} vertical={profile?.businessCategory} label={option.label} />
                    <span>{option.label}</span>
                    {selectedIcon === option.iconKey ? (
                      <small className="commerce-icon-selected-label">
                        <Check size={12} /> Seleccionado
                      </small>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
        <button className="btn btn-secondary commerce-icon-picker-more" type="button" onClick={() => setShowAllCategoryAssets((current) => !current)}>
          {showAllCategoryAssets ? "Ver solo recomendados" : "Ver mas opciones"}
        </button>
      </div>
    );
  }

  async function createCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const result = await runAction("create_category", {
      name,
      iconKey: newCategoryIcon || resolveCommerceCategoryIcon(name, profile?.businessCategory).iconKey,
      color: newCategoryColor,
    });
    if (result) {
      setNewCategoryName("");
      setNewCategoryIcon("");
      setNewCategoryColor(COMMERCE_CATEGORY_COLORS[0]);
      resetAssetPicker();
    }
  }

  async function createSubcategory(categoryId) {
    const name = String(subcategoryDrafts[categoryId] || "").trim();
    if (!name) return;
    const result = await runAction("create_subcategory", {
      categoryId,
      name,
    });
    if (result) {
      setSubcategoryDrafts((current) => ({ ...current, [categoryId]: "" }));
      setMobileView("section");
      setSectionMode("products");
    }
  }

  function selectCategory(category) {
    setSelectedCategoryId(category.id);
    setSectionMode(subcats(category).length ? "subcategories" : "products");
    setMobileView("section");
  }

  function openSubcategory(category, subcategory) {
    setSelectedCategoryId(category.id);
    setSelectedSubcategoryIds((current) => ({ ...current, [category.id]: subcategory.id }));
    setSectionMode("products");
    setMobileView("section");
  }

  function openProductEditor(category, subcategory = null, product = null) {
    if (!category && !product) return;
    revokePendingImageEntries(productEditorRef.current?.pendingImages || []);
    setProductEditorError("");
    setProductEditor({
      mode: configForm.activeMode,
      categoryId: product?.categoryId || category?.id || "",
      subcategoryId: product?.subcategoryId || subcategory?.id || "",
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price ?? "",
      visible: product?.visible !== false,
      featuredInDorika: Boolean(product?.featuredInDorika),
      images: Array.isArray(product?.images) ? product.images : [],
      pendingImages: [],
      removedImageIds: [],
      id: product?.id || "",
    });
  }

  function openProductEditorForCurrentSection() {
    if (!selectedCategory) return;
    const targetSubcategory = selectedSubcategory
      || (selectedSubcategoryId ? selectedSubcategories.find((subcategory) => subcategory.id === selectedSubcategoryId) || { id: selectedSubcategoryId, name: "Subcategoría seleccionada" } : null);

    if (selectedSubcategories.length && !targetSubcategory) return;
    openProductEditor(selectedCategory, targetSubcategory);
  }

  function closeProductEditor() {
    revokePendingImageEntries(productEditorRef.current?.pendingImages || []);
    setProductEditorError("");
    setProductEditor(null);
  }

  function addProductEditorImages(fileList = []) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;

    const currentImagesCount = (Array.isArray(productEditor?.images) ? productEditor.images : []).length
      + (Array.isArray(productEditor?.pendingImages) ? productEditor.pendingImages : []).length;
    const availableSlots = Math.max(0, COMMERCE_PRODUCT_MAX_IMAGES - currentImagesCount);
    if (!availableSlots) {
      setProductEditorError(`Puedes subir máximo ${COMMERCE_PRODUCT_MAX_IMAGES} fotos por producto.`);
      return;
    }

    const acceptedFiles = files.slice(0, availableSlots);
    const nextEntries = createPendingImageEntries(acceptedFiles);
    if (!nextEntries.length) return;
    setProductEditorError(files.length > acceptedFiles.length
      ? `Solo agregamos ${acceptedFiles.length} foto${acceptedFiles.length === 1 ? "" : "s"}. El máximo es ${COMMERCE_PRODUCT_MAX_IMAGES}.`
      : "");
    setProductEditor((current) => {
      if (!current) {
        revokePendingImageEntries(nextEntries);
        return current;
      }
      return {
        ...current,
        pendingImages: [...(Array.isArray(current.pendingImages) ? current.pendingImages : []), ...nextEntries],
      };
    });
  }

  function removeExistingProductImage(imageId) {
    if (!imageId) return;
    setProductEditorError("");
    setProductEditor((current) => {
      if (!current) return current;
      return {
        ...current,
        images: (Array.isArray(current.images) ? current.images : []).filter((image) => image.id !== imageId),
        removedImageIds: [...new Set([...(Array.isArray(current.removedImageIds) ? current.removedImageIds : []), imageId])],
      };
    });
  }

  function removePendingProductImage(imageId) {
    if (!imageId) return;
    setProductEditorError("");
    setProductEditor((current) => {
      if (!current) return current;
      const pendingImages = Array.isArray(current.pendingImages) ? current.pendingImages : [];
      const removedImage = pendingImages.find((image) => image.id === imageId);
      if (removedImage) {
        revokePendingImageEntries([removedImage]);
      }
      return {
        ...current,
        pendingImages: pendingImages.filter((image) => image.id !== imageId),
      };
    });
  }

  function renderModuleHeader() {
    return (
      <header className="commerce-board-header">
        <div className="commerce-board-title">
          <span>Módulo comercial</span>
          <h2>{configForm.activeMode ? modeMeta.label : "Mi tienda"}</h2>
        </div>

        <div className="commerce-board-toolbar">
          <label>
            <span>Modo activo</span>
            <select className="select" value={configForm.activeMode} onChange={(event) => setConfigForm((current) => ({ ...current, activeMode: event.target.value }))} disabled={!canEdit}>
              <option value="">Elegir modo</option>
              {availableCommerceModes.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>WhatsApp</span>
            <input className="input" value={configForm.orderWhatsapp} onChange={(event) => setConfigForm((current) => ({ ...current, orderWhatsapp: event.target.value }))} placeholder="573001234567" disabled={!canEdit} />
          </label>
          <button className="btn btn-secondary" type="button" onClick={() => runAction("save_config", configForm)} disabled={!canEdit || loading}>
            <Store size={15} /> {loading ? "Guardando..." : "Guardar"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={copyCommerceUrl} disabled={!commercePublicUrl}>
            <Copy size={15} /> Copiar
          </button>
          <button className="btn btn-primary" type="button" onClick={openCommerceUrl} disabled={!commercePublicUrl}>
            <ExternalLink size={15} /> Ver público
          </button>
        </div>
      </header>
    );
  }

  function renderCategoriesPanel() {
    return (
      <section className="commerce-board-panel commerce-board-categories" aria-label="Categorías">
        <div className="commerce-board-panel-head">
          <div>
            <span>Bloque A</span>
            <h3>Categorías</h3>
          </div>
          <strong>{countLabel(categories.length, "categoría", "categorías")}</strong>
        </div>

        <div className="commerce-board-create">
          <input className="input" value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Nombre de la categoría" disabled={!canEdit} />
          {renderIconPicker({
            name: newCategoryName,
            value: newCategoryIcon,
            onIconChange: setNewCategoryIcon,
          })}
          <button className="btn btn-primary commerce-board-create-action" type="button" onClick={createCategory} disabled={!canEdit || !newCategoryName.trim() || loading}>
            <Plus size={16} /> Crear categoría
          </button>
        </div>

        {categories.length ? (
          <div className="commerce-board-list">
            {categories.map((category) => {
              const selected = selectedCategoryId === category.id;
              const editing = editingCategoryId === category.id;
              return (
                <article key={category.id} className={`commerce-board-row ${selected ? "is-active" : ""}`.trim()}>
                  {editing ? (
                    <div className="commerce-board-inline-edit">
                      <input className="input" value={editingCategoryName} onChange={(event) => setEditingCategoryName(event.target.value)} placeholder="Nombre de la categoría" disabled={!canEdit} />
                      {renderIconPicker({
                        name: editingCategoryName,
                        value: editingCategoryIcon,
                        onIconChange: setEditingCategoryIcon,
                      })}
                      <div className="commerce-board-inline-actions">
                        <button className="btn btn-primary" type="button" onClick={async () => {
                          const result = await runAction("update_category", {
                            id: category.id,
                            name: editingCategoryName,
                            iconKey: editingCategoryIcon || category.iconKey,
                            color: editingCategoryColor || category.color,
                          });
                          if (result) stopEditCategory();
                        }} disabled={!canEdit || !editingCategoryName.trim() || loading}>
                          {loading ? "Guardando..." : "Guardar"}
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={stopEditCategory} disabled={loading}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button className="commerce-board-row-main" type="button" onClick={() => selectCategory(category)} aria-pressed={selected}>
                        <span className="commerce-board-dot" style={category.color ? { "--commerce-board-dot-color": category.color } : undefined}>
                          <CommerceCategoryAsset iconKey={category.iconKey} vertical={profile?.businessCategory} label={category.name} />
                        </span>
                        <span>
                          <strong>{category.name}</strong>
                          <small>{countLabel(category.productCount, "producto", "productos")} · {countLabel(category.subcategoryCount, "subcategoría", "subcategorías")}</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                      <div className="commerce-board-row-actions">
                        <button type="button" onClick={() => runAction("move_category", { categoryId: category.id, direction: "up" })} disabled={!canEdit || loading} title="Mover arriba" aria-label={`Mover arriba categoría ${category.name || ""}`.trim()}><ChevronUp size={15} /></button>
                        <button type="button" onClick={() => runAction("move_category", { categoryId: category.id, direction: "down" })} disabled={!canEdit || loading} title="Mover abajo" aria-label={`Mover abajo categoría ${category.name || ""}`.trim()}><ChevronDown size={15} /></button>
                        <button type="button" onClick={() => startEditCategory(category)} disabled={!canEdit || loading} title="Editar categoría" aria-label={`Editar categoria ${category.name || ""}`.trim()}><Pencil size={15} /></button>
                        <button type="button" onClick={() => confirmAction("¿Eliminar esta categoría? Solo se puede eliminar si está vacía.", () => runAction("delete_category", { categoryId: category.id }))} disabled={!canEdit || loading} title="Eliminar categoría" aria-label={`Eliminar categoria ${category.name || ""}`.trim()}><Trash2 size={15} /></button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="commerce-board-empty">
            <strong>Sin categorías todavía</strong>
            <p>Crea la primera sección de tu tienda, menú o catálogo.</p>
          </div>
        )}
      </section>
    );
  }

  function renderSubcategoriesPanel() {
    if (!selectedCategory) {
      return (
        <section className="commerce-board-panel commerce-board-section">
          <div className="commerce-board-empty">
            <strong>Selecciona una categoría</strong>
            <p>Elige una categoría para ver subcategorías o productos.</p>
          </div>
        </section>
      );
    }

    const selectedHasDirectProducts = directProductCount(selectedCategory) > 0;

    return (
      <section className="commerce-board-panel commerce-board-section" aria-label="Subcategorías">
        <button className="commerce-board-back" type="button" onClick={() => setMobileView("categories")}>
          <ChevronLeft size={16} /> Categorías
        </button>
        <div className="commerce-board-panel-head">
          <div>
            <span>Bloque B</span>
            <h3>{selectedCategory.name}</h3>
          </div>
          <strong>{countLabel(selectedSubcategories.length, "subcategoría", "subcategorías")}</strong>
        </div>

        <div className="commerce-board-create commerce-board-create-with-product">
          <input
            className="input"
            value={subcategoryDrafts[selectedCategory.id] || ""}
            onChange={(event) => setSubcategoryDrafts((current) => ({ ...current, [selectedCategory.id]: event.target.value }))}
            placeholder="Nombre de la subcategoría"
            disabled={!canEdit || selectedHasDirectProducts}
          />
          <button className="btn btn-primary commerce-board-subcategory-action" type="button" onClick={() => createSubcategory(selectedCategory.id)} disabled={!canEdit || selectedHasDirectProducts || !String(subcategoryDrafts[selectedCategory.id] || "").trim() || loading}>
            <Plus size={16} /> Crear subcategoría
          </button>
        </div>
        {selectedHasDirectProducts ? (
          <small className="commerce-board-note">Esta categoría ya tiene productos directos. Los productos se gestionan en el Bloque C.</small>
        ) : (
          <small className="commerce-board-note">El Bloque B es solo para subcategorías. Los productos de la sección activa están en el Bloque C.</small>
        )}

        {selectedSubcategories.length ? (
          <div className="commerce-board-list">
            {selectedSubcategories.map((subcategory) => {
              const editing = editingSubcategoryId === subcategory.id;
              return (
                <article key={subcategory.id} className={`commerce-board-row ${selectedSubcategoryId === subcategory.id ? "is-active" : ""}`.trim()}>
                  {editing ? (
                    <div className="commerce-board-inline-edit">
                      <input className="input" value={editingSubcategoryName} onChange={(event) => setEditingSubcategoryName(event.target.value)} placeholder="Nombre de la subcategoría" disabled={!canEdit} />
                      <button className="btn btn-primary" type="button" onClick={async () => {
                        const result = await runAction("update_subcategory", {
                          id: subcategory.id,
                          categoryId: selectedCategory.id,
                          name: editingSubcategoryName,
                        });
                        if (result) {
                          setSubcategoryDrafts((current) => ({ ...current, [selectedCategory.id]: "" }));
                          stopEditSubcategory();
                        }
                      }} disabled={!canEdit || !editingSubcategoryName.trim() || loading}>
                        {loading ? "Guardando..." : "Guardar"}
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={stopEditSubcategory} disabled={loading}>Cancelar</button>
                    </div>
                  ) : (
                    <>
                      <button className="commerce-board-row-main" type="button" onClick={() => openSubcategory(selectedCategory, subcategory)}>
                        <span>
                          <strong>{subcategory.name}</strong>
                          <small>{countLabel(subcategory.productCount, "producto", "productos")}</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                      <div className="commerce-board-row-actions">
                        <button type="button" onClick={() => runAction("move_subcategory", { subcategoryId: subcategory.id, direction: "up" })} disabled={!canEdit || loading} title="Mover arriba" aria-label={`Mover arriba subcategoria ${subcategory.name || ""}`.trim()}><ChevronUp size={15} /></button>
                        <button type="button" onClick={() => runAction("move_subcategory", { subcategoryId: subcategory.id, direction: "down" })} disabled={!canEdit || loading} title="Mover abajo" aria-label={`Mover abajo subcategoria ${subcategory.name || ""}`.trim()}><ChevronDown size={15} /></button>
                        <button type="button" onClick={() => { setEditingCategoryId(""); setEditingSubcategoryId(subcategory.id); setEditingSubcategoryName(subcategory.name); }} disabled={!canEdit || loading} title="Editar subcategoría" aria-label={`Editar subcategoria ${subcategory.name || ""}`.trim()}><Pencil size={15} /></button>
                        <button type="button" onClick={() => confirmAction("¿Eliminar esta subcategoría? Solo se puede eliminar si está vacía.", () => runAction("delete_subcategory", { subcategoryId: subcategory.id }))} disabled={!canEdit || loading} title="Eliminar subcategoría" aria-label={`Eliminar subcategoria ${subcategory.name || ""}`.trim()}><Trash2 size={15} /></button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="commerce-board-empty">
            <strong>Sin subcategorías</strong>
            <p>Crea subcategorías si necesitas dividir esta categoría. Si no, agrega productos directamente en el Bloque C.</p>
            <button className="btn btn-secondary" type="button" onClick={() => setSectionMode("products")}>
              Ver productos en Bloque C
            </button>
          </div>
        )}
      </section>
    );
  }

  function renderProductsPanel({ asSupport = false } = {}) {
    if (!selectedCategory) {
      return (
        <section className={`commerce-board-panel ${asSupport ? "commerce-board-support commerce-board-products-panel" : "commerce-board-section"}`.trim()}>
          <div className="commerce-board-empty">
            <strong>Selecciona una categoría</strong>
            <p>Elige dónde quieres agregar o editar productos.</p>
          </div>
        </section>
      );
    }

    const targetSubcategory = selectedSubcategory
      || (selectedSubcategoryId ? selectedSubcategories.find((subcategory) => subcategory.id === selectedSubcategoryId) || { id: selectedSubcategoryId, name: "Subcategoría seleccionada" } : null);
    const sectionLabel = targetSubcategory ? `${selectedCategory.name} · ${targetSubcategory.name}` : selectedCategory.name;
    const canAddProduct = Boolean(configForm.activeMode && selectedCategory && (!selectedSubcategories.length || selectedSubcategoryId));
    const handleBackFromProducts = () => {
      if (targetSubcategory) {
        setSectionMode("subcategories");
        setMobileView("categories");
        return;
      }
      if (selectedSubcategories.length) {
        setSectionMode("subcategories");
        return;
      }
      setMobileView("categories");
    };

    return (
      <section className={`commerce-board-panel ${asSupport ? "commerce-board-support commerce-board-products-panel" : "commerce-board-section"}`.trim()} aria-label="Productos">
        <button className="commerce-board-back" type="button" onClick={handleBackFromProducts}>
          <ChevronLeft size={16} /> {targetSubcategory ? "Subcategorías" : "Categorías"}
        </button>
        <div className="commerce-board-panel-head">
          <div>
            <span>Bloque C</span>
            <h3>{targetSubcategory ? targetSubcategory.name : selectedCategory.name}</h3>
          </div>
          <strong>{countLabel(activeProducts.length, "producto", "productos")}</strong>
        </div>

        <div className="commerce-board-product-summary">
          <span>{countLabel(visibleProducts, "visible", "visibles")}</span>
          <span>{countLabel(hiddenProducts, "oculto", "ocultos")}</span>
        </div>

        {targetSubcategory ? (
          <>
            <button className="commerce-board-return-categories" type="button" onClick={handleBackFromProducts}>
              <ChevronLeft size={16} /> Volver a subcategorías
            </button>
            <button className="btn btn-primary commerce-board-main-action commerce-board-product-action" type="button" onClick={openProductEditorForCurrentSection} disabled={!canEdit || !canAddProduct}>
              <ImagePlus size={16} /> Crear producto
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-primary commerce-board-main-action commerce-board-product-action" type="button" onClick={openProductEditorForCurrentSection} disabled={!canEdit || !canAddProduct}>
              <ImagePlus size={16} /> Crear producto
            </button>
            {selectedSubcategories.length ? <small className="commerce-board-note">Selecciona una subcategoría en el Bloque B para agregar productos allí.</small> : null}
          </>
        )}

        {sectionLoading && !activeProducts.length ? (
          <div className="commerce-board-empty">
            <LoaderCircle size={18} className="spin" />
            <p>Cargando productos de esta sección...</p>
          </div>
        ) : activeProducts.length ? (
          <div className="commerce-board-products">
            {activeProducts.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                sectionLabel={sectionLabel}
                disabled={!canEdit || loading || Boolean(visibilityPendingProducts[product.id])}
                visibilityPending={Boolean(visibilityPendingProducts[product.id])}
                onEdit={(nextProduct) => openProductEditor(selectedCategory, targetSubcategory, nextProduct)}
                onToggleVisibility={toggleProductVisibility}
                onDelete={(productId) => confirmAction("¿Eliminar este producto?", () => runAction("delete_product", { productId }))}
              />
            ))}
          </div>
        ) : (
          <div className="commerce-board-empty">
            <strong>Sin productos en esta sección</strong>
            <p>Agrega el primer producto con nombre, precio, descripción e imagen.</p>
          </div>
        )}
      </section>
    );
  }

  function renderMiddlePanel() {
    return renderSubcategoriesPanel();
  }

  function renderSupportPanel() {
    return renderProductsPanel({ asSupport: true });
  }

  function renderProductEditor() {
    if (!productEditor) return null;
    const editorCategory = categories.find((category) => category.id === productEditor.categoryId) || null;
    const editorSubcategory = editorCategory ? subcats(editorCategory).find((subcategory) => subcategory.id === productEditor.subcategoryId) : null;
    const existingImages = Array.isArray(productEditor.images) ? productEditor.images : [];
    const pendingImages = Array.isArray(productEditor.pendingImages) ? productEditor.pendingImages : [];
    const totalImages = existingImages.length + pendingImages.length;
    const priceIsRequired = requiresCommercePrice(productEditor.mode || configForm.activeMode);
    const remainingImages = Math.max(0, COMMERCE_PRODUCT_MAX_IMAGES - totalImages);
    const productName = String(productEditor.name || "").trim();
    const productPrice = String(productEditor.price ?? "").trim();
    const productPriceNumber = Number(productEditor.price);
    const productEditorIsValid = Boolean(productName)
      && productName.length >= 2
      && (!priceIsRequired || (productPrice && Number.isFinite(productPriceNumber) && productPriceNumber > 0))
      && (!productPrice || (Number.isFinite(productPriceNumber) && productPriceNumber >= 0))
      && totalImages > 0
      && totalImages <= COMMERCE_PRODUCT_MAX_IMAGES;

    return (
      <div className="commerce-modal-backdrop" role="dialog" aria-modal="true" aria-label="Editor de producto">
        <div className="commerce-modal-card commerce-board-editor-card">
          <button className="commerce-modal-close" type="button" onClick={closeProductEditor} aria-label="Cerrar editor de producto" title="Cerrar">
            <X size={16} />
          </button>
          <div className="commerce-modal-head">
            <strong>{productEditor.id ? "Editar producto" : "Crear producto"}</strong>
            <span>{editorSubcategory ? `${editorCategory?.name || "Categoría"} · ${editorSubcategory.name}` : editorCategory?.name || "Categoría seleccionada"}</span>
          </div>

          <div className="commerce-board-editor-form">
            <input className="input" placeholder="Nombre del producto" value={productEditor.name} onChange={(event) => {
              setProductEditorError("");
              setProductEditor((current) => ({ ...current, name: event.target.value }));
            }} />
            <input className="input" placeholder={priceIsRequired ? "Precio" : "Precio opcional"} value={productEditor.price ?? ""} onChange={(event) => {
              setProductEditorError("");
              setProductEditor((current) => ({ ...current, price: event.target.value }));
            }} />
            <textarea className="textarea" rows={4} placeholder="Descripción del producto (opcional)" value={productEditor.description || ""} onChange={(event) => {
              setProductEditorError("");
              setProductEditor((current) => ({ ...current, description: event.target.value }));
            }} />
            <label className="upload-card">
              <input
                className="upload-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                disabled={totalImages >= COMMERCE_PRODUCT_MAX_IMAGES}
                onChange={(event) => {
                  addProductEditorImages(event.target.files || []);
                  event.target.value = "";
                }}
              />
              <span>{pendingImages.length ? `${pendingImages.length} fotos nuevas listas para guardar` : "Agregar fotos del producto"}</span>
              <small>
                {remainingImages
                  ? `Puedes agregar hasta ${remainingImages} foto${remainingImages === 1 ? "" : "s"} más.`
                  : `Ya tienes el máximo de ${COMMERCE_PRODUCT_MAX_IMAGES} fotos.`}
              </small>
            </label>
            {existingImages.length ? (
              <div className="commerce-board-image-group">
                <strong>Fotos actuales</strong>
                <div className="commerce-board-image-strip">
                  {existingImages.map((image, index) => (
                    <div key={image.id} className="commerce-board-image-card">
                      <span className="commerce-board-image-chip">
                        {image.imageThumbUrl || image.imageUrl ? <img src={image.imageThumbUrl || image.imageUrl} alt={`${productEditor.name || "Producto"} ${index + 1}`} /> : null}
                      </span>
                      <button className="commerce-board-image-remove" type="button" onClick={() => removeExistingProductImage(image.id)} aria-label={`Quitar foto actual ${index + 1}`} title="Quitar foto">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {pendingImages.length ? (
              <div className="commerce-board-image-group">
                <strong>Fotos nuevas</strong>
                <div className="commerce-board-image-strip">
                  {pendingImages.map((image, index) => (
                    <div key={image.id} className="commerce-board-image-card is-pending">
                      <span className="commerce-board-image-chip">
                        {image.previewUrl ? <img src={image.previewUrl} alt={`${image.name || productEditor.name || "Nueva foto"} ${index + 1}`} /> : null}
                      </span>
                      <button className="commerce-board-image-remove" type="button" onClick={() => removePendingProductImage(image.id)} aria-label={`Quitar foto nueva ${index + 1}`} title="Quitar foto">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {!totalImages ? <small className="commerce-board-note">Agrega al menos una foto para guardar el producto.</small> : null}
            {totalImages > COMMERCE_PRODUCT_MAX_IMAGES ? <small className="commerce-board-note">El producto solo puede tener hasta {COMMERCE_PRODUCT_MAX_IMAGES} fotos.</small> : null}
            {productEditor.id ? <small className="commerce-board-note">Puedes agregar fotos nuevas o eliminar las que ya no quieras mostrar.</small> : null}
            {productEditorError ? (
              <div className="notice notice-danger commerce-editor-error">
                <span>{productEditorError}</span>
              </div>
            ) : null}
            <label className="switch-row commerce-product-visible-toggle">
              <input type="checkbox" checked={productEditor.visible !== false} onChange={(event) => setProductEditor((current) => ({ ...current, visible: event.target.checked }))} />
              <span>{productEditor.visible !== false ? "Producto visible" : "Producto oculto"}</span>
            </label>
            <label className="switch-row commerce-product-visible-toggle">
              <input type="checkbox" checked={Boolean(productEditor.featuredInDorika)} onChange={(event) => setProductEditor((current) => ({ ...current, featuredInDorika: event.target.checked }))} />
              <span>{productEditor.featuredInDorika ? "Destacado en Dorika" : "Destacar en Dorika"}</span>
            </label>
          </div>
          <div className="commerce-modal-actions">
            <button className="btn btn-secondary" type="button" onClick={closeProductEditor}>Cancelar</button>
            <button className="btn btn-primary" type="button" onClick={async () => {
              const validationMessage = !String(productEditor.name || "").trim()
                ? "Agrega el nombre del producto."
                : String(productEditor.name || "").trim().length < 2
                  ? "El nombre debe tener al menos 2 caracteres."
                  : priceIsRequired && (!String(productEditor.price ?? "").trim() || !Number.isFinite(Number(productEditor.price)) || Number(productEditor.price) <= 0)
                    ? "Agrega un precio válido mayor a cero."
                    : String(productEditor.price ?? "").trim() && (!Number.isFinite(Number(productEditor.price)) || Number(productEditor.price) < 0)
                      ? "El precio debe ser un número válido."
                  : !totalImages
                    ? "Agrega al menos una foto del producto."
                    : totalImages > COMMERCE_PRODUCT_MAX_IMAGES
                      ? `Deja máximo ${COMMERCE_PRODUCT_MAX_IMAGES} fotos en este producto.`
                      : "";

              if (validationMessage) {
                setProductEditorError(validationMessage);
                return;
              }

              const { pendingImages: nextPendingImages, images, ...payload } = productEditor;
              const result = await runAction("save_product", payload, (nextPendingImages || []).map((entry) => entry.file));
              if (result) closeProductEditor();
            }} disabled={!canEdit || loading || !productEditorIsValid}>
              <Save size={16} /> {loading ? "Guardando..." : "Guardar producto"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!active) return null;

  return (
    <section className={`dashboard-section panel workspace-panel commerce-workspace commerce-board-workspace ${mobileView === "section" ? "is-section-view" : "is-categories-view"} ${sectionMode === "products" ? "is-products-mode" : "is-subcategories-mode"}`}>
      {renderModuleHeader()}

      {message ? <div className="notice"><span>{message}</span></div> : null}
      {error ? <div className="notice notice-danger"><span>{error}</span></div> : null}

      {loading && !state ? (
        <div className="kpi"><LoaderCircle size={18} className="spin" /> Cargando módulo comercial...</div>
      ) : (
        <div className="commerce-board-layout">
          {renderCategoriesPanel()}
          {renderMiddlePanel()}
          {renderSupportPanel()}
        </div>
      )}

      {renderProductEditor()}
    </section>
  );
}
