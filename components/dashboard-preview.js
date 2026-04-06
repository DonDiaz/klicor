"use client";

import { useEffect, useRef, useState } from "react";
import { CommercePublicView } from "@/components/commerce-public-view";
import { LandingView } from "@/components/landing-view";

const PREVIEW_WIDTH = 390;
const PREVIEW_HEIGHT = 844;
const PREVIEW_SAFE_SCALE = 0.96;
const MOBILE_INLINE_PREVIEW_BREAKPOINT = 760;

export function DashboardPreview({ user, previewMode = "landing", commerceBootstrap = null }) {
  const shellRef = useRef(null);
  const [inlinePreview, setInlinePreview] = useState(false);
  const [metrics, setMetrics] = useState({
    scale: 1,
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
  });

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return undefined;

    let frame = 0;

    const update = () => {
      const viewportWidth = window.innerWidth || shell.clientWidth || PREVIEW_WIDTH;
      const shouldUseInlinePreview = viewportWidth < MOBILE_INLINE_PREVIEW_BREAKPOINT;
      setInlinePreview(shouldUseInlinePreview);

      if (shouldUseInlinePreview) {
        return;
      }

      const availableWidth = Math.max((shell.clientWidth || PREVIEW_WIDTH) - 18, 0);
      const availableHeight = Math.max((shell.clientHeight || PREVIEW_HEIGHT) - 24, 0);
      const frameScale = Math.min(availableWidth / PREVIEW_WIDTH, availableHeight / PREVIEW_HEIGHT, 1);
      const scale = Math.max(Math.min(frameScale * PREVIEW_SAFE_SCALE, 1), 0.1);

      setMetrics({
        scale,
        width: PREVIEW_WIDTH * frameScale * PREVIEW_SAFE_SCALE,
        height: PREVIEW_HEIGHT * frameScale * PREVIEW_SAFE_SCALE,
      });
    };

    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    const observer = new ResizeObserver(onResize);
    observer.observe(shell);
    update();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [user]);

  if (inlinePreview) {
    return (
      <div ref={shellRef} className="dashboard-preview-fit-shell is-inline-preview">
        <div className="dashboard-preview-mobile-stage">
          {previewMode === "commerce" && commerceBootstrap ? (
            <CommercePublicView bootstrap={commerceBootstrap} preview />
          ) : (
            <LandingView user={user} preview />
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={shellRef} className="dashboard-preview-fit-shell">
      <div
        className="dashboard-preview-fit-inner"
        style={{
          width: `${metrics.width}px`,
          height: `${metrics.height}px`,
        }}
      >
        <div
          className="dashboard-preview-fit-stage"
          style={{
            width: `${PREVIEW_WIDTH}px`,
            height: `${PREVIEW_HEIGHT}px`,
            transform: `translateX(-50%) scale(${metrics.scale})`,
          }}
        >
          {previewMode === "commerce" && commerceBootstrap ? (
            <CommercePublicView bootstrap={commerceBootstrap} preview />
          ) : (
            <LandingView user={user} preview />
          )}
        </div>
      </div>
    </div>
  );
}
