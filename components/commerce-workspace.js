"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
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

function formatCount(value, label) {
  return `${value || 0} ${label}`;
}

function ProductRow({ product, mode, onEdit, onToggleVisibility, onMove, onDelete }) {
  return (
    <article className={`commerce-admin-product ${product.visible ? "" : "is-hidden"}`.trim()}>
      <div className="commerce-admin-product-media">
        <img src={product.imageThumbUrl || product.imageUrl} alt={product.name} />
        {!product.visible ? <span className="commerce-hidden-badge">Oculto</span> : null}
      </div>
      <div className="commerce-admin-product-copy">
        <strong>{product.name}</strong>
        {product.description ? <p>{product.description}</p> : null}
        <div className="commerce-admin-product-meta">
          {product.price !== null && product.price !== undefined ? <span>${Number(product.price || 0).toLocaleString("es-CO")}</span> : null}
          <span>{resolveCommerceModeMeta(mode).itemLabel}</span>
        </div>
      </div>
      <div className="commerce-admin-product-actions">
        <button type="button" onClick={() => onMove(product.id, "up")} title="Mover arriba"><ChevronUp size={16} /></button>
        <button type="button" onClick={() => onMove(product.id, "down")} title="Mover abajo"><ChevronDown size={16} /></button>
        <button type="button" onClick={() => onToggleVisibility(product.id, !product.visible)} title={product.visible ? "Ocultar" : "Mostrar"}>
          {product.visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button type="button" onClick={() => onEdit(product)} title="Editar"><Pencil size={16} /></button>
        <button type="button" onClick={() => onDelete(product.id)} title="Eliminar"><Trash2 size={16} /></button>
      </div>
    </article>
  );
}

function buildPreviewBootstrap(profile, state) {
  if (!state?.config?.activeMode) return null;
  const firstCategory = state.categories?.[0] || null;
  const firstSubcategory = firstCategory?.subcategories?.[0] || null;
  const initialProducts = firstCategory
    ? firstCategory.hasSubcategories
      ? (firstSubcategory?.products || [])
      : (firstCategory.products || [])
    : [];

  return {
    business: {
      uid: profile.uid,
      username: profile.username,
      usernameLower: profile.usernameLower || profile.username,
      businessName: profile.businessName,
      businessHeadline: profile.businessHeadline,
      businessSubheadline: profile.businessSubheadline,
      businessCategory: profile.businessCategory,
      photo: profile.photo,
      settings: profile.settings,
      profileLinks: profile.profileLinks || [],
    },
    config: state.config,
    mode: state.config.activeMode,
    modeMeta: resolveCommerceModeMeta(state.config.activeMode),
    supportsCart: state.config.activeMode !== "micatalogo",
    requiresPrice: state.config.activeMode !== "micatalogo",
    orderWhatsapp: state.config.orderWhatsapp,
    categories: state.categories || [],
    initialSelection: {
      categoryId: firstCategory?.id || "",
      subcategoryId: firstSubcategory?.id || "",
    },
    initialSubcategories: firstCategory?.subcategories || [],
    initialProducts,
    initialPagination: {
      hasMore: false,
      nextCursor: null,
    },
  };
}

export function CommerceWorkspace({ token, profile, active = false, canEdit = true, onPreviewDataChange }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [configForm, setConfigForm] = useState({ activeMode: "", orderWhatsapp: "", currency: "COP" });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [subcategoryDrafts, setSubcategoryDrafts] = useState({});
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [productEditor, setProductEditor] = useState(null);

  const categories = state?.categories || [];
  const modeMeta = resolveCommerceModeMeta(configForm.activeMode);

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
    if (!onPreviewDataChange) return;
    onPreviewDataChange(buildPreviewBootstrap(profile, state));
  }, [onPreviewDataChange, profile, state]);

  const flatCategoryOptions = useMemo(
    () => categories.map((category) => ({
      id: category.id,
      name: category.name,
      hasSubcategories: category.hasSubcategories,
      subcategories: category.subcategories || [],
    })),
    [categories],
  );

  async function runAction(action, payload = {}, image = null) {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const body = new FormData();
      body.append("action", action);
      body.append("payload", JSON.stringify(payload));
      if (image) {
        body.append("image", image);
      }
      const response = await apiFetch("/api/commerce", {
        method: "POST",
        token,
        body,
        isFormData: true,
      });
      setState(response.state);
      setConfigForm({
        activeMode: response.state.config.activeMode || "",
        orderWhatsapp: response.state.config.orderWhatsapp || "",
        currency: response.state.config.currency || "COP",
      });
      setMessage("Cambios guardados.");
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  if (!active) return null;

  return (
    <section className="dashboard-section panel workspace-panel commerce-workspace">
      <div className="dashboard-section-head workspace-panel-head">
        <div>
          <h2 className="section-title" style={{ fontSize: "1.35rem" }}>Presencia comercial</h2>
          <p className="section-copy">Activa un modo comercial y organiza categorías, subcategorías y productos sin cargar todo de una vez en la vista pública.</p>
        </div>
        <span className="status-badge">{configForm.activeMode ? modeMeta.label : "Sin activar"}</span>
      </div>

      {message ? <div className="notice"><span>{message}</span></div> : null}
      {error ? <div className="notice notice-danger"><span>{error}</span></div> : null}

      {loading && !state ? (
        <div className="kpi"><LoaderCircle size={18} className="spin" /> Cargando módulo comercial...</div>
      ) : (
        <div className="section-stack">
          <section className="commerce-admin-grid">
            <article className="commerce-admin-card">
              <strong>Modo activo</strong>
              <select className="select" value={configForm.activeMode} onChange={(event) => setConfigForm((current) => ({ ...current, activeMode: event.target.value }))} disabled={!canEdit}>
                <option value="">Aún no activo tienda, menú o catálogo</option>
                {COMMERCE_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <label className="label">WhatsApp para pedidos o consultas</label>
              <input className="input" value={configForm.orderWhatsapp} onChange={(event) => setConfigForm((current) => ({ ...current, orderWhatsapp: event.target.value }))} placeholder="573001234567" />
              <button className="btn btn-primary" type="button" onClick={() => runAction("save_config", configForm)} disabled={!canEdit || loading}>
                <Store size={16} /> Guardar configuración comercial
              </button>
            </article>

            <article className="commerce-admin-card">
              <strong>Resumen operativo</strong>
              <div className="commerce-admin-kpis">
                <div><span>{formatCount(state?.summary?.categoriesCount, "categorías")}</span></div>
                <div><span>{formatCount(state?.summary?.subcategoriesCount, "subcategorías")}</span></div>
                <div><span>{formatCount(state?.summary?.productsCount, "productos")}</span></div>
                <div><span>{formatCount(state?.summary?.visibleProductsCount, "visibles")}</span></div>
              </div>
              <small className="muted">
                Límite del plan: {state?.limits?.maxCategories || 0} categorías, {state?.limits?.maxSubcategories || 0} subcategorías y {state?.limits?.maxProducts || 0} productos.
              </small>
            </article>
          </section>

          <section className="commerce-admin-card">
            <div className="commerce-admin-inline-head">
              <strong>{modeMeta.categoryLabel}</strong>
              <small>Si una categoría usa subcategorías, los productos deben ir dentro de ellas.</small>
            </div>
            <div className="commerce-admin-inline-create">
              <input className="input" value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder={`Nombre de la ${modeMeta.categoryLabel.toLowerCase().slice(0, -1)}`} />
              <button className="btn btn-secondary" type="button" onClick={() => { runAction("create_category", { name: newCategoryName }); setNewCategoryName(""); }} disabled={!newCategoryName.trim() || loading}>
                <Plus size={16} /> Crear categoría
              </button>
            </div>
          </section>

          {categories.map((category) => (
            <section key={category.id} className="commerce-category-card">
              <div className="commerce-category-head">
                <div>
                  {editingCategoryId === category.id ? (
                    <div className="commerce-inline-edit">
                      <input className="input" value={editingCategoryName} onChange={(event) => setEditingCategoryName(event.target.value)} />
                      <button className="btn btn-secondary" type="button" onClick={() => { runAction("update_category", { id: category.id, name: editingCategoryName }); setEditingCategoryId(""); }} disabled={!editingCategoryName.trim()}>
                        Guardar
                      </button>
                    </div>
                  ) : (
                    <>
                      <strong>{category.name}</strong>
                      <div className="commerce-inline-metadata">
                        <span>{formatCount(category.subcategoryCount, "subcategorías")}</span>
                        <span>{formatCount(category.productCount, "productos")}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="commerce-inline-actions">
                  <button type="button" onClick={() => runAction("move_category", { categoryId: category.id, direction: "up" })}><ChevronUp size={16} /></button>
                  <button type="button" onClick={() => runAction("move_category", { categoryId: category.id, direction: "down" })}><ChevronDown size={16} /></button>
                  <button type="button" onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.name); }}><Pencil size={16} /></button>
                  <button type="button" onClick={() => runAction("delete_category", { categoryId: category.id })}><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="commerce-admin-inline-create">
                <input
                  className="input"
                  value={subcategoryDrafts[category.id] || ""}
                  onChange={(event) => setSubcategoryDrafts((current) => ({ ...current, [category.id]: event.target.value }))}
                  placeholder={`Nueva ${modeMeta.subcategoryLabel.toLowerCase().slice(0, -1)}`}
                />
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    const value = subcategoryDrafts[category.id] || "";
                    runAction("create_subcategory", { categoryId: category.id, name: value });
                    setSubcategoryDrafts((current) => ({ ...current, [category.id]: "" }));
                  }}
                  disabled={!String(subcategoryDrafts[category.id] || "").trim()}
                >
                  <Plus size={16} /> Agregar subcategoría
                </button>
                <button className="btn btn-primary" type="button" onClick={() => setProductEditor({ mode: configForm.activeMode, categoryId: category.id, subcategoryId: "", name: "", description: "", price: "", visible: true, imageFile: null, id: "" })}>
                  <ImagePlus size={16} /> Agregar producto
                </button>
              </div>

              {category.subcategories?.length ? (
                <div className="commerce-subcategory-list">
                  {category.subcategories.map((subcategory) => (
                    <div className="commerce-subcategory-card" key={subcategory.id}>
                      <div className="commerce-subcategory-head">
                        <div>
                          <strong>{subcategory.name}</strong>
                          <small>{formatCount(subcategory.productCount, "productos")}</small>
                        </div>
                        <div className="commerce-inline-actions">
                          <button type="button" onClick={() => runAction("move_subcategory", { subcategoryId: subcategory.id, direction: "up" })}><ChevronUp size={16} /></button>
                          <button type="button" onClick={() => runAction("move_subcategory", { subcategoryId: subcategory.id, direction: "down" })}><ChevronDown size={16} /></button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextName = window.prompt("Nuevo nombre de la subcategoría", subcategory.name);
                              if (!nextName || nextName === subcategory.name) return;
                              runAction("update_subcategory", {
                                id: subcategory.id,
                                categoryId: category.id,
                                name: nextName,
                              });
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button type="button" onClick={() => runAction("delete_subcategory", { subcategoryId: subcategory.id })}><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <button className="btn btn-secondary" type="button" onClick={() => setProductEditor({ mode: configForm.activeMode, categoryId: category.id, subcategoryId: subcategory.id, name: "", description: "", price: "", visible: true, imageFile: null, id: "" })}>
                        <Plus size={16} /> Agregar producto aquí
                      </button>
                      <div className="commerce-admin-product-list">
                        {subcategory.products?.map((product) => (
                          <ProductRow
                            key={product.id}
                            product={product}
                            mode={configForm.activeMode}
                            onEdit={(nextProduct) => setProductEditor({ ...nextProduct, imageFile: null })}
                            onToggleVisibility={(productId, visible) => runAction("toggle_product_visibility", { productId, visible })}
                            onMove={(productId, direction) => runAction("move_product", { productId, direction })}
                            onDelete={(productId) => runAction("delete_product", { productId })}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="commerce-admin-product-list">
                  {category.products?.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      mode={configForm.activeMode}
                      onEdit={(nextProduct) => setProductEditor({ ...nextProduct, imageFile: null })}
                      onToggleVisibility={(productId, visible) => runAction("toggle_product_visibility", { productId, visible })}
                      onMove={(productId, direction) => runAction("move_product", { productId, direction })}
                      onDelete={(productId) => runAction("delete_product", { productId })}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}

          {!categories.length ? (
            <div className="commerce-empty-state">
              <strong>Aún no has creado categorías comerciales.</strong>
              <p>Empieza creando una categoría y luego agrega subcategorías o productos según el modo que elijas.</p>
            </div>
          ) : null}
        </div>
      )}

      {productEditor ? (
        <div className="commerce-modal-backdrop" role="dialog" aria-modal="true" aria-label="Editor de producto">
          <div className="commerce-modal-card commerce-admin-modal">
            <button className="commerce-modal-close" type="button" onClick={() => setProductEditor(null)}>
              <X size={16} />
            </button>
            <div className="commerce-modal-head">
              <strong>{productEditor.id ? "Editar producto" : "Nuevo producto"}</strong>
              <span>{modeMeta.label}</span>
            </div>
            <div className="section-stack">
              <select className="select" value={productEditor.categoryId} onChange={(event) => setProductEditor((current) => ({ ...current, categoryId: event.target.value, subcategoryId: "" }))}>
                <option value="">Selecciona categoría</option>
                {flatCategoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {flatCategoryOptions.find((category) => category.id === productEditor.categoryId)?.hasSubcategories ? (
                <select className="select" value={productEditor.subcategoryId} onChange={(event) => setProductEditor((current) => ({ ...current, subcategoryId: event.target.value }))}>
                  <option value="">Selecciona subcategoría</option>
                  {(flatCategoryOptions.find((category) => category.id === productEditor.categoryId)?.subcategories || []).map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                  ))}
                </select>
              ) : null}
              <input className="input" placeholder="Nombre del producto" value={productEditor.name} onChange={(event) => setProductEditor((current) => ({ ...current, name: event.target.value }))} />
              <textarea className="textarea" rows={3} placeholder="Descripción" value={productEditor.description || ""} onChange={(event) => setProductEditor((current) => ({ ...current, description: event.target.value }))} />
              <input className="input" placeholder={configForm.activeMode === "micatalogo" ? "Precio opcional" : "Precio"} value={productEditor.price ?? ""} onChange={(event) => setProductEditor((current) => ({ ...current, price: event.target.value }))} />
              <label className="upload-card">
                <input className="upload-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setProductEditor((current) => ({ ...current, imageFile: event.target.files?.[0] || null }))} />
                <span>{productEditor.imageFile ? productEditor.imageFile.name : "Subir imagen del producto"}</span>
              </label>
              <label className="switch-row">
                <input type="checkbox" checked={productEditor.visible !== false} onChange={(event) => setProductEditor((current) => ({ ...current, visible: event.target.checked }))} />
                <span>Visible al público</span>
              </label>
            </div>
            <div className="commerce-modal-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setProductEditor(null)}>Cancelar</button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={async () => {
                  await runAction("save_product", productEditor, productEditor.imageFile || null);
                  setProductEditor(null);
                }}
              >
                <Save size={16} /> Guardar producto
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
