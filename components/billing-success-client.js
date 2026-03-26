"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch } from "@/lib/client-api";

export function BillingSuccessClient({ paymentId, initialStatus }) {
  const { user, loading } = useAuth();
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function confirmPayment() {
      if (!paymentId || initialStatus !== "approved" || !user) return;
      try {
        const token = await user.getIdToken(true);
        const result = await apiFetch("/api/billing/confirm", {
          method: "POST",
          token,
          body: { paymentId },
        });
        setMessage(result.status === "approved" ? "Cuenta activada y pago confirmado." : `Pago en estado ${result.status}.`);
      } catch (error) {
        setMessage(error.message);
      }
    }

    if (!loading) {
      confirmPayment();
    }
  }, [paymentId, initialStatus, user, loading]);

  if (!message) return null;
  return <p className="notice" style={{ marginTop: "1rem" }}>{message}</p>;
}
