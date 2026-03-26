import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bioimpulso-saa-s.vercel.app"),
  title: "Linka",
  description: "Linka — todos tus enlaces en un solo lugar.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: "Linka",
    description: "Linka — todos tus enlaces en un solo lugar.",
    images: [
      {
        url: "/linka-icon.png",
        width: 622,
        height: 622,
        alt: "Ícono oficial de Linka",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Linka",
    description: "Linka — todos tus enlaces en un solo lugar.",
    images: ["/linka-icon.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
