import { z } from "zod";
import { ADMIN_ACCOUNT_STATUS_VALUES, ADMIN_ORIGIN_VALUES, ADMIN_PLAN_VALUES } from "@/lib/admin-config";
import { BOOKING_STATUS_VALUES } from "@/lib/booking-config";
import { COMMERCE_MODE_VALUES, requiresCommercePrice } from "@/lib/commerce-config";
import { isSocialLinkType, LINK_PRIORITY_LIMITS } from "@/lib/business-categories";
import { requiresAccountType } from "@/lib/colombia-financial-entities";
import { DORIKA_LOCATION_PRIVACY_VALUES } from "@/lib/dorika-profile";
import { getLinkTypeLimit } from "@/lib/link-catalog";
import { APPEARANCE_FONT_VALUES } from "@/lib/theme-system";

export const profileLinkSchema = z.object({
  id: z.string().trim().min(1),
  type: z.string().trim().min(1),
  label: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(300),
  message: z.string().trim().max(240).optional().default(""),
  priorityTier: z.coerce.number().int().min(1).max(3).optional().default(3),
});

export const contactCardSchema = z.object({
  enabled: z.boolean(),
  name: z.string().trim().max(80),
  title: z.string().trim().max(80),
  whatsappLinkId: z.string().trim().max(120),
  phone: z.string().trim().max(30),
});

export const billingProfileSchema = z.object({
  legalName: z.string().trim().max(120),
  documentType: z.enum(["nit", "cc", "ce", "passport", "other"]),
  documentNumber: z.string().trim().max(40),
  verificationDigit: z.string().trim().max(4),
  taxResponsibility: z.enum(["", "si", "no"]),
  billingEmail: z.string().trim().max(120),
  billingPhone: z.string().trim().max(30),
  address: z.string().trim().max(160),
  city: z.string().trim().max(80),
  department: z.string().trim().max(80),
  country: z.string().trim().max(80),
});

export const dorikaProfileSchema = z.object({
  enabled: z.boolean().default(true),
  showLocation: z.boolean().default(true),
  locationPrivacy: z.enum(DORIKA_LOCATION_PRIVACY_VALUES).default("exact"),
  city: z.string().trim().max(80).default(""),
  zone: z.string().trim().max(80).default(""),
  address: z.string().trim().max(160).default(""),
  placeName: z.string().trim().max(120).default(""),
  floor: z.string().trim().max(40).default(""),
  unit: z.string().trim().max(60).default(""),
  reference: z.string().trim().max(140).default(""),
  arrivalInstructions: z.string().trim().max(280).default(""),
  latitude: z.coerce.number().min(-90).max(90).nullable().default(null),
  longitude: z.coerce.number().min(-180).max(180).nullable().default(null),
  locationAccuracyMeters: z.coerce.number().min(0).nullable().default(null),
  mapLocationUpdatedAt: z.string().trim().max(80).default(""),
  coverImageUrl: z.string().trim().max(500).default(""),
  coverImagePath: z.string().trim().max(500).default(""),
  description: z.string().trim().max(180).default(""),
  category: z.enum(["food_drink", "retail_sales", "services", "health_wellness", "tourism_experiences"]).or(z.literal("")).default(""),
  featuredProductIds: z.array(z.string().trim().min(1).max(120)).max(24).default([]),
});

export const paymentMethodSchema = z.object({
  id: z.string().trim().min(1),
  entityId: z.string().trim().max(60),
  accountType: z.enum(["", "savings", "checking"]),
  accountNumber: z.string().trim().max(40),
  brebKey: z.string().trim().max(60),
  qrImageUrl: z.string().trim().max(500).optional().default(""),
  qrPath: z.string().trim().max(500).optional().default(""),
}).superRefine((data, ctx) => {
  const hasAnyData = Boolean(data.entityId || data.accountNumber || data.brebKey);
  if (!hasAnyData) return;

  if (!data.entityId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["entityId"],
      message: "Selecciona una entidad para el método de pago.",
    });
  }

  if (!data.accountNumber && !data.brebKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["accountNumber"],
      message: "Agrega una cuenta o una llave Bre-B para el método de pago.",
    });
  }

  if (requiresAccountType(data.entityId) && !data.accountType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["accountType"],
      message: "Selecciona si la cuenta es de ahorros o corriente.",
    });
  }
});

