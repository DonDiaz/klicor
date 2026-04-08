import { performance } from "node:perf_hooks";

function sanitizeMetricName(name = "") {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "metric";
}

function serializeMetrics(metrics = []) {
  return metrics
    .filter((metric) => Number.isFinite(metric.duration))
    .map((metric) => {
      const parts = [
        sanitizeMetricName(metric.name),
        `dur=${Number(metric.duration).toFixed(1)}`,
      ];
      if (metric.description) {
        parts.push(`desc="${String(metric.description).replace(/"/g, "'")}"`);
      }
      return parts.join(";");
    })
    .join(", ");
}

export function createServerTiming() {
  const startedAt = performance.now();
  const metrics = [];

  return {
    async measure(name, task, description = "") {
      const metricStartedAt = performance.now();
      const result = await task();
      metrics.push({
        name,
        duration: performance.now() - metricStartedAt,
        description,
      });
      return result;
    },

    add(name, duration, description = "") {
      metrics.push({
        name,
        duration,
        description,
      });
    },

    headers(payload = null, extraHeaders = {}) {
      const headers = new Headers(extraHeaders);
      const timedMetrics = [
        ...metrics,
        {
          name: "total",
          duration: performance.now() - startedAt,
          description: "request",
        },
      ];
      const serverTiming = serializeMetrics(timedMetrics);

      if (serverTiming) {
        headers.set("Server-Timing", serverTiming);
        headers.set("Timing-Allow-Origin", "*");
      }

      if (payload !== null && payload !== undefined) {
        headers.set("X-Klicor-Payload-Bytes", String(new TextEncoder().encode(JSON.stringify(payload)).length));
      }

      return headers;
    },
  };
}
