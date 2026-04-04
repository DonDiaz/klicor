"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import {
  ACCOUNT_TYPE_OPTIONS,
  COLOMBIA_FINANCIAL_ENTITY_OPTIONS,
  requiresAccountType,
  usesBrebKeyField,
} from "@/lib/colombia-financial-entities";
import { getBusinessCategoryTemplate } from "@/lib/business-categories";
import {
  buildOnboardingInitialState,
  buildOnboardingPayload,
  buildOnboardingPreviewUser,
  createEmptyPaymentMethod,
  ONBOARDING_STEPS,
  updateOnboardingActionSlots,
} from "@/lib/dashboard-onboarding";
import { APPEARANCE_PRESETS } from "@/lib/theme-system";
import { sanitizeSlug } from "@/lib/utils";

const DashboardPreview = dynamic(
  () => import("@/components/dashboard-preview").then((mod) => mod.DashboardPreview),
  {
    loading: () => (
      <div className="preview-frame preview-frame-placeholder">
        <div className="preview-placeholder-card">
          <strong>Cargando vista previa</strong>
          <p className="section-copy">Preparamos la representacion inicial de tu Klicor.</p>
        </div>
      </div>
    ),
  },
);

function hasPaymentMethodInput(method = {}) {
  return Boolean(method.entityId || method.accountType || method.accountNumber || method.brebKey || method.qrFile || method.qrImageUrl);
}

function getPaymentMethodError(method = {}) {
  if (!hasPaymentMethodInput(method)) return "";
  if (!method.entityId) return "Selecciona una entidad para este metodo.";
  if (requiresAccountType(method.entityId) && !method.accountType) return "Selecciona si la cuenta es de ahorros o corriente.";
  if (usesBrebKeyField(method.entityId)) {
    return method.brebKey ? "" : "Agrega la llave Bre-B del metodo.";
  }
  return method.accountNumber || method.brebKey ? "" : "Agrega el numero de cuenta o la llave Bre-B.";
}

function getStepValidationError(stepId, wizard) {
  if (stepId === "category") {
    return wizard.businessCategory ? "" : "Selecciona el tipo de negocio para continuar.";
  }

  if (stepId === "identity") {
    if (String(wizard.businessName || "").trim().length < 3) {
      return "Escribe un nombre de negocio con al menos 3 caracteres.";
    }

    if (sanitizeSlug(wizard.username || "").length < 3) {
      return "El link publico necesita un usuario de minimo 3 caracteres.";
    }

    return "";
  }

  if (stepId === "actions") {
    const mainAction = wizard.actionSlots[0];
    if (!String(mainAction?.value || "").trim()) {
      return "Agrega por lo menos tu accion principal para continuar.";
    }
    return "";
  }

  if (stepId === "payments") {
    return wizard.paymentMethods.map(getPaymentMethodError).find(Boolean) || "";
  }

  return "";
}

