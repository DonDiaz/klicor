import Script from "next/script";
import "@/app/globals.css";
import { bodyFont, fontVariableClassName } from "@/app/fonts";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://klicor.com"),
  title: "Klicor",
  description: "Klicor - todos tus enlaces en un solo lugar.",
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
  themeColor: "#F8FAFC",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <head>
        <Script id="theme-mode-script" strategy="beforeInteractive">
          {`
            (() => {
              const root = document.documentElement;
              const storageKey = "klicor-theme-preference";
              const applyTheme = () => {
                if (window.location.pathname.startsWith("/admin")) {
                  root.dataset.theme = "light";
                  return;
                }
                const savedTheme = window.localStorage.getItem(storageKey);
                root.dataset.theme = savedTheme === "dark" || savedTheme === "light"
                  ? savedTheme
                  : "light";
              };

              applyTheme();
            })();
          `}
        </Script>
      </head>
      <body className={`${bodyFont.className} ${fontVariableClassName}`}>{children}</body>
    </html>
  );
}
