import { z } from "zod";

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

export const profileSchema = z.object({
  businessName: z.string().trim().min(3, "El nombre del negocio es obligatorio").max(80),
  username: z.string().trim().min(3, "El usuario debe tener mínimo 3 caracteres").max(30),
  profileLinks: z.array(profileLinkSchema).max(20),
  accent: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  surface: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  text: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color inválido"),
  buttonOpacity: z.coerce.number().min(0.2).max(1),
  mode: z.enum(["light", "dark"]),
});

export const priceSchema = z.object({
  annualPrice: z.coerce.number().min(50000).max(60000),
});
