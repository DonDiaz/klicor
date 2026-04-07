"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
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

const LEVELS = [
  ["config", "Nivel 1", "Configuración", "Modo, WhatsApp y link público"],
  ["structure", "Nivel 2", "Estructura", "Categorías, subcategorías y orden"],
  ["products", "Nivel 3", "Productos", "Productos de una sección"],
];

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

function directProducts(category) {
  return Array.isArray(category?.products) ? category.products : [];
}

function sectionProducts(category, subcategory) {
  if (!category) return [];
  return subcategory ? (Array.isArray(subcategory.products) ? subcategory.products : []) : directProducts(category);
}

function modeCopy(mode) {
  if (mode === "mitienda") return "Vende productos y recibe pedidos por WhatsApp.";
  if (mode === "mimenu") return "Organiza platos, bebidas o combos para pedidos rápidos.";
  if (mode === "micatalogo") return "Muestra productos y recibe consultas sin carrito.";
  return "Elige cómo quieres presentar tu negocio.";
}

function moduleCopy(mode) {
  if (mode === "mitienda") return "Tu tienda permite organizar productos por categorías y recibir pedidos por WhatsApp.";
  if (mode === "mimenu") return "Tu menú permite ordenar platos, bebidas o combos para que el cliente pida con claridad.";
  if (mode === "micatalogo") return "Tu catálogo permite mostrar referencias y abrir conversaciones comerciales por WhatsApp.";
  return "Configura un modo comercial para activar tu experiencia pública.";
}

