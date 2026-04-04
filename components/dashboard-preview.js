"use client";

import { useEffect, useRef, useState } from "react";
import { LandingView } from "@/components/landing-view";

const PREVIEW_WIDTH = 390;
const PREVIEW_HEIGHT = 844;
const PREVIEW_SAFE_SCALE = 0.96;

export function DashboardPreview({ user }) {
  const shellRef = useRef(null);
  const stageRef = useRef(null);
  const [metrics, setMetrics] = useState({
    scale: 1,
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
  });

  useEffect(() => {
    const shell = shellRef.current;
    const stage = stageRef.current;
    if (!shell || !stage) return undefined;

    let frame = 0;

    const update = () => {
      const availableWidth = Math.max((shell.clientWidth || PREVIEW_WIDTH) - 18, 0);
      const availableHeight = Math.max((shell.clientHeight || PREVIEW_HEIGHT) - 24, 0);
      const fitScale = Math.min(availableWidth / PREVIEW_WIDTH, availableHeight / PREVIEW_HEIGHT, 1);
      const scale = Math.max(Math.min(fitScale * PREVIEW_SAFE_SCALE, 1), 0.1);

      setMetrics({
        scale,
        width: PREVIEW_WIDTH * scale,
        height: PREVIEW_HEIGHT * scale,
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
            height: `${PREVIEW_HEIGHT}px`,
            transform: `scale(${metrics.scale})`,
          }}
        >
          <LandingView user={user} preview />
        </div>
      </div>
    </div>
  );
}
