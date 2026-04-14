import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://dorika.com.co"),
  title: "Dorika | Explora Ocaña",
  description: "Rutas, negocios y experiencias locales para descubrir Ocaña de una forma humana y cercana.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
