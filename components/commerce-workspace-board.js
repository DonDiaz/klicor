"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
  Store,
  Trash2,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { COMMERCE_MODE_OPTIONS, resolveCommerceModeMeta } from "@/lib/commerce-config";

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

function ProductRow({ product, sectionLabel, disabled, onEdit, onToggleVisibility, onDelete }) {
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
          <span className={`commerce-board-status ${visible ? "is-visible" : "is-hidden"}`}>
            {visible ? "Visible" : "Oculto"}
          </span>
        </div>
      </div>
      <div className="commerce-board-product-actions">
        <button type="button" onClick={() => onEdit(product)} disabled={disabled} title="Editar producto">
          <Pencil size={15} />
        </button>
        <button type="button" onClick={() => onToggleVisibility(product.id, !visible)} disabled={disabled} title={visible ? "Ocultar producto" : "Mostrar producto"}>
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button type="button" onClick={() => onDelete(product.id)} disabled={disabled} title="Eliminar producto">
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
  const [subcategoryDrafts, setSubcategoryDrafts] = useState({});
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState({});
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingSubcategoryId, setEditingSubcategoryId] = useState("");
  const [editingSubcategoryName, setEditingSubcategoryName] = useState("");
  const [productEditor, setProductEditor] = useState(null);
  const [sectionCache, setSectionCache] = useState({});
  const sectionCacheRef = useRef({});
  const sectionRequestRef = useRef(0);

  const categories = useMemo(() => (
    Array.isArray(state?.categories) ? state.categories : []
  ), [state?.categories]);
  const modeMeta = resolveCommerceModeMeta(configForm.activeMode);
  const savedActiveMode = state?.config?.activeMode || "";
  const savedModeMeta = resolveCommerceModeMeta(savedActiveMode || configForm.activeMode);
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

  async function runAction(action, payload = {}, image = null) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const body = new FormData();
      body.append("action", action);
      body.append("payload", JSON.stringify(payload));
      if (Array.isArray(image)) {
        image.filter(Boolean).forEach((file) => body.append("images", file));
      } else if (image) {
        body.append("image", image);
      }

      const response = await apiFetch("/api/commerce", {
        method: "POST",
        token,
        body,
        isFormData: true,
      });

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

  async function createCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const result = await runAction("create_category", { name });
    if (result) setNewCategoryName("");
  }

  async function createSubcategory(categoryId) {
    const name = String(subcategoryDrafts[categoryId] || "").trim();
    if (!name) return;
    const result = await runAction("create_subcategory", { categoryId, name });
    if (result) {
      setSubcategoryDrafts((current) => ({ ...current, [categoryId]: "" }));
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
    setProductEditor({
      mode: configForm.activeMode,
      categoryId: product?.categoryId || category?.id || "",
      subcategoryId: product?.subcategoryId || subcategory?.id || "",
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price ?? "",
      visible: product?.visible !== false,
      images: Array.isArray(product?.images) ? product.images : [],
      imageFiles: [],
      id: product?.id || "",
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
              {COMMERCE_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>WhatsApp</span>
            <input className="input" value={configForm.orderWhatsapp} onChange={(event) => setConfigForm((current) => ({ ...current, orderWhatsapp: event.target.value }))} placeholder="573001234567" disabled={!canEdit} />
          </label>
          <button className="btn btn-secondary" type="button" onClick={() => runAction("save_config", configForm)} disabled={!canEdit || loading}>
            <Store size={15} /> Guardar
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
          <button className="btn btn-primary" type="button" onClick={createCategory} disabled={!canEdit || !newCategoryName.trim() || loading}>
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
                      <button className="btn btn-primary" type="button" onClick={async () => {
                        const result = await runAction("update_category", { id: category.id, name: editingCategoryName });
                        if (result) setEditingCategoryId("");
                      }} disabled={!canEdit || !editingCategoryName.trim() || loading}>
                        Guardar
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={() => setEditingCategoryId("")}>Cancelar</button>
                    </div>
                  ) : (
                    <>
                      <button className="commerce-board-row-main" type="button" onClick={() => selectCategory(category)} aria-pressed={selected}>
                        <span className="commerce-board-dot">{category.name?.slice(0, 1) || "C"}</span>
                        <span>
                          <strong>{category.name}</strong>
                          <small>{countLabel(category.productCount, "producto", "productos")} · {countLabel(category.subcategoryCount, "subcategoría", "subcategorías")}</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                      <div className="commerce-board-row-actions">
                        <button type="button" onClick={() => runAction("move_category", { categoryId: category.id, direction: "up" })} disabled={!canEdit || loading} title="Mover arriba"><ChevronUp size={15} /></button>
                        <button type="button" onClick={() => runAction("move_category", { categoryId: category.id, direction: "down" })} disabled={!canEdit || loading} title="Mover abajo"><ChevronDown size={15} /></button>
                        <button type="button" onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.name); }} disabled={!canEdit || loading} title="Editar categoría"><Pencil size={15} /></button>
                        <button type="button" onClick={() => confirmAction("¿Eliminar esta categoría? Solo se puede eliminar si está vacía.", () => runAction("delete_category", { categoryId: category.id }))} disabled={!canEdit || loading} title="Eliminar categoría"><Trash2 size={15} /></button>
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
    const productTargetSubcategory = selectedSubcategory || selectedSubcategories[0] || null;

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
          <button className="btn btn-secondary commerce-board-product-action" type="button" onClick={() => openProductEditor(selectedCategory, productTargetSubcategory)} disabled={!canEdit || loading || !configForm.activeMode || !productTargetSubcategory}>
            <ImagePlus size={16} /> Crear producto
          </button>
        </div>
        {selectedHasDirectProducts ? <small className="commerce-board-note">Esta categoría ya tiene productos directos.</small> : null}

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
                        const result = await runAction("update_subcategory", { id: subcategory.id, categoryId: selectedCategory.id, name: editingSubcategoryName });
                        if (result) setEditingSubcategoryId("");
                      }} disabled={!canEdit || !editingSubcategoryName.trim() || loading}>
                        Guardar
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={() => setEditingSubcategoryId("")}>Cancelar</button>
                    </div>
                  ) : (
                    <>
                      <button className="commerce-board-row-main" type="button" onClick={() => openSubcategory(selectedCategory, subcategory)}>
                        <span className="commerce-board-dot is-subcategory">{subcategory.name?.slice(0, 1) || "S"}</span>
                        <span>
                          <strong>{subcategory.name}</strong>
                          <small>{countLabel(subcategory.productCount, "producto", "productos")}</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                      <div className="commerce-board-row-actions">
                        <button type="button" onClick={() => runAction("move_subcategory", { subcategoryId: subcategory.id, direction: "up" })} disabled={!canEdit || loading} title="Mover arriba"><ChevronUp size={15} /></button>
                        <button type="button" onClick={() => runAction("move_subcategory", { subcategoryId: subcategory.id, direction: "down" })} disabled={!canEdit || loading} title="Mover abajo"><ChevronDown size={15} /></button>
                        <button type="button" onClick={() => { setEditingSubcategoryId(subcategory.id); setEditingSubcategoryName(subcategory.name); }} disabled={!canEdit || loading} title="Editar subcategoría"><Pencil size={15} /></button>
                        <button type="button" onClick={() => confirmAction("¿Eliminar esta subcategoría? Solo se puede eliminar si está vacía.", () => runAction("delete_subcategory", { subcategoryId: subcategory.id }))} disabled={!canEdit || loading} title="Eliminar subcategoría"><Trash2 size={15} /></button>
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
            <p>Agrega productos directamente o crea subcategorías primero.</p>
            <button className="btn btn-secondary" type="button" onClick={() => setSectionMode("products")}>
              Ver productos de esta categoría
            </button>
          </div>
        )}
      </section>
    );
  }

  function renderProductsPanel() {
    if (!selectedCategory) {
      return (
        <section className="commerce-board-panel commerce-board-section">
          <div className="commerce-board-empty">
            <strong>Selecciona una categoría</strong>
            <p>Elige dónde quieres agregar o editar productos.</p>
          </div>
        </section>
      );
    }

    const sectionLabel = selectedSubcategory ? `${selectedCategory.name} · ${selectedSubcategory.name}` : selectedCategory.name;
    const canAddProduct = Boolean(configForm.activeMode && selectedCategory && (!selectedSubcategories.length || selectedSubcategory));
    const selectedHasDirectProducts = directProductCount(selectedCategory) > 0;
    const handleBackFromProducts = () => {
      if (selectedSubcategory) {
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
      <section className="commerce-board-panel commerce-board-section" aria-label="Productos">
        <button className="commerce-board-back" type="button" onClick={handleBackFromProducts}>
          <ChevronLeft size={16} /> {selectedSubcategory ? "Categorías" : selectedSubcategories.length ? "Subcategorías" : "Categorías"}
        </button>
        <div className="commerce-board-panel-head">
          <div>
            <span>Productos</span>
            <h3>{selectedSubcategory ? selectedSubcategory.name : selectedCategory.name}</h3>
          </div>
          <strong>{countLabel(activeProducts.length, "producto", "productos")}</strong>
        </div>

        <div className="commerce-board-product-summary">
          <span>{countLabel(visibleProducts, "visible", "visibles")}</span>
          <span>{countLabel(hiddenProducts, "oculto", "ocultos")}</span>
          <span>{sectionLabel}</span>
        </div>

        {selectedSubcategory ? (
          <>
            <button className="commerce-board-return-categories" type="button" onClick={handleBackFromProducts}>
              <ChevronLeft size={16} /> Volver a categorías
            </button>
            <button className="btn btn-primary commerce-board-main-action commerce-board-product-action" type="button" onClick={() => openProductEditor(selectedCategory, selectedSubcategory)} disabled={!canEdit || loading || !canAddProduct}>
              <ImagePlus size={16} /> Crear producto
            </button>
          </>
        ) : (
          <>
            <div className="commerce-board-create commerce-board-create-with-product commerce-board-section-actions">
              <input
                className="input"
                value={subcategoryDrafts[selectedCategory.id] || ""}
                onChange={(event) => setSubcategoryDrafts((current) => ({ ...current, [selectedCategory.id]: event.target.value }))}
                placeholder="Nombre de la subcategoría"
                disabled={!canEdit || selectedHasDirectProducts}
              />
              <button className="btn btn-secondary commerce-board-subcategory-action" type="button" onClick={() => createSubcategory(selectedCategory.id)} disabled={!canEdit || selectedHasDirectProducts || !String(subcategoryDrafts[selectedCategory.id] || "").trim() || loading}>
                <Plus size={16} /> Crear subcategoría
              </button>
              <button className="btn btn-primary commerce-board-main-action commerce-board-product-action" type="button" onClick={() => openProductEditor(selectedCategory, selectedSubcategory)} disabled={!canEdit || loading || !canAddProduct}>
                <ImagePlus size={16} /> Crear producto
              </button>
            </div>
            {selectedHasDirectProducts ? <small className="commerce-board-note">Esta categoría ya tiene productos directos.</small> : null}
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
                disabled={!canEdit || loading}
                onEdit={(nextProduct) => openProductEditor(selectedCategory, selectedSubcategory, nextProduct)}
                onToggleVisibility={(productId, visible) => runAction("toggle_product_visibility", { productId, visible })}
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
    if (sectionMode === "subcategories" && selectedSubcategories.length) return renderSubcategoriesPanel();
    return renderProductsPanel();
  }

  function renderSupportPanel() {
    const previewProducts = activeProducts.slice(0, 3);

    return (
      <aside className="commerce-board-panel commerce-board-support" aria-label="Vista previa pública">
        <div className="commerce-board-panel-head">
          <div>
            <span>Bloque C</span>
            <h3>Vista pública</h3>
          </div>
        </div>

        <div className="commerce-board-public-link">
          <span>{savedActiveMode ? savedModeMeta.label : "Sin modo activo"}</span>
          <code>{commercePublicUrl || "Guarda el modo para generar el link"}</code>
          <div>
            <button type="button" onClick={copyCommerceUrl} disabled={!commercePublicUrl}>
              <Copy size={14} /> Copiar
            </button>
            <button type="button" onClick={openCommerceUrl} disabled={!commercePublicUrl}>
              <ExternalLink size={14} /> Abrir
            </button>
          </div>
        </div>

        <div className="commerce-mini-preview">
          <div className="commerce-mini-preview-head">
            <span>{profile?.businessName || "Klicor"}</span>
            <strong>{savedModeMeta.label}</strong>
          </div>
          <div className="commerce-mini-preview-rail">
            {categories.slice(0, 3).map((category) => (
              <span key={category.id} className={category.id === selectedCategoryId ? "is-active" : ""}>{category.name}</span>
            ))}
          </div>
          <div className="commerce-mini-preview-list">
            {sectionLoading && !previewProducts.length ? (
              <p>Cargando vista previa...</p>
            ) : previewProducts.length ? previewProducts.map((product) => (
              <div key={product.id} className={product.visible === false ? "is-hidden" : ""}>
                <span>{product.imageThumbUrl || product.imageUrl ? <img src={product.imageThumbUrl || product.imageUrl} alt="" /> : product.name?.slice(0, 1)}</span>
                <strong>{product.name}</strong>
                <small>{money(product.price)}</small>
              </div>
            )) : (
              <p>Selecciona una sección con productos para previsualizarla aquí.</p>
            )}
          </div>
        </div>
      </aside>
    );
  }

  function renderProductEditor() {
    if (!productEditor) return null;
    const editorCategory = categories.find((category) => category.id === productEditor.categoryId) || null;
    const editorSubcategory = editorCategory ? subcats(editorCategory).find((subcategory) => subcategory.id === productEditor.subcategoryId) : null;

    return (
      <div className="commerce-modal-backdrop" role="dialog" aria-modal="true" aria-label="Editor de producto">
        <div className="commerce-modal-card commerce-board-editor-card">
          <button className="commerce-modal-close" type="button" onClick={() => setProductEditor(null)}>
            <X size={16} />
          </button>
          <div className="commerce-modal-head">
            <strong>{productEditor.id ? "Editar producto" : "Crear producto"}</strong>
            <span>{editorSubcategory ? `${editorCategory?.name || "Categoría"} · ${editorSubcategory.name}` : editorCategory?.name || "Categoría seleccionada"}</span>
          </div>

          <div className="commerce-board-editor-form">
            <input className="input" placeholder="Nombre del producto" value={productEditor.name} onChange={(event) => setProductEditor((current) => ({ ...current, name: event.target.value }))} />
            <input className="input" placeholder={configForm.activeMode === "micatalogo" ? "Precio opcional" : "Precio"} value={productEditor.price ?? ""} onChange={(event) => setProductEditor((current) => ({ ...current, price: event.target.value }))} />
            <textarea className="textarea" rows={4} placeholder="Descripción del producto" value={productEditor.description || ""} onChange={(event) => setProductEditor((current) => ({ ...current, description: event.target.value }))} />
            <label className="upload-card">
              <input
                className="upload-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => setProductEditor((current) => ({
                  ...current,
                  imageFiles: Array.from(event.target.files || []),
                }))}
              />
              <span>{productEditor.imageFiles?.length ? `${productEditor.imageFiles.length} imágenes seleccionadas` : productEditor.id ? "Reemplazar galería del producto" : "Subir imágenes del producto"}</span>
            </label>
            {productEditor.images?.length ? (
              <div className="commerce-board-image-strip">
                {productEditor.images.slice(0, 4).map((image) => (
                  <span key={image.id} className="commerce-board-image-chip">
                    {image.imageThumbUrl || image.imageUrl ? <img src={image.imageThumbUrl || image.imageUrl} alt="" /> : null}
                  </span>
                ))}
                {productEditor.images.length > 4 ? <small>+{productEditor.images.length - 4}</small> : null}
              </div>
            ) : null}
            {!productEditor.id && !productEditor.imageFiles?.length ? <small className="commerce-board-note">Agrega al menos una imagen para crear el producto.</small> : null}
            {productEditor.id ? <small className="commerce-board-note">Si subes nuevas imágenes, la galería actual se reemplaza completa.</small> : null}
            <label className="switch-row commerce-product-visible-toggle">
              <input type="checkbox" checked={productEditor.visible !== false} onChange={(event) => setProductEditor((current) => ({ ...current, visible: event.target.checked }))} />
              <span>{productEditor.visible !== false ? "Producto visible" : "Producto oculto"}</span>
            </label>
          </div>
          <div className="commerce-modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setProductEditor(null)}>Cancelar</button>
            <button className="btn btn-primary" type="button" onClick={async () => {
              const { imageFiles, images, ...payload } = productEditor;
              const result = await runAction("save_product", payload, imageFiles || []);
              if (result) setProductEditor(null);
            }} disabled={!canEdit || loading || !productEditor.name.trim() || (!productEditor.id && !productEditor.imageFiles?.length)}>
              <Save size={16} /> Guardar producto
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!active) return null;

  return (
    <section className={`dashboard-section panel workspace-panel commerce-workspace commerce-board-workspace ${mobileView === "section" ? "is-section-view" : "is-categories-view"}`}>
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
