import {
  Inter,
  Manrope,
  DM_Sans,
  Poppins,
  Outfit,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  Sora,
  Nunito,
  Rubik,
  Lora,
  Merriweather,
  Playfair_Display,
  Cormorant_Garamond,
  Fraunces,
  Bitter,
  Oswald,
  Bebas_Neue,
  Barlow_Condensed,
  Roboto_Slab,
} from "next/font/google";

export const bodyFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora",
});

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
  weight: ["400", "500", "700"],
});

const rubik = Rubik({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-rubik",
});

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-merriweather",
  weight: ["300", "400", "700"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cormorant",
  weight: ["400", "500", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const bitter = Bitter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bitter",
});

const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-oswald",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bebas",
  weight: "400",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow-condensed",
  weight: ["400", "500", "700"],
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-slab",
});

export const fontVariableClassName = [
  bodyFont.variable,
  manrope.variable,
  dmSans.variable,
  poppins.variable,
  outfit.variable,
  plusJakartaSans.variable,
  spaceGrotesk.variable,
  sora.variable,
  nunito.variable,
  rubik.variable,
  lora.variable,
  merriweather.variable,
  playfairDisplay.variable,
  cormorantGaramond.variable,
  fraunces.variable,
  bitter.variable,
  oswald.variable,
  bebasNeue.variable,
  barlowCondensed.variable,
  robotoSlab.variable,
].join(" ");

export const FONT_FAMILY_STYLE_MAP = {
  inter: 'var(--font-inter), "Segoe UI", sans-serif',
  manrope: 'var(--font-manrope), "Segoe UI", sans-serif',
  "dm-sans": 'var(--font-dm-sans), "Segoe UI", sans-serif',
  poppins: 'var(--font-poppins), "Segoe UI", sans-serif',
  outfit: 'var(--font-outfit), "Segoe UI", sans-serif',
  "plus-jakarta-sans": 'var(--font-plus-jakarta), "Segoe UI", sans-serif',
  "space-grotesk": 'var(--font-space-grotesk), "Segoe UI", sans-serif',
  sora: 'var(--font-sora), "Segoe UI", sans-serif',
  nunito: 'var(--font-nunito), "Segoe UI", sans-serif',
  rubik: 'var(--font-rubik), "Segoe UI", sans-serif',
  lora: 'var(--font-lora), Georgia, serif',
  merriweather: 'var(--font-merriweather), Georgia, serif',
  "playfair-display": 'var(--font-playfair), Georgia, serif',
  "cormorant-garamond": 'var(--font-cormorant), Georgia, serif',
  fraunces: 'var(--font-fraunces), Georgia, serif',
  bitter: 'var(--font-bitter), Georgia, serif',
  oswald: 'var(--font-oswald), "Arial Narrow", sans-serif',
  "bebas-neue": 'var(--font-bebas), "Arial Narrow", sans-serif',
  "barlow-condensed": 'var(--font-barlow-condensed), "Arial Narrow", sans-serif',
  "roboto-slab": 'var(--font-roboto-slab), Georgia, serif',
};
