import "server-only";
import { getAppUrl } from "@/lib/env";

async function mpFetch(path, init = {}) {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN");
  }

  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago error: ${body}`);
  }

  return response.json();
}

export async function createPreference({ user, annualPrice }) {
  const appUrl = getAppUrl();
  return mpFetch("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [
        {
          title: "Plan anual Linka",
          quantity: 1,
          currency_id: "COP",
          unit_price: annualPrice,
        },
      ],
      external_reference: user.uid,
      metadata: {
        uid: user.uid,
        username: user.usernameLower || "",
      },
      binary_mode: true,
      payment_methods: {
        installments: 1,
        excluded_payment_types: [
          { id: "ticket" },
          { id: "bank_transfer" },
        ],
      },
      notification_url: `${appUrl}/api/billing/webhook`,
      back_urls: {
        success: `${appUrl}/billing/success`,
        pending: `${appUrl}/billing/success?status=pending`,
        failure: `${appUrl}/billing/success?status=failure`,
      },
      auto_return: "approved",
    }),
  });
}

export async function getPayment(paymentId) {
  return mpFetch(`/v1/payments/${paymentId}`);
}
