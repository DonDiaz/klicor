import { z } from "zod";
import { getLinkTypeLimit } from "@/lib/link-catalog";

export const authSchema = z.object({
  email: z.email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener mínimo 6 caracteres"),
});

export const profileLinkSchema = z.object({
  id: z.string().trim().min(1),
  type: z.string().trim().min(1),
  label: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(300),
  message: z.string().trim().max(240).optional().default(""),
});

export const contactCardSchema = z.object({
  enabled: z.boolean(),
  name: z.string().trim().max(80),
  title: z.string().trim().max(80),
  whatsappLinkId: z.string().trim().max(120),
  phone: z.string().trim().max(30),
});

export const appearanceSchema = z.object({
  presetId: z.string().trim().min(1),
  advancedEnabled: z.boolean(),
  backgroundStyle: z.enum(["solid", "gradient"]),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  surfaceColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
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
  profileLinks: z.array(profileLinkSchema).max(20),
  appearance: appearanceSchema,
  contactCard: contactCardSchema,
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
        message: "Selecciona un WhatsApp valido para el contacto.",
      });
    }
  }
});

export const priceSchema = z.object({
  annualPrice: z.coerce.number().min(50000).max(60000),
});

export const recoverySchema = z.object({
  backupEmail: z.string().trim().toLowerCase().email("Ingresa un correo de respaldo válido").or(z.literal("")),
  recoveryPhone: z.string().trim().max(30, "El teléfono es demasiado largo"),
});
