"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  HeartPulse,
  ImagePlus,
  LocateFixed,
  MapPin,
  Plus,
  ShoppingBag,
  Trash2,
  Utensils,
  UploadCloud,
} from "lucide-react";
import { DorikaMapPicker } from "@/components/dorika-map-picker";
import { apiFetch } from "@/lib/client-api";
import { COLOMBIA_DEPARTMENT_OPTIONS, getCitiesForDepartment } from "@/lib/colombia-locations";
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
  resolveOnboardingBusinessTypeOptions,
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

const CATEGORY_OPTIONS = [
  {
    value: "food_drink",
    label: "Comida y bebidas",
    copy: "Pedidos, menu y ubicacion en un solo lugar.",
    icon: Utensils,
  },
  {
    value: "retail_sales",
    label: "Tiendas y ventas",
    copy: "Catalogo, compra y contacto para vender por redes.",
    icon: ShoppingBag,
  },
  {
    value: "services",
    label: "Servicios",
    copy: "Cotizaciones, agenda y atencion desde una sola pagina.",
    icon: BriefcaseBusiness,
  },
  {
    value: "health_wellness",
    label: "Salud y bienestar",
    copy: "Reservas, servicios y contacto para atender rapido.",
    icon: HeartPulse,
  },
  {
    value: "tourism_experiences",
    label: "Turismo y experiencias",
    copy: "Planes, reservas y ubicacion para compartir facil.",
    icon: MapPin,
  },
];

function hasPaymentMethodInput(method = {}) {
  return Boolean(method.entityId || method.accountType || method.accountNumber || method.brebKey || method.qrFile || method.qrImageUrl);
}

function getPaymentMethodError(method = {}) {
  if (!hasPaymentMethodInput(method)) return "";
  if (!method.entityId) return "Selecciona una entidad para este método.";
  if (requiresAccountType(method.entityId) && !method.accountType) return "Selecciona si la cuenta es de ahorros o corriente.";
  if (usesBrebKeyField(method.entityId)) {
    return method.brebKey ? "" : "Agrega la llave Bre-B del método.";
  }
  return method.accountNumber || method.brebKey ? "" : "Agrega el número de cuenta o la llave Bre-B.";
}

function hasMapPoint(dorikaProfile = {}) {
  return Number.isFinite(dorikaProfile.latitude) && Number.isFinite(dorikaProfile.longitude);
}

