import { z } from "zod";

export const authSchema = z.object({
  email: z.email("Ingresa un correo valido"),
  password: z.string().min(6, "La contrasena debe tener minimo 6 caracteres"),
});

export const profileSchema = z.object({
  businessName: z.string().trim().min(3, "El nombre del negocio es obligatorio").max(80),
  username: z.string().trim().min(3, "El usuario debe tener minimo 3 caracteres").max(30),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  instagram: z.string().trim().max(120).optional().or(z.literal("")),
  facebook: z.string().trim().max(120).optional().or(z.literal("")),
  tiktok: z.string().trim().max(120).optional().or(z.literal("")),
  website: z.string().trim().max(160).optional().or(z.literal("")),
  accent: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color invalido"),
  surface: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color invalido"),
  text: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color invalido"),
  mode: z.enum(["light", "dark"]),
});

export const priceSchema = z.object({
  annualPrice: z.coerce.number().min(50000).max(60000)
});