export const appearanceSchema = z.object({
  presetId: z.string().trim().min(1),
  advancedEnabled: z.boolean(),
  backgroundStyle: z.enum(["solid", "gradient"]),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  surfaceColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  tertiaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  textPrimaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  textSecondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  buttonTextColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  buttonPrimaryTextColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido").optional(),
  buttonSecondaryTextColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido").optional(),
  buttonTertiaryTextColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido").optional(),
  buttonStyle: z.enum(["solid", "outline", "soft"]),
  buttonRadius: z.enum(["rounded", "square"]),
  cardTransparency: z.enum(["solid", "soft"]),
  cardShadow: z.enum(["none", "soft", "medium"]),
  socialStyle: z.enum(["cards", "brand-circles"]),
  fontFamily: z.enum(APPEARANCE_FONT_VALUES),
  nameSize: z.enum(["s", "m", "l"]),
  nameWeight: z.enum(["regular", "bold"]),
  avatarShape: z.enum(["circle", "rounded", "soft-square"]),
});

export const customThemeSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(80),
  appearance: appearanceSchema,
});

export const profileSchema = z.object({
  businessName: z.string().trim().min(3, "El nombre del negocio es obligatorio").max(80),
  username: z.string().trim().min(3, "El usuario debe tener mínimo 3 caracteres").max(30),
  businessCategory: z.enum(["food_drink", "retail_sales", "services", "health_wellness", "tourism_experiences"]),
  businessHeadline: z.string().trim().max(90),
  businessSubheadline: z.string().trim().max(120),
  profileLinks: z.array(profileLinkSchema).max(20),
  paymentMethods: z.array(paymentMethodSchema).max(2),
  appearance: appearanceSchema,
  customThemes: z.array(customThemeSchema).max(6),
  contactCard: contactCardSchema,
  billingProfile: billingProfileSchema,
  dorikaProfile: dorikaProfileSchema,
}).superRefine((data, ctx) => {
  const counts = new Map();

  for (const link of data.profileLinks) {
    const nextCount = (counts.get(link.type) || 0) + 1;
    counts.set(link.type, nextCount);

    if (nextCount > getLinkTypeLimit(link.type)) {
      const label = link.type === "whatsapp" ? "WhatsApp" : link.label || link.type;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["profileLinks"],
        message: link.type === "whatsapp"
          ? "Solo puedes guardar hasta 2 enlaces de WhatsApp."
          : `Solo puedes guardar 1 enlace para ${label}.`,
      });
      break;
    }
  }

  if (data.contactCard.whatsappLinkId) {
    const exists = data.profileLinks.some((link) => link.type === "whatsapp" && link.id === data.contactCard.whatsappLinkId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contactCard", "whatsappLinkId"],
        message: "Selecciona un WhatsApp válido para el contacto.",
      });
    }
  }

  const actionLinks = data.profileLinks.filter((link) => link.type !== "payment_key" && !isSocialLinkType(link.type));
  const priorityOneCount = actionLinks.filter((link) => link.priorityTier === 1).length;
  const priorityTwoCount = actionLinks.filter((link) => link.priorityTier === 2).length;

  if (priorityOneCount > LINK_PRIORITY_LIMITS[1]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["profileLinks"],
      message: "Solo puedes dejar 1 botón en prioridad 1.",
    });
  }

  if (priorityTwoCount > LINK_PRIORITY_LIMITS[2]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["profileLinks"],
      message: "Solo puedes dejar hasta 2 botones en prioridad 2.",
    });
  }

  const configuredPaymentMethods = data.paymentMethods.filter((method) => method.entityId || method.accountNumber || method.brebKey);
  if (configuredPaymentMethods.length > 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["paymentMethods"],
      message: "Solo puedes configurar hasta 2 métodos de pago.",
    });
  }
});

export const priceSchema = z.object({
  annualPrice: z.coerce.number().min(0).max(1_000_000),
});

