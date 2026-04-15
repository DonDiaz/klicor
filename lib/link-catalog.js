import {
  CalendarDays,
  Globe,
  Mail,
  MapPin,
  ShoppingBag,
} from "lucide-react";

function BrandIcon({ children, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  );
}

export function WhatsAppIcon(props) {
  return (
    <BrandIcon {...props}>
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.55 0 .23 5.31.23 11.85c0 2.09.54 4.13 1.56 5.94L0 24l6.37-1.67a11.82 11.82 0 0 0 5.67 1.45h.01c6.52 0 11.84-5.31 11.85-11.85a11.76 11.76 0 0 0-3.38-8.45ZM12.05 21.7h-.01a9.83 9.83 0 0 1-5-1.37l-.36-.21-3.78.99 1.01-3.69-.23-.38a9.77 9.77 0 0 1-1.5-5.18c0-5.42 4.42-9.84 9.87-9.84 2.64 0 5.12 1.03 6.98 2.89a9.77 9.77 0 0 1 2.89 6.97c0 5.43-4.43 9.84-9.87 9.84Zm5.39-7.35c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.24-.46-2.37-1.48-.88-.78-1.47-1.74-1.64-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.34.44-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.45s1.07 2.84 1.22 3.04c.15.2 2.09 3.19 5.06 4.47.71.31 1.27.5 1.7.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.31.17-1.43-.07-.12-.27-.2-.57-.35Z" />
    </BrandIcon>
  );
}

export function InstagramIcon(props) {
  return (
    <BrandIcon {...props}>
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.95 1.35a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 6.86A5.14 5.14 0 1 1 6.86 12 5.15 5.15 0 0 1 12 6.86Zm0 1.8A3.34 3.34 0 1 0 15.34 12 3.35 3.35 0 0 0 12 8.66Z" />
    </BrandIcon>
  );
}

export function FacebookIcon(props) {
  return (
    <BrandIcon {...props}>
      <path d="M13.5 22v-8h2.7l.4-3.12h-3.1V8.9c0-.9.25-1.5 1.55-1.5H16.7V4.62c-.29-.04-1.28-.12-2.43-.12-2.4 0-4.04 1.47-4.04 4.17v2.22H7.5V14h2.73v8h3.27Z" />
    </BrandIcon>
  );
}

export function TikTokIcon(props) {
  return (
    <BrandIcon {...props}>
      <path d="M14.78 2h2.63c.18 1.54 1.1 3.01 2.57 3.83v2.72a7.02 7.02 0 0 1-3.15-.84v6.05a5.76 5.76 0 1 1-5.02-5.72v2.8a2.96 2.96 0 1 0 2.97 2.96V2Z" />
    </BrandIcon>
  );
}

export function PaymentKeyIcon(props) {
  return (
    <BrandIcon {...props}>
      <path d="M7 4h10a2 2 0 0 1 2 2v3h-2V6H7v3H5V6a2 2 0 0 1 2-2Zm-2 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6Zm2 0v6h10v-6H7Zm2 1.5h2v3H9v-3Zm4 0h2v3h-2v-3Z" />
    </BrandIcon>
  );
}

export function YouTubeIcon(props) {
  return (
    <BrandIcon {...props}>
      <path d="M23.5 6.2a3.08 3.08 0 0 0-2.16-2.18C19.39 3.5 12 3.5 12 3.5s-7.39 0-9.34.52A3.08 3.08 0 0 0 .5 6.2 32.2 32.2 0 0 0 0 12a32.2 32.2 0 0 0 .5 5.8 3.08 3.08 0 0 0 2.16 2.18c1.95.52 9.34.52 9.34.52s7.39 0 9.34-.52a3.08 3.08 0 0 0 2.16-2.18A32.2 32.2 0 0 0 24 12a32.2 32.2 0 0 0-.5-5.8ZM9.6 15.55V8.45L15.85 12 9.6 15.55Z" />
    </BrandIcon>
  );
}

export function LinkedInIcon(props) {
  return (
    <BrandIcon {...props}>
      <path d="M4.98 3.5A1.74 1.74 0 1 1 3.24 5.24 1.74 1.74 0 0 1 4.98 3.5ZM3.5 8h2.96v12H3.5Zm4.85 0h2.84v1.64h.04a3.12 3.12 0 0 1 2.81-1.64c3 0 3.56 1.98 3.56 4.56V20h-2.96v-6.59c0-1.57-.03-3.59-2.18-3.59-2.18 0-2.52 1.7-2.52 3.47V20H8.35Z" />
    </BrandIcon>
  );
}

export function TelegramIcon(props) {
  return (
    <BrandIcon {...props}>
      <path d="M21.94 4.56c.3-1.13-.4-1.57-1.27-1.24L2.44 10.35c-1.1.43-1.08 1.05-.2 1.32l4.67 1.46 10.8-6.8c.5-.3.95-.14.57.2l-8.75 7.9-.34 4.8c.5 0 .72-.23 1-.5l2.4-2.33 4.98 3.68c.92.5 1.58.25 1.8-.84l2.57-14.68Z" />
    </BrandIcon>
  );
}

export function XIcon(props) {
  return (
    <BrandIcon {...props}>
      <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.25l-4.9-7.38L5.7 22H2.6l7.25-8.3L1.2 2h6.4l4.43 6.72L18.9 2Zm-1.1 18h1.72L6.28 3.9H4.44L17.8 20Z" />
    </BrandIcon>
  );
}

