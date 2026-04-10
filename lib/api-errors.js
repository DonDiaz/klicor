import { ZodError } from "zod";

export function formatApiError(error, fallback = "Ocurrió un error.") {
  if (!error) return fallback;

  if (error instanceof ZodError) {
    return error.issues?.[0]?.message || fallback;
  }

  if (Array.isArray(error?.issues) && error.issues.length) {
    return error.issues[0]?.message || fallback;
  }

  const rawMessage = String(error?.message || "").trim();
  if (!rawMessage) return fallback;

  if (rawMessage.startsWith("[") && rawMessage.endsWith("]")) {
    try {
      const parsed = JSON.parse(rawMessage);
      if (Array.isArray(parsed) && parsed.length) {
        const firstIssue = parsed.find((item) => item?.message) || parsed[0];
        return String(firstIssue?.message || rawMessage).trim() || fallback;
      }
    } catch {
      // Keep the original message when it is not valid JSON.
    }
  }

  return rawMessage;
}