export const adminSettingsSchema = z.object({
  annualPrice: z.coerce.number().min(0).max(1_000_000),
  basicAnnualPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  commercialAnnualPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  plusAnnualPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  proAnnualPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  trialDays: z.coerce.number().int().min(0).max(90),
  renewalAlertDays: z.coerce.number().int().min(0).max(60),
  renewalMode: z.enum(["manual", "automatic"]),
  trialExpiredMessage: z.string().trim().max(240),
  paidExpiredMessage: z.string().trim().max(240),
  convenioDefaultDays: z.coerce.number().int().min(1).max(3650),
  partnerDefaultPrice: z.coerce.number().min(0).max(1_000_000),
  agencyAnnualPrice: z.coerce.number().min(0).max(1_000_000),
});

export const adminUserDetailsSchema = z.object({
  businessName: z.string().trim().min(2).max(80),
  ownerName: z.string().trim().max(80),
  phone: z.string().trim().max(30),
  city: z.string().trim().max(80),
  businessCategory: z.enum(["food_drink", "retail_sales", "services", "health_wellness", "tourism_experiences"]),
  origin: z.enum(ADMIN_ORIGIN_VALUES),
  partnerId: z.string().trim().max(80),
  plan: z.enum(ADMIN_PLAN_VALUES),
  adminNotes: z.string().trim().max(1200),
});

export const adminUserAccessSchema = z.object({
  plan: z.enum(ADMIN_PLAN_VALUES),
  accountStatus: z.enum(ADMIN_ACCOUNT_STATUS_VALUES),
  startsAt: z.string().trim().max(40).optional().default(""),
  expiresAt: z.string().trim().max(40).optional().default(""),
});

export const adminUserExtensionSchema = z.object({
  days: z.coerce.number().int().min(1).max(3650),
});

export const adminManualPaymentSchema = z.object({
  amount: z.coerce.number().positive().max(10_000_000),
  plan: z.enum(ADMIN_PLAN_VALUES).default("commercial"),
  durationDays: z.coerce.number().int().min(1).max(3650).optional(),
  method: z.string().trim().min(2).max(60).default("manual"),
  notes: z.string().trim().max(240).default(""),
});

export const recoverySchema = z.object({
  backupEmail: z.string().trim().toLowerCase().email("Ingresa un correo de respaldo válido").or(z.literal("")),
  recoveryPhone: z.string().trim().max(30, "El teléfono es demasiado largo"),
});

export const commerceConfigSchema = z.object({
  activeMode: z.enum(COMMERCE_MODE_VALUES),
  orderWhatsapp: z.string().trim().max(20),
  currency: z.string().trim().max(5).default("COP"),
});

export const commerceCategorySchema = z.object({
  id: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2, "La categoría debe tener al menos 2 caracteres").max(80),
});

export const commerceSubcategorySchema = z.object({
  id: z.string().trim().max(80).optional(),
  categoryId: z.string().trim().min(1, "Selecciona una categoría"),
  name: z.string().trim().min(2, "La subcategoría debe tener al menos 2 caracteres").max(80),
});

export const commerceProductSchema = z.object({
  id: z.string().trim().max(80).optional(),
  mode: z.enum(["mitienda", "mimenu", "micatalogo"]),
  categoryId: z.string().trim().min(1, "Selecciona una categoría"),
  subcategoryId: z.string().trim().max(80).default(""),
  name: z.string().trim().min(2, "El producto debe tener un nombre").max(120),
  description: z.string().trim().max(400).default(""),
  removedImageIds: z.array(z.string().trim().min(1).max(120)).default([]),
  price: z.union([
    z.number(),
    z.string().trim(),
    z.null(),
    z.undefined(),
  ]).optional(),
  visible: z.boolean().default(true),
  featuredInDorika: z.boolean().default(false),
}).superRefine((data, ctx) => {
  const rawPrice = typeof data.price === "number"
    ? data.price
    : typeof data.price === "string" && data.price.trim()
      ? Number(data.price)
      : null;

  if (requiresCommercePrice(data.mode) && (rawPrice === null || Number.isNaN(rawPrice) || rawPrice <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: "El precio es obligatorio en Mi tienda y Mi menú.",
    });
  }

  if (rawPrice !== null && !Number.isNaN(rawPrice) && rawPrice < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: "El precio no puede ser negativo.",
    });
  }
});

