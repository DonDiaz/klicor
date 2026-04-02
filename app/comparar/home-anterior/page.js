import Link from "next/link";
import { ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { HomeComparePrevious } from "@/components/home-compare-previous";

export default function ComparePreviousHomePage() {
  return (
    <>
      <div className="compare-banner">
        <div className="shell compare-banner-inner">
          <div className="compare-banner-copy">
            <ArrowLeftRight size={16} />
            <span>Versión anterior del home guardada para comparación.</span>
          </div>
          <div className="compare-banner-actions">
            <Link href="/">Ver home nuevo</Link>
            <a href="#top">
              Ir arriba <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>
      <div id="top">
        <HomeComparePrevious />
      </div>
    </>
  );
}