export function DashboardOnboarding({ token, profile, onCompleted, onSkip }) {
  const [wizard, setWizard] = useState(() => buildOnboardingInitialState(profile));
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setWizard(buildOnboardingInitialState(profile));
    setStepIndex(0);
    setError("");
  }, [profile]);

  const currentStep = ONBOARDING_STEPS[stepIndex];
  const currentTemplate = useMemo(() => getBusinessCategoryTemplate(wizard.businessCategory), [wizard.businessCategory]);
  const previewUser = useMemo(() => buildOnboardingPreviewUser(wizard, profile), [profile, wizard]);

  function updateWizardField(field, value) {
    setWizard((current) => ({ ...current, [field]: value }));
  }

  function handleCategorySelect(nextCategory) {
    const previousTemplate = getBusinessCategoryTemplate(wizard.businessCategory);
    const nextTemplate = getBusinessCategoryTemplate(nextCategory);

    setWizard((current) => ({
      ...current,
      businessCategory: nextCategory,
      businessHeadline: !current.businessHeadline || current.businessHeadline === previousTemplate.headline
        ? nextTemplate.headline
        : current.businessHeadline,
      businessSubheadline: !current.businessSubheadline || current.businessSubheadline === previousTemplate.subheadline
        ? nextTemplate.subheadline
        : current.businessSubheadline,
      actionSlots: updateOnboardingActionSlots(nextCategory, current.actionSlots),
    }));
  }

  function updateActionSlot(slotId, field, value) {
    setWizard((current) => ({
      ...current,
      actionSlots: current.actionSlots.map((slot) => (
        slot.id === slotId
          ? {
            ...slot,
            [field]: value,
          }
          : slot
      )),
    }));
  }

  function updatePhoto(file) {
    setWizard((current) => {
      if (current.photoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.photoUrl);
      }

      if (!file) {
        return {
          ...current,
          photo: null,
          photoUrl: profile.photo || "",
        };
      }

      return {
        ...current,
        photo: file,
        photoUrl: URL.createObjectURL(file),
      };
    });
  }

  function updatePaymentMethod(methodId, field, value) {
    setWizard((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.map((method) => (
        method.id === methodId
          ? {
            ...method,
            [field]: value,
            ...(field === "entityId" && !requiresAccountType(value) ? { accountType: "" } : {}),
          }
          : method
      )),
    }));
  }

  function updatePaymentMethodQr(methodId, file) {
    setWizard((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.map((method) => {
        if (method.id !== methodId) return method;
        if (method.qrPreviewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(method.qrPreviewUrl);
        }
        return {
          ...method,
          qrFile: file || null,
          qrPreviewUrl: file ? URL.createObjectURL(file) : "",
          removeQr: !file && Boolean(method.qrImageUrl),
        };
      }),
    }));
  }

  function addPaymentMethod() {
    setWizard((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.length >= 2
        ? current.paymentMethods
        : [...current.paymentMethods, createEmptyPaymentMethod(current.paymentMethods.length)],
    }));
  }

  function removePaymentMethod(methodId) {
    setWizard((current) => {
      const nextMethods = current.paymentMethods
        .filter((method) => method.id !== methodId)
        .map((method, index) => ({ ...method, id: method.id || `payment-method-${index + 1}` }));

      return {
        ...current,
        paymentMethods: nextMethods.length ? nextMethods : [createEmptyPaymentMethod(0)],
      };
    });
  }

  function goToNextStep() {
    const validationError = getStepValidationError(currentStep.id, wizard);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStepIndex((current) => Math.min(current + 1, ONBOARDING_STEPS.length - 1));
  }

  function goToPreviousStep() {
    setError("");
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    const validationError = getStepValidationError(currentStep.id, wizard);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = buildOnboardingPayload(wizard, profile);
      const body = new FormData();
      body.append("businessName", payload.businessName);
      body.append("username", payload.username);
      body.append("businessCategory", payload.businessCategory);
      body.append("businessHeadline", payload.businessHeadline);
      body.append("businessSubheadline", payload.businessSubheadline);
      body.append("profileLinks", JSON.stringify(payload.profileLinks));
      body.append("paymentMethods", JSON.stringify(payload.paymentMethods));
      body.append("appearance", JSON.stringify(payload.appearance));
      body.append("contactCard", JSON.stringify(payload.contactCard));
      body.append("billingProfile", JSON.stringify(payload.billingProfile));
      body.append("removePaymentQrIds", JSON.stringify([]));

      if (wizard.photo) {
        body.append("photo", wizard.photo);
      }

      wizard.paymentMethods.forEach((method) => {
        if (method.qrFile) {
          body.append(`paymentQrImage:${method.id}`, method.qrFile);
        }
      });

      const response = await apiFetch("/api/profile", {
        method: "POST",
        token,
        body,
        isFormData: true,
      });

      await onCompleted?.(response.user);
    } catch (nextError) {
      setError(nextError.message || "No pudimos terminar la configuracion inicial.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="onboarding-shell">
      <div className="onboarding-main panel">
        <div className="onboarding-head">
          <div>
            <span className="status-badge success">Configuracion inicial</span>
            <h2 className="section-title onboarding-title">Crea tu Klicor paso a paso</h2>
            <p className="section-copy">
              Te guiamos para que tu pagina quede lista para compartir, vender y cobrar en pocos minutos.
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onSkip}>
            Abrir editor completo
          </button>
        </div>

        <div className="onboarding-progress">
          {ONBOARDING_STEPS.map((step, index) => (
            <button
              key={step.id}
              className={`onboarding-progress-item ${index === stepIndex ? "is-active" : ""} ${index < stepIndex ? "is-complete" : ""}`}
              type="button"
              onClick={() => setStepIndex(index)}
            >
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
            </button>
          ))}
        </div>

        <div className="onboarding-step">
          {currentStep.id === "category" ? (
            <div className="onboarding-category-grid">
              {[
                { value: "food_drink", label: "Comida y bebidas", copy: "Pedidos, menu y ubicacion en un solo lugar." },
                { value: "retail_sales", label: "Tiendas y ventas", copy: "Catalogo, compra y contacto para vender por redes." },
                { value: "services", label: "Servicios", copy: "Cotizaciones, agenda y atencion desde una sola pagina." },
                { value: "health_wellness", label: "Salud y bienestar", copy: "Reservas, servicios y contacto para atender rapido." },
                { value: "tourism_experiences", label: "Turismo y experiencias", copy: "Planes, reservas y ubicacion para compartir facil." },
              ].map((option) => (
                <button
                  key={option.value}
                  className={`onboarding-category-card ${wizard.businessCategory === option.value ? "is-active" : ""}`}
                  type="button"
                  onClick={() => handleCategorySelect(option.value)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.copy}</span>
                </button>
              ))}
            </div>
          ) : null}

          {currentStep.id === "identity" ? (
            <div className="section-stack">
              <div className="profile-grid">
                <div>
                  <label className="label">Nombre del negocio</label>
                  <input
                    className="input"
                    value={wizard.businessName}
                    onChange={(event) => updateWizardField("businessName", event.target.value)}
                    placeholder="Ej. Puro Burger"
                  />
                </div>
                <div>
                  <label className="label">Usuario o link publico</label>
                  <input
                    className="input"
                    value={wizard.username}
                    onChange={(event) => updateWizardField("username", sanitizeSlug(event.target.value))}
                    placeholder="tu-negocio"
                  />
                  <p className="muted" style={{ marginTop: ".45rem" }}>
                    Quedara como `klicor.com/{wizard.username || "tu-negocio"}`.
                  </p>
                </div>
              </div>

              <div className="profile-grid">
                <div>
                  <label className="label">Titulo comercial</label>
                  <input
                    className="input"
                    value={wizard.businessHeadline}
                    onChange={(event) => updateWizardField("businessHeadline", event.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Frase de apoyo</label>
                  <input
                    className="input"
                    value={wizard.businessSubheadline}
                    onChange={(event) => updateWizardField("businessSubheadline", event.target.value)}
                  />
                </div>
              </div>

              <label className="upload-card onboarding-upload-card">
                <input
                  className="upload-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => updatePhoto(event.target.files?.[0] || null)}
                />
                <span className="upload-icon">{wizard.photoUrl ? <ImagePlus size={20} /> : <UploadCloud size={20} />}</span>
                <span className="upload-copy">
                  <strong>{wizard.photoUrl ? "Cambiar logo o foto" : "Subir logo o foto"}</strong>
                  <span>Este sera el elemento principal de tu Klicor.</span>
                </span>
              </label>
            </div>
          ) : null}

          {currentStep.id === "actions" ? (
            <div className="section-stack">
              <div className="notice">
                <span>Tu categoria sugiere estas acciones: {currentTemplate.label.toLowerCase()}.</span>
              </div>
              {wizard.actionSlots.map((slot) => (
                <div key={slot.id} className="link-row onboarding-link-row">
                  <div>
                    <label className="label">Etiqueta del boton</label>
                    <input
                      className="input"
                      value={slot.label}
                      onChange={(event) => updateActionSlot(slot.id, "label", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">
                      {slot.type === "whatsapp" ? "Numero de WhatsApp" : "Enlace"}
                    </label>
                    <input
                      className="input"
                      value={slot.value}
                      placeholder={slot.placeholder}
                      onChange={(event) => updateActionSlot(slot.id, "value", event.target.value)}
                    />
                  </div>
                  {slot.type === "whatsapp" ? (
                    <div className="link-row-message">
                      <label className="label">Mensaje inicial</label>
                      <input
                        className="input"
                        value={slot.message}
                        onChange={(event) => updateActionSlot(slot.id, "message", event.target.value)}
                        placeholder="Hola, quiero informacion"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {currentStep.id === "payments" ? (
            <div className="section-stack">
              <p className="section-copy">
                Si todavia no quieres cobrar desde tu Klicor, puedes dejar este paso vacio y seguir.
              </p>
              {wizard.paymentMethods.map((method, index) => {
                const methodError = getPaymentMethodError(method);
                const useBrebField = usesBrebKeyField(method.entityId);
                const needsAccountType = requiresAccountType(method.entityId);
                return (
                  <div key={method.id} className="link-row onboarding-payment-card">
                    <div className="dashboard-section-head" style={{ marginBottom: ".5rem" }}>
                      <div>
                        <strong className="section-title" style={{ fontSize: "1rem" }}>Metodo {index + 1}</strong>
                        <p className="section-copy">Configura una cuenta o una llave visible para tus clientes.</p>
                      </div>
                      {wizard.paymentMethods.length > 1 ? (
                        <button className="btn btn-secondary" type="button" onClick={() => removePaymentMethod(method.id)}>
                          <Trash2 size={16} /> Eliminar
                        </button>
                      ) : null}
                    </div>

                    <div className="profile-grid">
                      <div>
                        <label className="label">Entidad</label>
                        <select
                          className="select"
                          value={method.entityId}
                          onChange={(event) => updatePaymentMethod(method.id, "entityId", event.target.value)}
                        >
                          <option value="">Selecciona una entidad</option>
                          {COLOMBIA_FINANCIAL_ENTITY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">QR oficial</label>
                        <label className="upload-card onboarding-inline-upload">
                          <input
                            className="upload-input"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(event) => updatePaymentMethodQr(method.id, event.target.files?.[0] || null)}
                          />
                          <span className="upload-icon">{method.qrPreviewUrl || method.qrImageUrl ? <ImagePlus size={16} /> : <UploadCloud size={16} />}</span>
                          <span className="upload-copy">
                            <strong>{method.qrPreviewUrl || method.qrImageUrl ? "Cambiar QR" : "Subir QR"}</strong>
                          </span>
                        </label>
                      </div>
                    </div>

                    {needsAccountType ? (
                      <div>
                        <label className="label">Tipo de cuenta</label>
                        <select
                          className="select"
                          value={method.accountType}
                          onChange={(event) => updatePaymentMethod(method.id, "accountType", event.target.value)}
                        >
                          <option value="">Selecciona el tipo</option>
                          {ACCOUNT_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    <div>
                      <label className="label">{useBrebField ? "Llave Bre-B" : "Numero de cuenta o llave Bre-B"}</label>
                      <input
                        className="input"
                        value={useBrebField ? method.brebKey : method.accountNumber || method.brebKey}
                        onChange={(event) => updatePaymentMethod(method.id, useBrebField ? "brebKey" : "accountNumber", event.target.value)}
                        placeholder={useBrebField ? "Tu llave Bre-B" : "Ej. 1234567890"}
                      />
                    </div>

                    {methodError ? <p className="notice notice-danger">{methodError}</p> : null}
                  </div>
                );
              })}

              <div className="payment-method-toolbar">
                <button className="btn btn-secondary" type="button" onClick={addPaymentMethod} disabled={wizard.paymentMethods.length >= 2}>
                  <Plus size={16} /> Agregar metodo de pago
                </button>
              </div>
            </div>
          ) : null}

          {currentStep.id === "design" ? (
            <div className="section-stack">
              <div className="notice">
                <span>Elige un tema base. Despues podras personalizar colores y detalles desde el editor.</span>
              </div>
              <div className="appearance-presets onboarding-theme-grid">
                {APPEARANCE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    className={`appearance-preset ${wizard.appearance.presetId === preset.id ? "is-active" : ""}`}
                    type="button"
                    onClick={() => updateWizardField("appearance", { ...preset.appearance, presetId: preset.id, advancedEnabled: false })}
                    style={{
                      "--preset-primary": preset.appearance.primaryColor,
                      "--preset-surface": preset.appearance.surfaceColor,
                      "--preset-text": preset.appearance.textPrimaryColor,
                    }}
                  >
                    <span className="preset-tone" />
                    <span className="preset-swatches">
                      <i style={{ background: preset.appearance.primaryColor }} />
                      <i style={{ background: preset.appearance.backgroundColor }} />
                      <i style={{ background: preset.appearance.surfaceColor }} />
                    </span>
                    <strong>{preset.name}</strong>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="notice notice-danger">
            <span>{error}</span>
          </div>
        ) : null}

        <div className="onboarding-footer">
          <button className="btn btn-secondary" type="button" onClick={goToPreviousStep} disabled={stepIndex === 0 || submitting}>
            <ArrowLeft size={16} /> Anterior
          </button>

          {stepIndex < ONBOARDING_STEPS.length - 1 ? (
            <button className="btn btn-primary" type="button" onClick={goToNextStep}>
              Continuar <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <UploadCloud size={16} /> : <CheckCircle2 size={16} />}
              Crear mi Klicor
            </button>
          )}
        </div>
      </div>

      <aside className="onboarding-preview panel">
        <div className="preview-header preview-header-editor onboarding-preview-head">
          <div className="preview-link-card">
            <span className="dashboard-link-label">Tu Klicor en vivo</span>
            <strong>{wizard.businessName || "Tu negocio"}</strong>
          </div>
        </div>
        <div className="preview-frame preview-frame-editor onboarding-preview-frame">
          <DashboardPreview user={previewUser} />
        </div>
      </aside>
    </section>
  );
}