export const bookingDayScheduleSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  isOpen: z.boolean().optional(),
  isWorking: z.boolean().optional(),
  shiftMode: z.enum(["continuous", "split"]).default("continuous"),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
  secondStartTime: z.string().trim().regex(/^\d{2}:\d{2}$/).default("14:00"),
  secondEndTime: z.string().trim().regex(/^\d{2}:\d{2}$/).default("18:00"),
}).superRefine((data, ctx) => {
  const startMinutes = Number(data.startTime.slice(0, 2)) * 60 + Number(data.startTime.slice(3, 5));
  const endMinutes = Number(data.endTime.slice(0, 2)) * 60 + Number(data.endTime.slice(3, 5));
  if ((data.isOpen !== false || data.isWorking !== false) && endMinutes <= startMinutes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "La hora final debe ser mayor que la hora inicial.",
    });
  }

  if (data.shiftMode === "split" && (data.isOpen !== false || data.isWorking !== false)) {
    const secondStartMinutes = Number(data.secondStartTime.slice(0, 2)) * 60 + Number(data.secondStartTime.slice(3, 5));
    const secondEndMinutes = Number(data.secondEndTime.slice(0, 2)) * 60 + Number(data.secondEndTime.slice(3, 5));

    if (secondEndMinutes <= secondStartMinutes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secondEndTime"],
        message: "La hora final de la tarde debe ser mayor que la inicial.",
      });
    }

    if (secondStartMinutes <= endMinutes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secondStartTime"],
        message: "La jornada de la tarde debe empezar después de la mañana.",
      });
    }
  }
});

export const bookingConfigSchema = z.object({
  enabled: z.boolean().default(false),
  allowStaffSelection: z.boolean().default(true),
  autoConfirmBooking: z.boolean().default(false),
  whatsappNumber: z.string().trim().max(20).default(""),
  noticeMinutes: z.coerce.number().int().min(0).max(1440).default(60),
  maxDaysAhead: z.coerce.number().int().min(1).max(120).default(30),
  businessSchedule: z.array(bookingDayScheduleSchema).length(7),
});

export const bookingServiceSchema = z.object({
  id: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2, "El servicio debe tener un nombre").max(120),
  description: z.string().trim().max(400).default(""),
  durationMinutes: z.coerce.number().int().min(5, "La duración mínima es 5 minutos").max(480),
  price: z.union([
    z.number(),
    z.string().trim(),
    z.null(),
    z.undefined(),
  ]).optional(),
  isActive: z.boolean().default(true),
  staffIds: z.array(z.string().trim().min(1)).default([]),
});

export const bookingStaffSchema = z.object({
  id: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2, "El profesional debe tener un nombre").max(120),
  roleOrSpecialty: z.string().trim().max(80).default(""),
  isActive: z.boolean().default(true),
  serviceIds: z.array(z.string().trim().min(1)).default([]),
  schedule: z.array(bookingDayScheduleSchema).length(7),
});

export const bookingAppointmentCreateSchema = z.object({
  serviceId: z.string().trim().min(1, "Selecciona un servicio"),
  staffId: z.string().trim().max(80).default(""),
  appointmentDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida"),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Selecciona una hora válida"),
  customerName: z.string().trim().min(2, "Ingresa el nombre del cliente").max(120),
  customerPhone: z.string().trim().min(7, "Ingresa un teléfono válido").max(30),
  customerNote: z.string().trim().max(300).default(""),
});

export const bookingAppointmentStatusSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(BOOKING_STATUS_VALUES),
});

export const commerceCheckoutSchema = z.object({
  customerName: z.string().trim().min(2, "Escribe tu nombre").max(80),
  address: z.string().trim().min(4, "Escribe una dirección").max(160),
  phone: z.string().trim().min(7, "Escribe un teléfono válido").max(20),
  notes: z.string().trim().max(240).default(""),
  items: z.array(z.object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    price: z.number().nonnegative(),
    quantity: z.number().int().min(1).max(99),
  })).min(1, "Agrega al menos un producto al carrito"),
});
