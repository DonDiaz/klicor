"use client";

import { Component, useEffect, useRef, useState } from "react";
import { CommercePublicView } from "@/components/commerce-public-view";
import { LandingView } from "@/components/landing-view";

const PREVIEW_WIDTH = 390;
const PREVIEW_HEIGHT = 844;
const PREVIEW_SAFE_SCALE = 0.96;
const MOBILE_INLINE_PREVIEW_BREAKPOINT = 760;

class PreviewErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (
      this.state.hasError &&
      (prevProps.previewMode !== this.props.previewMode || prevProps.resetKey !== this.props.resetKey)
    ) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="preview-placeholder-card">
          <strong>No pudimos cargar esta vista previa</strong>
          <p className="section-copy">Recarga el módulo o guarda los cambios para regenerar la representación comercial.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

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
        <PreviewErrorBoundary previewMode={previewMode} resetKey={commerceBootstrap?.mode || user?.username || ""}>
          <div className="dashboard-preview-mobile-stage">
            {previewMode === "commerce" && commerceBootstrap ? (
              <CommercePublicView bootstrap={commerceBootstrap} preview />
            ) : (
              <LandingView user={user} preview />
            )}
          </div>
        </PreviewErrorBoundary>
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
        <PreviewErrorBoundary previewMode={previewMode} resetKey={commerceBootstrap?.mode || user?.username || ""}>
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
        </PreviewErrorBoundary>
      </div>
    </div>
  );
}