export function ThreadsIcon(props) {
  return (
    <BrandIcon {...props}>
      <path d="M15.94 11.02c-.11-.05-.22-.1-.34-.14-.06-2.38-1.47-3.7-3.95-3.7-2.55 0-4.17 1.43-4.17 3.43 0 1.7 1.01 2.82 2.93 3.25.95.21 1.97.28 2.75.44 1.08.22 1.59.6 1.59 1.26 0 .85-.88 1.43-2.2 1.43-1.62 0-2.6-.7-2.78-2H6.55c.17 2.76 2.26 4.44 5.68 4.44 3.19 0 5.3-1.6 5.3-4.1 0-1.8-.97-3.06-2.59-3.7Zm-4.63-1.93c1.05 0 1.71.53 1.87 1.52-.68-.09-1.4-.15-2.05-.29-.74-.16-1.08-.47-1.08-.96 0-.57.5-.27 1.26-.27Z" />
      <path d="M12 0C5.38 0 0 5.38 0 12s5.38 12 12 12 12-5.38 12-12S18.62 0 12 0Zm0 22.1C6.43 22.1 1.9 17.57 1.9 12S6.43 1.9 12 1.9 22.1 6.43 22.1 12 17.57 22.1 12 22.1Z" />
    </BrandIcon>
  );
}

export function SpotifyIcon(props) {
  return (
    <BrandIcon {...props}>
      <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.31a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.54-1.16a.75.75 0 1 1-.33-1.46c4.56-1.04 8.49-.6 11.66 1.33.36.22.47.68.24 1.04Zm1.47-3.28a.94.94 0 0 1-1.3.3c-3.23-1.98-8.14-2.56-11.96-1.41a.94.94 0 1 1-.54-1.8c4.37-1.32 9.81-.68 13.48 1.57.44.27.57.85.32 1.34Zm.13-3.42c-3.87-2.3-10.26-2.52-13.96-1.34a1.13 1.13 0 0 1-.69-2.15c4.24-1.3 11.3-1.06 15.8 1.62a1.13 1.13 0 0 1-1.15 1.87Z" />
    </BrandIcon>
  );
}

export function TwitchIcon(props) {
  return (
    <BrandIcon {...props}>
      <path d="M3 2 1 7v13h5v3h3l3-3h4l7-7V2H3Zm18 10-4 4h-5l-3 3v-3H5V4h16v8Zm-4-6h-2v5h2V6Zm-5 0h-2v5h2V6Z" />
    </BrandIcon>
  );
}

export const LINK_CATALOG = [
  { type: "whatsapp", label: "WhatsApp", placeholder: "573001234567", kind: "phone", icon: WhatsAppIcon, maxItems: 2 },
  { type: "email", label: "Correo", placeholder: "hola@tu-negocio.com", kind: "email", icon: Mail, maxItems: 1 },
  { type: "payment_key", label: "Llave Bre-B", placeholder: "Tu llave o alias de pago", kind: "text", icon: PaymentKeyIcon, maxItems: 1 },
  { type: "instagram", label: "Instagram", placeholder: "https://instagram.com/tu_marca", kind: "url", icon: InstagramIcon, maxItems: 1 },
  { type: "facebook", label: "Facebook", placeholder: "https://facebook.com/tu_marca", kind: "url", icon: FacebookIcon, maxItems: 1 },
  { type: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@tu_marca", kind: "url", icon: TikTokIcon, maxItems: 1 },
  { type: "booking", label: "Agenda", placeholder: "https://klicor.com/tu-negocio/agenda", kind: "url", icon: CalendarDays, maxItems: 1 },
  { type: "website", label: "Página web", placeholder: "https://tu-negocio.com", kind: "url", icon: Globe, maxItems: 1 },
  { type: "youtube", label: "YouTube", placeholder: "https://youtube.com/@tu_canal", kind: "url", icon: YouTubeIcon, maxItems: 1 },
  { type: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/tu-perfil", kind: "url", icon: LinkedInIcon, maxItems: 1 },
  { type: "telegram", label: "Telegram", placeholder: "https://t.me/tu_usuario", kind: "url", icon: TelegramIcon, maxItems: 1 },
  { type: "x", label: "X", placeholder: "https://x.com/tu_usuario", kind: "url", icon: XIcon, maxItems: 1 },
  { type: "threads", label: "Threads", placeholder: "https://threads.net/@tu_usuario", kind: "url", icon: ThreadsIcon, maxItems: 1 },
  { type: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/...", kind: "url", icon: SpotifyIcon, maxItems: 1 },
  { type: "maps", label: "Google Maps", placeholder: "https://maps.app.goo.gl/...", kind: "url", icon: MapPin, maxItems: 1 },
  { type: "marketplace", label: "Tienda", placeholder: "https://mercadolibre.com/...", kind: "url", icon: ShoppingBag, maxItems: 1 },
  { type: "twitch", label: "Twitch", placeholder: "https://twitch.tv/tu_canal", kind: "url", icon: TwitchIcon, maxItems: 1 },
];

export const LINK_CATALOG_MAP = Object.fromEntries(LINK_CATALOG.map((item) => [item.type, item]));

export function getLinkTypeLimit(type) {
  return LINK_CATALOG_MAP[type]?.maxItems ?? 1;
}

export function getLinkTypeCount(profileLinks, type) {
  return profileLinks.filter((item) => item.type === type).length;
}

export function canAddLinkType(profileLinks, type) {
  return getLinkTypeCount(profileLinks, type) < getLinkTypeLimit(type);
}
