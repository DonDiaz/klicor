import {
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  MessageCircleMore,
  Music2,
  Send,
  ShoppingBag,
  Twitch,
  Youtube,
} from "lucide-react";

export const LINK_CATALOG = [
  { type: "whatsapp", label: "WhatsApp", placeholder: "573001234567", kind: "phone", icon: MessageCircleMore },
  { type: "instagram", label: "Instagram", placeholder: "https://instagram.com/tu_marca", kind: "url", icon: Instagram },
  { type: "facebook", label: "Facebook", placeholder: "https://facebook.com/tu_marca", kind: "url", icon: Facebook },
  { type: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@tu_marca", kind: "url", icon: Music2 },
  { type: "website", label: "Página web", placeholder: "https://tu-negocio.com", kind: "url", icon: Globe },
  { type: "youtube", label: "YouTube", placeholder: "https://youtube.com/@tu_canal", kind: "url", icon: Youtube },
  { type: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/tu-perfil", kind: "url", icon: Linkedin },
  { type: "telegram", label: "Telegram", placeholder: "https://t.me/tu_usuario", kind: "url", icon: Send },
  { type: "x", label: "X", placeholder: "https://x.com/tu_usuario", kind: "url", icon: Globe },
  { type: "threads", label: "Threads", placeholder: "https://threads.net/@tu_usuario", kind: "url", icon: Globe },
  { type: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/...", kind: "url", icon: Music2 },
  { type: "maps", label: "Google Maps", placeholder: "https://maps.app.goo.gl/...", kind: "url", icon: MapPin },
  { type: "marketplace", label: "Tienda", placeholder: "https://mercadolibre.com/...", kind: "url", icon: ShoppingBag },
  { type: "twitch", label: "Twitch", placeholder: "https://twitch.tv/tu_canal", kind: "url", icon: Twitch },
];

export const LINK_CATALOG_MAP = Object.fromEntries(LINK_CATALOG.map((item) => [item.type, item]));
