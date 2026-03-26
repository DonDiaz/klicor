import { LandingView } from "@/components/landing-view";
import { STATIC_DEMO_PROFILE } from "@/lib/static-demo-profile";

export function MarketingPreview() {
  return (
    <div className="preview-frame marketing-demo-frame">
      <div className="marketing-demo-surface">
        <LandingView user={STATIC_DEMO_PROFILE} preview />
      </div>
    </div>
  );
}
