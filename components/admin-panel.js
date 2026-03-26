"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/client-api";

export function AdminPanel({ token, initialSettings, initialUsers }) {
  const [annualPrice, setAnnualPrice] = useState(initialSettings?.annualPrice || 55000);
  const [message, setMessage] = useState("");

  async function savePrice() {
    try {
      const data = await apiFetch("/api/admin/settings", {
        method: "POST",
        token,
        body: { annualPrice },
      });
      setAnnualPrice(data.settings.annualPrice);
      setMessage("Precio actualizado.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <h3>Configuracion de facturacion</h3>
        <div className="form-grid">
          <div>
            <label className="label">Precio anual (COP)</label>
            <input className="input" type="number" min={50000} max={60000} value={annualPrice} onChange={(e) => setAnnualPrice(Number(e.target.value))} />
          </div>
          <div className="actions" style={{ alignItems: "end" }}>
            <button className="btn btn-primary" type="button" onClick={savePrice}>Guardar precio</button>
          </div>
        </div>
        {message ? <p className="notice">{message}</p> : null}
      </section>
      <section className="panel">
        <h3>Usuarios</h3>
        <table className="table">
          <thead>
            <tr><th>Negocio</th><th>Email</th><th>Estado</th><th>Plan</th><th>Expira</th></tr>
          </thead>
          <tbody>
            {initialUsers.map((user) => (
              <tr key={user.uid}>
                <td>{user.businessName}</td>
                <td>{user.email}</td>
                <td>{user.status}</td>
                <td>{user.plan}</td>
                <td>{user.expiresAtLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
