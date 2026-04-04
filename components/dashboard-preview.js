"use client";

import { useEffect, useRef, useState } from "react";
import { LandingView } from "@/components/landing-view";

const PREVIEW_WIDTH = 390;

export function DashboardPreview({ user }) {
  const shellRef = useRef(null);
  const stageRef = useRef(null);
  const [metrics, setMetrics] = useState({
    scale: 1,
    width: PREVIEW_WIDTH,
    height: 640,
  });

  useEffect(() => {
    const shell = shellRef.current;
    const stage = stageRef.current;
    if (!shell || !stage) return undefined;

    let frame = 0;

    const update = () => {
      const availableWidth = shell.clientWidth || PREVIEW_WIDTH;
      const availableHeight = shell.clientHeight || 640;
      const naturalWidth = stage.scrollWidth || PREVIEW_WIDTH;
      const naturalHeight = stage.scrollHeight || 640;
      const scale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight, 1);

      setMetrics({
        scale,
        width: naturalWidth * scale,
        height: naturalHeight * scale,
      });
    };

    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    const observer = new ResizeObserver(onResize);
    observer.observe(shell);
    observer.observe(stage);
    update();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [user]);

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
          ref={stageRef}
          className="dashboard-preview-fit-stage"
          style={{
            width: `${PREVIEW_WIDTH}px`,
            transform: `scale(${metrics.scale})`,
          }}
        >
          <LandingView user={user} preview />
        </div>
      </div>
    </div>
  );
}
