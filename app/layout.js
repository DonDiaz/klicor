import "@/app/globals.css";

export const metadata = {
  title: "BioImpulso",
  description: "Tu link in bio profesional para negocios y emprendedores.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
