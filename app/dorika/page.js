import { DorikaHome } from "@/components/dorika-home";
import { getDorikaPublicSnapshot } from "@/lib/dorika-firestore";

export const metadata = {
  title: "Dorika | Negocios, rutas y experiencias",
  description: "Explora negocios, productos, rutas y lugares con una guía local clara, humana y confiable.",
  openGraph: {
    title: "Dorika",
    description: "Negocios, rutas y experiencias organizadas para descubrir qué hacer, dónde comprar y qué visitar.",
  },
};

export default async function DorikaPage() {
  const snapshot = await getDorikaPublicSnapshot();
  return <DorikaHome snapshot={snapshot} />;
}
