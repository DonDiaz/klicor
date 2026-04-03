import { z } from "zod";
import { isSocialLinkType, LINK_PRIORITY_LIMITS } from "@/lib/business-categories";
import { requiresAccountType } from "@/lib/colombia-financial-entities";
import { getLinkTypeLimit } from "@/lib/link-catalog";

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
  buttonStyle: z.enum(["solid", "outline", "soft"]),
  buttonRadius: z.enum(["rounded", "square"]),
  cardTransparency: z.enum(["solid", "soft"]),
  cardShadow: z.enum(["none", "soft", "medium"]),
  nameSize: z.enum(["s", "m", "l"]),
  nameWeight: z.enum(["regular", "bold"]),
  avatarShape: z.enum(["circle", "rounded", "soft-square"]),
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
  contactCard: contactCardSchema,
  billingProfile: billingProfileSchema,
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
  annualPrice: z.coerce.number().min(50000).max(60000),
});

export const recoverySchema = z.object({
  backupEmail: z.string().trim().toLowerCase().email("Ingresa un correo de respaldo válido").or(z.literal("")),
  recoveryPhone: z.string().trim().max(30, "El teléfono es demasiado largo"),
});
