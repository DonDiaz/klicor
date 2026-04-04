import { Inter } from "next/font/google";
import Script from "next/script";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://klicor.com"),
  title: "Klicor",
  description: "Klicor - todos tus enlaces en un solo lugar.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-32x32.png"],
  },
  openGraph: {
    title: "Klicor",
    description: "Klicor - todos tus enlaces en un solo lugar.",
    images: [
      {
        url: "/klicor-icon.png",
        width: 622,
        height: 622,
        alt: "Icono oficial de Klicor",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Klicor",
    description: "Klicor - todos tus enlaces en un solo lugar.",
    images: ["/klicor-icon.png"],
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#08111F" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <head>
        <Script id="theme-mode-script" strategy="beforeInteractive">
          {`
            (() => {
              const root = document.documentElement;
              const media = window.matchMedia("(prefers-color-scheme: dark)");
              const storageKey = "klicor-theme-preference";
              const applyTheme = () => {
                const savedTheme = window.localStorage.getItem(storageKey);
                root.dataset.theme = savedTheme === "dark" || savedTheme === "light"
                  ? savedTheme
                  : media.matches
                    ? "dark"
                    : "light";
              };

              applyTheme();

              if (typeof media.addEventListener === "function") {
                media.addEventListener("change", applyTheme);
              } else if (typeof media.addListener === "function") {
                media.addListener(applyTheme);
              }
            })();
          `}
        </Script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