function ProductRow({ product, sectionLabel, disabled, onEdit, onToggleVisibility, onMove, onDelete }) {
  const visible = product.visible !== false;

  return (
    <article className={`commerce-admin-product-row ${visible ? "" : "is-hidden"}`.trim()}>
      <div className="commerce-admin-product-thumb">
        {product.imageThumbUrl || product.imageUrl ? (
          <img src={product.imageThumbUrl || product.imageUrl} alt={product.name} />
        ) : (
          <span>{product.name?.slice(0, 1) || "P"}</span>
        )}
        {!visible ? <span className="commerce-hidden-badge">Oculto</span> : null}
      </div>
      <div className="commerce-admin-product-copy">
        <div className="commerce-admin-product-title-row">
          <strong>{product.name}</strong>
          <span className={`commerce-visibility-pill ${visible ? "is-visible" : "is-hidden"}`}>
            {visible ? "Visible" : "Oculto"}
          </span>
        </div>
        <div className="commerce-admin-product-meta">
          <span>{money(product.price)}</span>
          <span>{sectionLabel}</span>
        </div>
      </div>
      <div className="commerce-admin-product-actions" aria-label={`Acciones de ${product.name}`}>
        <button type="button" onClick={() => onMove(product.id, "up")} disabled={disabled} title="Mover arriba">
          <ChevronUp size={16} />
        </button>
        <button type="button" onClick={() => onMove(product.id, "down")} disabled={disabled} title="Mover abajo">
          <ChevronDown size={16} />
        </button>
        <button type="button" onClick={() => onToggleVisibility(product.id, !visible)} disabled={disabled} title={visible ? "Ocultar producto" : "Mostrar producto"}>
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button type="button" onClick={() => onEdit(product)} disabled={disabled} title="Editar producto">
          <Pencil size={16} />
        </button>
        <button type="button" onClick={() => onDelete(product.id)} disabled={disabled} title="Eliminar producto">
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

export function CommerceWorkspace({ token, profile, active = false, canEdit = true }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [level, setLevel] = useState("config");
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

  const categories = useMemo(() => (
    Array.isArray(state?.categories) ? state.categories : []
  ), [state?.categories]);
  const modeMeta = resolveCommerceModeMeta(configForm.activeMode);
  const savedActiveMode = state?.config?.activeMode || "";
  const savedModeMeta = resolveCommerceModeMeta(savedActiveMode || configForm.activeMode);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) || null;
  const selectedSubcategories = subcats(selectedCategory);
  const selectedSubcategoryId = selectedCategory ? selectedSubcategoryIds[selectedCategory.id] || "" : "";
  const selectedSubcategory = selectedSubcategories.find((subcategory) => subcategory.id === selectedSubcategoryId) || null;
  const selectedCategoryUsesSubcategories = Boolean(selectedSubcategories.length || selectedCategory?.hasSubcategories);
  const selectedProducts = selectedCategoryUsesSubcategories
    ? sectionProducts(selectedCategory, selectedSubcategory)
    : sectionProducts(selectedCategory, null);
  const visibleProducts = selectedProducts.filter((product) => product.visible !== false).length;
  const hiddenProducts = selectedProducts.length - visibleProducts;
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
    if (!active || !token) return;
    setLoading(true);
    apiFetch("/api/commerce", { token })
      .then((response) => {
        setState(response.state);
        setConfigForm({
          activeMode: response.state.config.activeMode || "",
          orderWhatsapp: response.state.config.orderWhatsapp || "",
          currency: response.state.config.currency || "COP",
        });
      })
      .catch((nextError) => setError(nextError.message))
      .finally(() => setLoading(false));
  }, [active, token]);

  useEffect(() => {
    if (!categories.length) {
      setSelectedCategoryId("");
      setSelectedSubcategoryIds({});
      if (level === "products") setLevel("structure");
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
          : options[0].id;
      });
      return next;
    });
  }, [categories, level]);

  async function runAction(action, payload = {}, image = null) {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const body = new FormData();
      body.append("action", action);
      body.append("payload", JSON.stringify(payload));
      if (image) body.append("image", image);
      const response = await apiFetch("/api/commerce", {
        method: "POST",
        token,
        body,
        isFormData: true,
      });
      const nextState = response.state;
      setState(nextState);
      setConfigForm({
        activeMode: nextState.config.activeMode || "",
        orderWhatsapp: nextState.config.orderWhatsapp || "",
        currency: nextState.config.currency || "COP",
      });
      setMessage("Cambios guardados.");

      if (action === "create_category") {
        const created = [...(nextState.categories || [])].reverse().find((category) => cleanName(category.name) === cleanName(payload.name));
        if (created) setSelectedCategoryId(created.id);
      }
      if (action === "create_subcategory") {
        const parent = (nextState.categories || []).find((category) => category.id === payload.categoryId);
        const created = [...subcats(parent)].reverse().find((subcategory) => cleanName(subcategory.name) === cleanName(payload.name));
        if (created) {
          setSelectedCategoryId(payload.categoryId);
          setSelectedSubcategoryIds((current) => ({ ...current, [payload.categoryId]: created.id }));
        }
      }
      return nextState;
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
    const nextState = await runAction("create_category", { name });
    if (nextState) setNewCategoryName("");
  }

  async function createSubcategory(categoryId) {
    const name = String(subcategoryDrafts[categoryId] || "").trim();
    if (!name) return;
    const nextState = await runAction("create_subcategory", { categoryId, name });
    if (nextState) setSubcategoryDrafts((current) => ({ ...current, [categoryId]: "" }));
  }

  function openProducts(category, subcategory = null) {
    if (!category) return;
    setSelectedCategoryId(category.id);
    if (subcategory) {
      setSelectedSubcategoryIds((current) => ({ ...current, [category.id]: subcategory.id }));
    } else if (subcats(category).length && !selectedSubcategoryIds[category.id]) {
      setSelectedSubcategoryIds((current) => ({ ...current, [category.id]: subcats(category)[0].id }));
    }
    setLevel("products");
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
      imageFile: null,
      id: product?.id || "",
    });
  }

  function renderConfigLevel() {
    return (
      <section className="commerce-level-panel">
        <div className="commerce-level-head">
          <div>
            <span className="commerce-level-kicker">Nivel 1</span>
            <h3>Configuración comercial</h3>
            <p>Define cómo funciona tu tienda, menú o catálogo antes de organizar contenido.</p>
          </div>
          <span className="status-badge">{configForm.activeMode ? modeMeta.label : "Sin activar"}</span>
        </div>

        <div className="commerce-config-stack">
          <article className="commerce-admin-card commerce-config-card">
            <div className="commerce-admin-inline-head">
              <div>
                <strong>Modo activo</strong>
                <small>Elige la experiencia pública que verá tu cliente.</small>
              </div>
            </div>
            <div className="commerce-mode-options" role="radiogroup" aria-label="Modo comercial">
              {COMMERCE_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`commerce-mode-option ${configForm.activeMode === option.value ? "is-active" : ""}`.trim()}
                  type="button"
                  role="radio"
                  aria-checked={configForm.activeMode === option.value}
                  onClick={() => setConfigForm((current) => ({ ...current, activeMode: option.value }))}
                  disabled={!canEdit}
                >
                  <strong>{option.label}</strong>
                  <span>{modeCopy(option.value)}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="commerce-admin-card">
            <label className="label" htmlFor="commerce-whatsapp">WhatsApp para pedidos o consultas</label>
            <input
              id="commerce-whatsapp"
              className="input"
              value={configForm.orderWhatsapp}
              onChange={(event) => setConfigForm((current) => ({ ...current, orderWhatsapp: event.target.value }))}
              placeholder="573001234567"
              disabled={!canEdit}
            />
            <small className="muted">Tus clientes escribirán a este número desde la página pública.</small>
          </article>

          <article className="commerce-admin-card commerce-public-link-card">
            <div className="commerce-admin-inline-head">
              <div>
                <strong>Link público</strong>
                <small>{commercePublicUrl ? `Activo como ${savedModeMeta.label}.` : "Guarda el modo comercial y define tu usuario para generar el link."}</small>
              </div>
              {savedActiveMode ? <span className="status-badge success">{savedModeMeta.label}</span> : null}
            </div>
            <div className="commerce-public-link-actions">
              <code>{commercePublicUrl || "Aún no hay link comercial activo"}</code>
              <div className="actions">
                <button className="btn btn-secondary" type="button" onClick={copyCommerceUrl} disabled={!commercePublicUrl}>
                  <Copy size={16} /> Copiar
                </button>
                <button className="btn btn-secondary" type="button" onClick={openCommerceUrl} disabled={!commercePublicUrl}>
                  <ExternalLink size={16} /> Abrir
                </button>
              </div>
            </div>
          </article>

          <article className="commerce-admin-card commerce-config-summary">
            <strong>Resumen del módulo</strong>
            <p>{moduleCopy(configForm.activeMode)}</p>
            <div className="commerce-config-summary-grid">
              <span>{configForm.activeMode ? modeMeta.label : "Modo pendiente"}</span>
              <span>{configForm.orderWhatsapp ? "WhatsApp configurado" : "WhatsApp pendiente"}</span>
              <span>{commercePublicUrl ? "Link público activo" : "Link pendiente"}</span>
            </div>
          </article>
        </div>

        <div className="commerce-primary-footer">
          <button className="btn btn-primary commerce-primary-action" type="button" onClick={() => runAction("save_config", configForm)} disabled={!canEdit || loading}>
            <Store size={16} /> Guardar configuración
          </button>
        </div>
      </section>
    );
  }

  function renderCategoryBlock(category, index) {
    const options = subcats(category);
    const direct = directProducts(category);
    const selected = selectedCategoryId === category.id;
    const editingCategory = editingCategoryId === category.id;
    const usesSubcategories = Boolean(options.length || category.hasSubcategories);
    const canCreateSubcategory = !direct.length;

    return (
      <article key={category.id} className={`commerce-category-block ${selected ? "is-active" : ""} ${editingCategory ? "is-editing" : ""}`.trim()}>
        <div className="commerce-category-block-main">
          {editingCategory ? (
            <div className="commerce-inline-edit">
              <input className="input" value={editingCategoryName} onChange={(event) => setEditingCategoryName(event.target.value)} placeholder="Nombre de la categoría" disabled={!canEdit} />
              <button className="btn btn-primary" type="button" onClick={async () => {
                const nextState = await runAction("update_category", { id: category.id, name: editingCategoryName });
                if (nextState) setEditingCategoryId("");
              }} disabled={!canEdit || !editingCategoryName.trim() || loading}>
                Guardar
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setEditingCategoryId("")}>Cancelar</button>
            </div>
          ) : (
            <button className="commerce-category-select" type="button" onClick={() => setSelectedCategoryId(category.id)} aria-pressed={selected}>
              <span className="commerce-category-order">{index + 1}</span>
              <span>
                <span className="commerce-editing-label">{usesSubcategories ? "Usa subcategorías" : "Sin subcategorías"}</span>
                <strong>{category.name}</strong>
                <small>{countLabel(category.productCount, "producto", "productos")} · {countLabel(category.subcategoryCount, "subcategoría", "subcategorías")}</small>
              </span>
            </button>
          )}

          <div className="commerce-inline-actions" aria-label={`Acciones de ${category.name}`}>
            <button type="button" onClick={() => runAction("move_category", { categoryId: category.id, direction: "up" })} disabled={!canEdit || loading} title="Mover arriba"><ChevronUp size={16} /></button>
            <button type="button" onClick={() => runAction("move_category", { categoryId: category.id, direction: "down" })} disabled={!canEdit || loading} title="Mover abajo"><ChevronDown size={16} /></button>
            <button type="button" onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.name); }} disabled={!canEdit || loading} title="Editar categoría"><Pencil size={16} /></button>
            <button type="button" onClick={() => confirmAction("¿Eliminar esta categoría? Solo se puede eliminar si está vacía.", () => runAction("delete_category", { categoryId: category.id }))} disabled={!canEdit || loading} title="Eliminar categoría"><Trash2 size={16} /></button>
          </div>
        </div>

        {selected ? (
          <div className="commerce-category-detail">
            <div className="commerce-category-decision">
              <div>
                <strong>{usesSubcategories ? "Subcategorías de esta categoría" : "Decide cómo organizar esta categoría"}</strong>
                <small>{usesSubcategories ? "Los productos deben crearse dentro de una subcategoría." : "Puedes agregar productos directamente o crear subcategorías primero."}</small>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => openProducts(category)} disabled={!configForm.activeMode}>
                Gestionar productos
              </button>
            </div>

            <div className="commerce-structure-create-row">
              <input
                className="input"
                value={subcategoryDrafts[category.id] || ""}
                onChange={(event) => setSubcategoryDrafts((current) => ({ ...current, [category.id]: event.target.value }))}
                placeholder="Nombre de la subcategoría"
                disabled={!canEdit || !canCreateSubcategory}
              />
              <button className="btn btn-primary" type="button" onClick={() => createSubcategory(category.id)} disabled={!canEdit || !canCreateSubcategory || !String(subcategoryDrafts[category.id] || "").trim() || loading}>
                <Plus size={16} /> Crear subcategoría
              </button>
            </div>
            {!canCreateSubcategory ? <small className="muted">Esta categoría ya tiene productos directos. Si necesitas subcategorías, primero mueve o elimina esos productos.</small> : null}

            {options.length ? (
              <div className="commerce-subcategory-stack">
                {options.map((subcategory, subIndex) => {
                  const editingSubcategory = editingSubcategoryId === subcategory.id;
                  return (
                    <div key={subcategory.id} className={`commerce-subcategory-row ${selectedSubcategoryId === subcategory.id ? "is-active" : ""} ${editingSubcategory ? "is-editing" : ""}`.trim()}>
                      {editingSubcategory ? (
                        <div className="commerce-inline-edit commerce-subcategory-edit">
                          <input className="input" value={editingSubcategoryName} onChange={(event) => setEditingSubcategoryName(event.target.value)} placeholder="Nombre de la subcategoría" disabled={!canEdit} />
                          <button className="btn btn-primary" type="button" onClick={async () => {
                            const nextState = await runAction("update_subcategory", { id: subcategory.id, categoryId: category.id, name: editingSubcategoryName });
                            if (nextState) setEditingSubcategoryId("");
                          }} disabled={!canEdit || !editingSubcategoryName.trim() || loading}>
                            Guardar
                          </button>
                          <button className="btn btn-secondary" type="button" onClick={() => setEditingSubcategoryId("")}>Cancelar</button>
                        </div>
                      ) : (
                        <>
                          <button className="commerce-subcategory-select" type="button" onClick={() => setSelectedSubcategoryIds((current) => ({ ...current, [category.id]: subcategory.id }))}>
                            <span>{subIndex + 1}</span>
                            <strong>{subcategory.name}</strong>
                            <small>{countLabel(subcategory.productCount, "producto", "productos")}</small>
                          </button>
                          <div className="commerce-inline-actions" aria-label={`Acciones de ${subcategory.name}`}>
                            <button type="button" onClick={() => runAction("move_subcategory", { subcategoryId: subcategory.id, direction: "up" })} disabled={!canEdit || loading} title="Mover arriba"><ChevronUp size={16} /></button>
                            <button type="button" onClick={() => runAction("move_subcategory", { subcategoryId: subcategory.id, direction: "down" })} disabled={!canEdit || loading} title="Mover abajo"><ChevronDown size={16} /></button>
                            <button type="button" onClick={() => { setEditingSubcategoryId(subcategory.id); setEditingSubcategoryName(subcategory.name); }} disabled={!canEdit || loading} title="Editar subcategoría"><Pencil size={16} /></button>
                            <button type="button" onClick={() => confirmAction("¿Eliminar esta subcategoría? Solo se puede eliminar si está vacía.", () => runAction("delete_subcategory", { subcategoryId: subcategory.id }))} disabled={!canEdit || loading} title="Eliminar subcategoría"><Trash2 size={16} /></button>
                            <button className="commerce-text-action" type="button" onClick={() => openProducts(category, subcategory)} disabled={!configForm.activeMode}>Productos</button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  }

  function renderStructureLevel() {
    return (
      <section className="commerce-level-panel">
        <div className="commerce-level-head">
          <div>
            <span className="commerce-level-kicker">Nivel 2</span>
            <h3>Estructura comercial</h3>
            <p>Organiza las categorías y subcategorías que verán tus clientes. Aquí no se editan productos.</p>
          </div>
        </div>

        <div className="commerce-admin-kpis commerce-structure-kpis">
          <div><span>{countLabel(state?.summary?.categoriesCount, "categoría", "categorías")}</span></div>
          <div><span>{countLabel(state?.summary?.subcategoriesCount, "subcategoría", "subcategorías")}</span></div>
          <div><span>{countLabel(state?.summary?.productsCount, "producto", "productos")}</span></div>
          <div><span>{countLabel(state?.summary?.visibleProductsCount, "visible", "visibles")}</span></div>
        </div>

        <article className="commerce-admin-card commerce-create-category-card">
          <div>
            <strong>Crear categoría</strong>
            <small>Empieza por una sección clara del negocio: Bebidas, Combos, Servicios o Novedades.</small>
          </div>
          <div className="commerce-structure-create-row">
            <input className="input" value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Nombre de la categoría" disabled={!canEdit} />
            <button className="btn btn-primary" type="button" onClick={createCategory} disabled={!canEdit || !newCategoryName.trim() || loading}>
              <Plus size={16} /> Crear categoría
            </button>
          </div>
        </article>

        {categories.length ? (
          <div className="commerce-category-block-list">
            {categories.map(renderCategoryBlock)}
          </div>
        ) : (
          <div className="commerce-empty-state commerce-admin-empty-state">
            <strong>Aún no has creado categorías.</strong>
            <p>Crea la primera categoría para empezar a organizar tu tienda, menú o catálogo.</p>
          </div>
        )}
      </section>
    );
  }

  function renderProductsLevel() {
    const contextReady = Boolean(selectedCategory && (!selectedCategoryUsesSubcategories || selectedSubcategory));
    const productSectionLabel = selectedSubcategory ? `${selectedCategory?.name || ""} · ${selectedSubcategory.name}` : selectedCategory?.name || "Categoría";

    return (
      <section className="commerce-level-panel">
        <div className="commerce-level-head commerce-products-head">
          <div>
            <span className="commerce-level-kicker">Nivel 3</span>
            <h3>{selectedSubcategory ? `Productos de ${selectedSubcategory.name}` : selectedCategory ? `Productos de ${selectedCategory.name}` : "Productos"}</h3>
            <p>{selectedCategory ? "Gestiona solo los productos de esta sección. El árbol completo queda en Estructura." : "Elige una categoría desde Estructura para trabajar sus productos."}</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => setLevel("structure")}>Volver a estructura</button>
        </div>

        {!selectedCategory ? (
          <div className="commerce-empty-state commerce-admin-empty-state">
            <strong>No hay una categoría seleccionada.</strong>
            <p>Vuelve a Estructura y elige dónde quieres crear productos.</p>
          </div>
        ) : (
          <>
            <article className="commerce-product-context-card">
              <div>
                <span>Categoría</span>
                <strong>{selectedCategory.name}</strong>
              </div>
              <div>
                <span>{selectedSubcategory ? "Subcategoría" : "Organización"}</span>
                <strong>{selectedSubcategory ? selectedSubcategory.name : selectedCategoryUsesSubcategories ? "Usa subcategorías" : "Productos directos"}</strong>
              </div>
            </article>

            {selectedSubcategories.length ? (
              <div className="commerce-product-subcategory-picker">
                <span>Subcategorías de esta categoría</span>
                <div>
                  {selectedSubcategories.map((subcategory) => (
                    <button key={subcategory.id} className={`commerce-admin-chip ${selectedSubcategoryId === subcategory.id ? "is-active" : ""}`.trim()} type="button" onClick={() => setSelectedSubcategoryIds((current) => ({ ...current, [selectedCategory.id]: subcategory.id }))}>
                      <span>{subcategory.name}</span>
                      <small>{countLabel(subcategory.productCount, "producto", "productos")}</small>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="commerce-products-toolbar">
              <div className="commerce-products-summary">
                <span>{countLabel(selectedProducts.length, "producto", "productos")}</span>
                <span>{countLabel(visibleProducts, "visible", "visibles")}</span>
                <span>{countLabel(hiddenProducts, "oculto", "ocultos")}</span>
              </div>
              <button className="btn btn-primary commerce-primary-action" type="button" onClick={() => openProductEditor(selectedCategory, selectedSubcategory)} disabled={!canEdit || loading || !configForm.activeMode || !contextReady}>
                <ImagePlus size={16} /> Agregar producto
              </button>
            </div>

            {!contextReady ? (
              <div className="notice"><span>Selecciona una subcategoría para agregar productos dentro de esta categoría.</span></div>
            ) : selectedProducts.length ? (
              <div className="commerce-admin-product-list">
                {selectedProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    sectionLabel={productSectionLabel}
                    disabled={!canEdit || loading}
                    onEdit={(nextProduct) => openProductEditor(selectedCategory, selectedSubcategory, nextProduct)}
                    onToggleVisibility={(productId, visible) => runAction("toggle_product_visibility", { productId, visible })}
                    onMove={(productId, direction) => runAction("move_product", { productId, direction })}
                    onDelete={(productId) => confirmAction("¿Eliminar este producto?", () => runAction("delete_product", { productId }))}
                  />
                ))}
              </div>
            ) : (
              <div className="commerce-empty-state commerce-admin-empty-state">
                <strong>Esta sección aún no tiene productos.</strong>
                <p>Agrega el primer producto para empezar a llenar esta categoría.</p>
              </div>
            )}
          </>
        )}
      </section>
    );
  }

  if (!active) return null;

  const editorCategory = productEditor ? categories.find((category) => category.id === productEditor.categoryId) : null;
  const editorSubcategory = editorCategory ? subcats(editorCategory).find((subcategory) => subcategory.id === productEditor.subcategoryId) : null;

  return (
    <section className="dashboard-section panel workspace-panel commerce-workspace">
      <div className="dashboard-section-head workspace-panel-head commerce-workspace-head">
        <div>
          <h2 className="section-title" style={{ fontSize: "1.35rem" }}>Presencia comercial</h2>
          <p className="section-copy">Configura, organiza y administra tu experiencia comercial sin mezclar todo en una sola pantalla.</p>
        </div>
        <span className="status-badge">{configForm.activeMode ? modeMeta.label : "Sin activar"}</span>
      </div>

      {message ? <div className="notice"><span>{message}</span></div> : null}
      {error ? <div className="notice notice-danger"><span>{error}</span></div> : null}

      {loading && !state ? (
        <div className="kpi"><LoaderCircle size={18} className="spin" /> Cargando módulo comercial...</div>
      ) : (
        <div className="commerce-admin-flow">
          <nav className="commerce-level-nav" aria-label="Niveles del módulo comercial">
            {LEVELS.map(([id, eyebrow, label, helper]) => (
              <button
                key={id}
                className={`commerce-level-tab ${level === id ? "is-active" : ""}`.trim()}
                type="button"
                onClick={() => setLevel(id)}
                disabled={id === "products" && !categories.length}
              >
                <span>{eyebrow}</span>
                <strong>{label}</strong>
                <small>{helper}</small>
              </button>
            ))}
          </nav>

          {level === "config" ? renderConfigLevel() : null}
          {level === "structure" ? renderStructureLevel() : null}
          {level === "products" ? renderProductsLevel() : null}
        </div>
      )}

      {productEditor ? (
        <div className="commerce-modal-backdrop" role="dialog" aria-modal="true" aria-label="Editor de producto">
          <div className="commerce-modal-card commerce-admin-modal">
            <button className="commerce-modal-close" type="button" onClick={() => setProductEditor(null)}>
              <X size={16} />
            </button>
            <div className="commerce-modal-head">
              <strong>{productEditor.id ? "Editar producto" : "Agregar producto"}</strong>
              <span>{modeMeta.label}</span>
            </div>
            <div className="commerce-editor-context">
              <span>Se guardará en</span>
              <strong>{editorSubcategory ? `${editorCategory?.name || "Categoría"} · ${editorSubcategory.name}` : editorCategory?.name || "Categoría seleccionada"}</strong>
            </div>
            <div className="section-stack">
              <input className="input" placeholder="Nombre del producto" value={productEditor.name} onChange={(event) => setProductEditor((current) => ({ ...current, name: event.target.value }))} />
              <textarea className="textarea" rows={3} placeholder="Descripción del producto" value={productEditor.description || ""} onChange={(event) => setProductEditor((current) => ({ ...current, description: event.target.value }))} />
              <input className="input" placeholder={configForm.activeMode === "micatalogo" ? "Precio opcional" : "Precio"} value={productEditor.price ?? ""} onChange={(event) => setProductEditor((current) => ({ ...current, price: event.target.value }))} />
              <label className="upload-card">
                <input className="upload-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setProductEditor((current) => ({ ...current, imageFile: event.target.files?.[0] || null }))} />
                <span>{productEditor.imageFile ? productEditor.imageFile.name : productEditor.id ? "Cambiar imagen del producto" : "Subir imagen del producto"}</span>
              </label>
              <label className="switch-row commerce-product-visible-toggle">
                <input type="checkbox" checked={productEditor.visible !== false} onChange={(event) => setProductEditor((current) => ({ ...current, visible: event.target.checked }))} />
                <span>{productEditor.visible !== false ? "Producto visible" : "Producto oculto"}</span>
              </label>
            </div>
            <div className="commerce-modal-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setProductEditor(null)}>Cancelar</button>
              <button className="btn btn-primary" type="button" onClick={async () => {
                const nextState = await runAction("save_product", productEditor, productEditor.imageFile || null);
                if (nextState) setProductEditor(null);
              }} disabled={!canEdit || loading || !productEditor.name.trim()}>
                <Save size={16} /> Guardar producto
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
