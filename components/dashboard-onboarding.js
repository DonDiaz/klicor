"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  UploadCloud,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { getBusinessCategoryTemplate } from "@/lib/business-categories";
import {
  buildOnboardingInitialState,
  buildOnboardingPayload,
  buildOnboardingPreviewUser,
  ONBOARDING_STEPS,
  updateOnboardingActionSlots,
} from "@/lib/dashboard-onboarding";
import { generateThemeFromLogoFile, mergeGeneratedTheme } from "@/lib/logo-theme";
import { APPEARANCE_PRESETS } from "@/lib/theme-system";
import { sanitizeSlug } from "@/lib/utils";

const DashboardPreview = dynamic(
  () => import("@/components/dashboard-preview").then((mod) => mod.DashboardPreview),
  {
    loading: () => (
      <div className="preview-frame preview-frame-placeholder">
        <div className="preview-placeholder-card">
          <strong>Cargando vista previa</strong>
          <p className="section-copy">Preparamos la representación inicial de tu Klicor.</p>
        </div>
      </div>
    ),
  },
);


function getStepValidationError(stepId, wizard) {
  if (stepId === "category") {
    return wizard.businessCategory ? "" : "Selecciona el tipo de negocio para continuar.";
  }

  if (stepId === "identity") {
    if (String(wizard.businessName || "").trim().length < 3) {
      return "Escribe un nombre de negocio con al menos 3 caracteres.";
    }

    if (sanitizeSlug(wizard.username || "").length < 3) {
      return "El link público necesita un usuario de mínimo 3 caracteres.";
    }

    return "";
  }

  if (stepId === "actions") {
    const whatsappAction = wizard.actionSlots.find((slot) => slot.type === "whatsapp");
    if (!String(whatsappAction?.value || "").trim()) {
      return "Agrega tu WhatsApp para que tus clientes puedan contactarte.";
    }
    return "";
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
  const previewUser = useMemo(() => buildOnboardingPreviewUser(wizard, profile), [profile, wizard]);
  const availableThemes = useMemo(() => {
    const usedIds = new Set();
    return [...wizard.customThemes, ...APPEARANCE_PRESETS].filter((theme) => {
      const themeId = String(theme?.id || "");
      if (!themeId || usedIds.has(themeId)) return false;
      usedIds.add(themeId);
      return true;
    });
  }, [wizard.customThemes]);
  const onboardingSocialTypes = new Set(["instagram", "facebook", "tiktok"]);
  const onboardingActionSlots = wizard.actionSlots.filter((slot) => !onboardingSocialTypes.has(slot.type));
  const onboardingSocialSlots = wizard.actionSlots.filter((slot) => onboardingSocialTypes.has(slot.type));

  function updateWizardField(field, value) {
    setWizard((current) => ({
      ...current,
      [field]: value,
      ...(field === "businessName"
        ? {
          customThemes: current.customThemes.map((theme) => (
            theme.id === "generated-logo-theme"
              ? { ...theme, name: value ? `Tema ${value}` : "Tema de tu negocio" }
              : theme
          )),
        }
        : {}),
    }));
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

  async function updatePhoto(file) {
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

    if (!file) {
      setWizard((current) => ({
        ...current,
        customThemes: mergeGeneratedTheme(current.customThemes, null, current.businessName),
      }));
      return;
    }

    try {
      const generatedTheme = await generateThemeFromLogoFile(file, wizard.businessName);
      if (!generatedTheme) return;

      setWizard((current) => ({
        ...current,
        customThemes: mergeGeneratedTheme(current.customThemes, generatedTheme, current.businessName),
      }));
    } catch {
      // If the image cannot be analyzed we simply keep the rest of the flow working.
    }
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
      body.append("customThemes", JSON.stringify(payload.customThemes));
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
      setError(nextError.message || "No pudimos terminar la configuración inicial.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="onboarding-shell">
      <div className="onboarding-main panel">
        <div className="onboarding-head">
          <div>
            <span className="status-badge success">Publicar rápido</span>
            <h2 className="section-title onboarding-title">Crea tu Klicor sin enredos</h2>
            <p className="section-copy">
              Primero deja listo lo esencial. Luego podrás mejorar tu página y aparecer mejor en Dorika.
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
                { value: "food_drink", label: "Comida y bebidas", copy: "Pedidos, menú y ubicación en un solo lugar." },
                { value: "retail_sales", label: "Tiendas y ventas", copy: "Catálogo, compra y contacto para vender por redes." },
                { value: "services", label: "Servicios", copy: "Cotizaciones, agenda y atención desde una sola página." },
                { value: "health_wellness", label: "Salud y bienestar", copy: "Reservas, servicios y contacto para atender rápido." },
                { value: "tourism_experiences", label: "Turismo y experiencias", copy: "Planes, reservas y ubicación para compartir fácil." },
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
                  <label className="label">Usuario o link público</label>
                  <input
                    className="input"
                    value={wizard.username}
                    onChange={(event) => updateWizardField("username", sanitizeSlug(event.target.value))}
                    placeholder="tu-negocio"
                  />
                  <p className="muted" style={{ marginTop: ".45rem" }}>
                    Quedará como `klicor.com/{wizard.username || "tu-negocio"}`.
                  </p>
                </div>
              </div>

              <div className="profile-grid">
                <div>
                  <label className="label">Título comercial</label>
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
                  <span>Este será el elemento principal de tu Klicor.</span>
                </span>
              </label>
            </div>
          ) : null}

          {currentStep.id === "actions" ? (
            <div className="section-stack">
              <div className="notice">
                <span>WhatsApp es el contacto principal. Página, ubicación y redes son opcionales: si las dejas vacías no aparecerán en tu link público.</span>
              </div>
              {onboardingActionSlots.map((slot) => (
                <div key={slot.id} className="link-row onboarding-link-row">
                  <div>
                    <label className="label">Etiqueta del botón</label>
                    <input
                      className="input"
                      value={slot.label}
                      onChange={(event) => updateActionSlot(slot.id, "label", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">
                      {slot.type === "whatsapp" ? "Número de WhatsApp" : "Enlace"}
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
                        placeholder="Hola, quiero información"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
              <div className="onboarding-social-card">
                <div>
                  <strong>Redes sociales opcionales</strong>
                  <p className="section-copy">Agrega solo las redes que ya usas. Si un campo queda vacío, ese icono no se mostrará.</p>
                </div>
                <div className="onboarding-social-grid">
                  {onboardingSocialSlots.map((slot) => (
                    <div key={slot.id}>
                      <label className="label">{slot.label}</label>
                      <input
                        className="input"
                        value={slot.value}
                        placeholder={slot.placeholder}
                        onChange={(event) => updateActionSlot(slot.id, "value", event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep.id === "design" ? (
            <div className="section-stack">
              <div className="notice">
                <span>Elige un tema base. Si tu logo ya tiene colores fuertes, te sugerimos un tema privado para tu negocio.</span>
              </div>
              <div className="appearance-presets onboarding-theme-grid">
                {availableThemes.map((preset) => (
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
                    {preset.id === "generated-logo-theme" ? <small>Tema sugerido desde tu logo</small> : null}
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