function getStepValidationError(stepId, wizard) {
  if (stepId === "category") {
    if (!wizard.businessCategory) return "Selecciona el tipo de negocio para continuar.";
    if (!wizard.businessType) return "Selecciona que hace o vende tu negocio.";
    return "";
  }

  if (stepId === "identity") {
    if (String(wizard.businessName || "").trim().length < 3) {
      return "Escribe un nombre de negocio con al menos 3 caracteres.";
    }

    if (sanitizeSlug(wizard.username || "").length < 3) {
      return "El link público necesita un usuario de mínimo 3 caracteres.";
    }

    if (!String(wizard.billingProfile?.department || "").trim()) {
      return "Selecciona el departamento donde atiende tu negocio.";
    }

    if (!String(wizard.billingProfile?.city || "").trim()) {
      return "Selecciona la ciudad o municipio donde atiende tu negocio.";
    }

    if (!hasMapPoint(wizard.dorikaProfile)) {
      return "Selecciona el punto exacto del negocio en el mapa.";
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
  const [usernameCheck, setUsernameCheck] = useState({ value: "", status: "idle", message: "" });
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [locationMapOpen, setLocationMapOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.dataset.theme;
    root.dataset.theme = "light";

    return () => {
      if (previousTheme === "dark" || previousTheme === "light") {
        root.dataset.theme = previousTheme;
      }
    };
  }, []);

  useEffect(() => {
    setWizard(buildOnboardingInitialState(profile));
    setStepIndex(0);
    setError("");
    setUsernameCheck({ value: "", status: "idle", message: "" });
    setUsernameEdited(false);
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
  const onboardingActionSlots = wizard.actionSlots.filter((slot) => !onboardingSocialTypes.has(slot.type) && slot.type !== "maps");
  const onboardingSocialSlots = wizard.actionSlots.filter((slot) => onboardingSocialTypes.has(slot.type));
  const onboardingCityOptions = useMemo(
    () => getCitiesForDepartment(wizard.billingProfile?.department || ""),
    [wizard.billingProfile?.department],
  );
  const businessTypeOptions = useMemo(
    () => resolveOnboardingBusinessTypeOptions(wizard.businessCategory),
    [wizard.businessCategory],
  );

  function updateWizardField(field, value) {
    if (field === "username") {
      const nextUsername = sanitizeSlug(value);
      setError("");
      setUsernameCheck({ value: nextUsername, status: "idle", message: "" });
      setUsernameEdited(true);
      setWizard((current) => ({
        ...current,
        username: nextUsername,
      }));
      return;
    }

    if (field === "businessName" && !usernameEdited) {
      setUsernameCheck({ value: sanitizeSlug(value), status: "idle", message: "" });
    }

    setWizard((current) => ({
      ...current,
      [field]: value,
      ...(field === "businessName"
        ? {
          username: usernameEdited && current.username && current.username !== sanitizeSlug(current.businessName)
            ? current.username
            : sanitizeSlug(value),
          customThemes: current.customThemes.map((theme) => (
            theme.id === "generated-logo-theme"
              ? { ...theme, name: value ? `Tema ${value}` : "Tema de tu negocio" }
              : theme
          )),
        }
        : {}),
    }));
  }

  function updateWizardBillingField(field, value) {
    setWizard((current) => ({
      ...current,
      billingProfile: {
        ...current.billingProfile,
        [field]: value,
        ...(field === "department" ? { city: "" } : {}),
      },
      dorikaProfile: {
        ...(current.dorikaProfile || {}),
        ...(field === "city" ? { city: value } : {}),
        ...(field === "department" ? { city: "" } : {}),
      },
    }));
  }

  function handleSaveMapLocation(location) {
    setWizard((current) => {
      const city = current.billingProfile?.city || current.dorikaProfile?.city || "";
      return {
        ...current,
        dorikaProfile: {
          ...(current.dorikaProfile || {}),
          enabled: current.dorikaProfile?.enabled !== false,
          showLocation: true,
          locationPrivacy: "exact",
          city,
          address: location.addressLabel || current.dorikaProfile?.address || "",
          latitude: location.latitude,
          longitude: location.longitude,
          locationAccuracyMeters: location.locationAccuracyMeters,
          mapLocationUpdatedAt: new Date().toISOString(),
        },
      };
    });
    setLocationMapOpen(false);
  }

  async function validateUsernameAvailability({ quiet = false } = {}) {
    const username = sanitizeSlug(wizard.username || "");

    if (username.length < 3) {
      setUsernameCheck({ value: username, status: "idle", message: "" });
      return "El link público necesita un usuario de mínimo 3 caracteres.";
    }

    if (usernameCheck.value === username && usernameCheck.status === "available") {
      return "";
    }

    if (usernameCheck.value === username && usernameCheck.status === "unavailable") {
      return usernameCheck.message || "Ese usuario ya está en uso. Prueba con otro.";
    }

    setUsernameCheck({
      value: username,
      status: "checking",
      message: "Revisando disponibilidad...",
    });

    try {
      const response = await apiFetch(`/api/username?username=${encodeURIComponent(username)}`, { token });
      const message = response.message || (response.available ? "Este usuario está disponible." : "Ese usuario ya está en uso. Prueba con otro.");
      setUsernameCheck((current) => (
        current.value === username
          ? { value: username, status: response.available ? "available" : "unavailable", message }
          : current
      ));
      return response.available ? "" : message;
    } catch (nextError) {
      const message = nextError.message || "No pudimos validar el usuario. Intenta de nuevo.";
      setUsernameCheck((current) => (
        current.value === username
          ? { value: username, status: quiet ? "idle" : "unavailable", message: quiet ? "" : message }
          : current
      ));
      return quiet ? "" : message;
    }
  }

  async function validateStep(stepId) {
    const validationError = getStepValidationError(stepId, wizard);
    if (validationError) return validationError;
    if (stepId === "identity") {
      return validateUsernameAvailability();
    }
    return "";
  }

  function handleCategorySelect(nextCategory) {
    const previousTemplate = getBusinessCategoryTemplate(wizard.businessCategory);
    const nextTemplate = getBusinessCategoryTemplate(nextCategory);
    const nextTypeOptions = resolveOnboardingBusinessTypeOptions(nextCategory);

    setWizard((current) => ({
      ...current,
      businessCategory: nextCategory,
      businessType: nextTypeOptions.some((option) => option.value === current.businessType) ? current.businessType : "",
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

  function updatePaymentMethod(methodId, field, value) {
    setWizard((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.map((method) => {
        if (method.id !== methodId) return method;
        const next = {
          ...method,
          [field]: value,
        };

        if (field === "entityId") {
          if (!requiresAccountType(value)) {
            next.accountType = "";
          }

          const currentValue = String(method.accountNumber || method.brebKey || "").trim();
          if (usesBrebKeyField(value)) {
            next.accountNumber = "";
            next.brebKey = currentValue;
          } else {
            next.accountNumber = currentValue;
            next.brebKey = "";
          }
        }

        return next;
      }),
    }));
  }

  function updatePaymentMethodValue(methodId, value) {
    setWizard((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.map((method) => {
        if (method.id !== methodId) return method;
        if (usesBrebKeyField(method.entityId)) {
          return {
            ...method,
            accountNumber: "",
            brebKey: value,
          };
        }

        return {
          ...method,
          accountNumber: value,
          brebKey: "",
        };
      }),
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
      paymentMethods: [...current.paymentMethods, createEmptyPaymentMethod(current.paymentMethods.length)],
    }));
  }

  function removePaymentMethod(methodId) {
    setWizard((current) => {
      const target = current.paymentMethods.find((method) => method.id === methodId);
      if (target?.qrPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(target.qrPreviewUrl);
      }

      const nextMethods = current.paymentMethods
        .filter((method) => method.id !== methodId)
        .map((method, index) => ({ ...method, id: method.id || `payment-method-${index + 1}` }));

      return {
        ...current,
        paymentMethods: nextMethods.length ? nextMethods : [createEmptyPaymentMethod(0)],
      };
    });
  }

  async function goToNextStep() {
    if (submitting || usernameCheck.status === "checking") return;

    setError("");
    const validationError = await validateStep(currentStep.id);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStepIndex((current) => Math.min(current + 1, ONBOARDING_STEPS.length - 1));
  }

  async function goToStep(targetIndex) {
    if (submitting || usernameCheck.status === "checking") return;
    if (targetIndex <= stepIndex) {
      setError("");
      setStepIndex(targetIndex);
      return;
    }

    if (targetIndex === stepIndex + 1) {
      await goToNextStep();
    }
  }

  function goToPreviousStep() {
    setError("");
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      for (let index = 0; index < ONBOARDING_STEPS.length; index += 1) {
        const validationError = await validateStep(ONBOARDING_STEPS[index].id);
        if (validationError) {
          setStepIndex(index);
          setError(validationError);
          return;
        }
      }

      const payload = buildOnboardingPayload(wizard, profile);
      const body = new FormData();
      body.append("businessName", payload.businessName);
      body.append("username", payload.username);
      body.append("businessCategory", payload.businessCategory);
      body.append("businessType", payload.businessType);
      body.append("businessHeadline", payload.businessHeadline);
      body.append("businessSubheadline", payload.businessSubheadline);
      body.append("profileLinks", JSON.stringify(payload.profileLinks));
      body.append("paymentMethods", JSON.stringify(payload.paymentMethods));
      body.append("appearance", JSON.stringify(payload.appearance));
      body.append("customThemes", JSON.stringify(payload.customThemes));
      body.append("contactCard", JSON.stringify(payload.contactCard));
      body.append("billingProfile", JSON.stringify(payload.billingProfile));
      body.append("dorikaProfile", JSON.stringify(payload.dorikaProfile));
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
              Primero deja listo lo esencial. Luego podrás mejorar tu página con más calma.
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
              onClick={() => goToStep(index)}
              disabled={submitting || usernameCheck.status === "checking" || index > stepIndex + 1}
            >
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
            </button>
          ))}
        </div>

        <div className="onboarding-step">
          {currentStep.id === "category" ? (
            <div className="section-stack">
              <div className="onboarding-category-grid">
                {CATEGORY_OPTIONS.map((option) => {
                  const CategoryIcon = option.icon;
                  return (
                    <button
                      key={option.value}
                      className={`onboarding-category-card ${wizard.businessCategory === option.value ? "is-active" : ""}`}
                      type="button"
                      onClick={() => handleCategorySelect(option.value)}
                    >
                      <span className="onboarding-category-icon"><CategoryIcon size={23} /></span>
                      <span className="onboarding-category-copy">
                        <strong>{option.label}</strong>
                        <span>{option.copy}</span>
                      </span>
                      <ArrowRight className="onboarding-category-arrow" size={18} />
                    </button>
                  );
                })}
              </div>

              {businessTypeOptions.length ? (
                <div className="onboarding-type-panel">
                  <div>
                    <strong>Que hace o vende tu negocio</strong>
                    <p className="section-copy">Esto nos ayuda a sugerir modulo, tema, iconos y experiencia comercial.</p>
                  </div>
                  <div className="onboarding-type-grid">
                    {businessTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`onboarding-type-chip ${wizard.businessType === option.value ? "is-active" : ""}`}
                        type="button"
                        onClick={() => updateWizardField("businessType", option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {currentStep.id === "identity" ? (
            <div className="section-stack">
              <div className="profile-grid">
                <div>
                  <label className="label">Nombre de tu negocio</label>
                  <input
                    className="input"
                    value={wizard.businessName}
                    onChange={(event) => updateWizardField("businessName", event.target.value)}
                    placeholder="Ej. Palermo Pizzeria"
                  />
                </div>
                <div>
                  <label className="label">Usuario o link público</label>
                  <input
                    className="input"
                    value={wizard.username}
                    onChange={(event) => updateWizardField("username", event.target.value)}
                    onBlur={() => {
                      if (sanitizeSlug(wizard.username || "").length >= 3) {
                        validateUsernameAvailability({ quiet: true });
                      }
                    }}
                    placeholder="tu-negocio"
                  />
                  <p className={`muted username-availability ${usernameCheck.status !== "idle" ? `is-${usernameCheck.status}` : ""}`.trim()}>
                    {usernameCheck.message || <>Quedará como <strong>klicor.com/{wizard.username || "tu-negocio"}</strong>.</>}
                  </p>
                </div>
              </div>

              <div className="onboarding-location-card">
                <div>
                  <strong>Ubicacion de tu negocio</strong>
                  <p className="section-copy">Asi tus clientes saben desde el inicio donde estas.</p>
                </div>
                <div className="profile-grid">
                  <div>
                    <label className="label">Departamento</label>
                    <select
                      className="select"
                      value={wizard.billingProfile?.department || ""}
                      onChange={(event) => updateWizardBillingField("department", event.target.value)}
                    >
                      <option value="">Selecciona un departamento</option>
                      {COLOMBIA_DEPARTMENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Ciudad o municipio</label>
                    <select
                      className="select"
                      value={wizard.billingProfile?.city || ""}
                      onChange={(event) => updateWizardBillingField("city", event.target.value)}
                      disabled={!wizard.billingProfile?.department}
                    >
                      <option value="">{wizard.billingProfile?.department ? "Selecciona una ciudad o municipio" : "Selecciona primero el departamento"}</option>
                      {onboardingCityOptions.map((cityOption) => (
                        <option key={cityOption.code} value={cityOption.name}>{cityOption.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="onboarding-map-capture">
                  <div>
                    <strong>Ubicacion exacta</strong>
                    <span>
                      {hasMapPoint(wizard.dorikaProfile)
                        ? `${Number(wizard.dorikaProfile.latitude).toFixed(6)}, ${Number(wizard.dorikaProfile.longitude).toFixed(6)}`
                        : "Abre el mapa y deja el pin sobre tu negocio."}
                    </span>
                  </div>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setLocationMapOpen(true)}
                    disabled={!wizard.billingProfile?.city}
                  >
                    <LocateFixed size={16} />
                    {hasMapPoint(wizard.dorikaProfile) ? "Ajustar punto" : "Ubicar en mapa"}
                  </button>
                </div>
              </div>

              <div className="profile-grid">
                <div>
                  <label className="label">Slogan de tu negocio</label>
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
                  <strong>{wizard.photoUrl ? "Cambiar logo o foto" : "Carga el logo de tu negocio"}</strong>
                  <span>Este será el elemento principal de tu Klicor.</span>
                </span>
              </label>
            </div>
          ) : null}

          {currentStep.id === "actions" ? (
            <div className="section-stack">
              <div className="notice">
                <span>WhatsApp es el contacto principal. Pagina y redes son opcionales. La ubicacion ya quedo definida desde el mapa.</span>
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

          {currentStep.id === "payments" ? (
            <div className="section-stack">
              <div className="notice">
                <span>Agrega tus métodos de pago desde el inicio para que el cliente pueda comprar sin pedirte datos por chat. Si prefieres completarlo después, puedes dejarlo vacío.</span>
              </div>
              {wizard.paymentMethods.map((method, index) => {
                const methodError = getPaymentMethodError(method);
                const useBrebField = usesBrebKeyField(method.entityId);
                const needsAccountType = requiresAccountType(method.entityId);
                return (
                  <div key={method.id} className="link-row onboarding-payment-card">
                    <div className="dashboard-section-head" style={{ marginBottom: ".5rem" }}>
                      <div>
                        <strong className="section-title" style={{ fontSize: "1rem" }}>Método {index + 1}</strong>
                        <p className="section-copy">Cuenta, billetera, llave Bre-B o QR visible para tus clientes.</p>
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
                        <label className="label">QR de pago</label>
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
                      <label className="label">{useBrebField ? "Llave Bre-B" : "Número de cuenta o llave Bre-B"}</label>
                      <input
                        className="input"
                        value={useBrebField ? method.brebKey : method.accountNumber || method.brebKey}
                        onChange={(event) => updatePaymentMethodValue(method.id, event.target.value)}
                        placeholder={useBrebField ? "Tu llave Bre-B" : "Ej. 1234567890"}
                      />
                    </div>

                    {methodError ? <p className="notice notice-danger">{methodError}</p> : null}
                  </div>
                );
              })}

              <div className="payment-method-toolbar">
                <button className="btn btn-secondary" type="button" onClick={addPaymentMethod}>
                  <Plus size={16} /> Agregar método de pago
                </button>
                <p className="muted">Puedes guardar varios métodos. Si dejas este paso vacío, no se mostrará en tu link.</p>
              </div>
            </div>
          ) : null}

          {currentStep.id === "design" ? (
            <div className="section-stack">
              <div className="notice">
                <span>Crea o elige un tema base. Si tu logo ya tiene colores fuertes, te sugerimos un tema privado para tu negocio.</span>
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
            <button className="btn btn-primary" type="button" onClick={goToNextStep} disabled={submitting || usernameCheck.status === "checking"}>
              {usernameCheck.status === "checking" && currentStep.id === "identity" ? "Revisando..." : "Continuar"} <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={submitting || usernameCheck.status === "checking"}>
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
      <DorikaMapPicker
        open={locationMapOpen}
        businessName={wizard.businessName}
        initialLatitude={wizard.dorikaProfile?.latitude}
        initialLongitude={wizard.dorikaProfile?.longitude}
        initialCity={wizard.billingProfile?.city || wizard.dorikaProfile?.city}
        initialZone={wizard.dorikaProfile?.zone}
        initialAddress={wizard.dorikaProfile?.address}
        eyebrow="Ubicacion del negocio"
        title="Ubica tu negocio en el mapa"
        copy="Busca la direccion, usa tu ubicacion actual o mueve el mapa hasta dejar el pin sobre el local."
        saveLabel="Usar esta ubicacion"
        savedMessage="Punto ajustado. Guarda para usarlo en tu Klicor."
        onClose={() => setLocationMapOpen(false)}
        onSave={handleSaveMapLocation}
      />
    </section>
  );
}
