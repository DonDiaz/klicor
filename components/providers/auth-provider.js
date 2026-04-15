"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true });

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) {
      setState({ user: null, loading: false });
      return;
    }

    return onIdTokenChanged(auth, async (user) => {
      setState({ user, loading: false });
    });
  }, []);

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) return;

    async function handleExpiredSession() {
      await signOut(auth).catch(() => {});
      setState({ user: null, loading: false });
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login?session=expired");
      }
    }

    window.addEventListener("klicor-auth-expired", handleExpiredSession);
    return () => window.removeEventListener("klicor-auth-expired", handleExpiredSession);
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
