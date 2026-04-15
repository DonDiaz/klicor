"use client";

function notifyExpiredSession() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("klicor-auth-expired"));
}

function isAuthError(status, message = "") {
  const text = String(message || "").toLowerCase();
  return status === 401
    || status === 403
    || text.includes("auth")
    || text.includes("token")
    || text.includes("sesión")
    || text.includes("session")
    || text.includes("expired")
    || text.includes("no autorizado");
}

async function readCurrentUserToken() {
  if (typeof window === "undefined") return "";
  const { getClientAuth } = await import("@/lib/firebase-client");
  const auth = getClientAuth();
  if (!auth?.currentUser) return "";

  try {
    return await auth.currentUser.getIdToken();
  } catch {
    notifyExpiredSession();
    throw new Error("Tu sesión venció. Vuelve a iniciar sesión.");
  }
}

async function resolveFreshToken(token = "") {
  if (!token || typeof window === "undefined") return token;
  return await readCurrentUserToken() || token;
}

export async function getFreshAuthToken() {
  return readCurrentUserToken();
}

export async function apiFetch(path, { token, body, method = "GET", isFormData = false } = {}) {
  const requestToken = await resolveFreshToken(token);
  const response = await fetch(path, {
    method,
    headers: {
      ...(requestToken ? { Authorization: `Bearer ${requestToken}` } : {}),
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || "Ocurrió un error";
    if (isAuthError(response.status, message)) {
      notifyExpiredSession();
    }
    throw new Error(message);
  }
  return data;
}
