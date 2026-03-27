import { ImageResponse } from "next/og";
import { getPublicProfileByUsername } from "@/lib/public-profiles";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage({ params }) {
  const { username } = await params;
  const user = await getPublicProfileByUsername(username);

  if (!user) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F8FAFC",
            color: "#0B1020",
            fontSize: 52,
            fontWeight: 700,
          }}
        >
          Linka
        </div>
      ),
      size,
    );
  }

  const appearance = user.settings || {};
  const primary = appearance.primaryColor || "#5B21B6";
  const background = appearance.backgroundColor || "#F8FAFC";
  const surface = appearance.surfaceColor || "#FFFFFF";
  const textPrimary = appearance.textPrimaryColor || "#0B1020";
  const textSecondary = appearance.textSecondaryColor || "#64748B";
  const topLabels = (user.profileLinks || []).map((item) => item.label).filter(Boolean).slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background,
          color: textPrimary,
          padding: "54px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at top right, ${primary}22 0%, transparent 40%), radial-gradient(circle at bottom left, #22D3EE22 0%, transparent 35%)`,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            gap: "42px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "68%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: 24,
                  fontWeight: 700,
                  color: primary,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: primary,
                    display: "flex",
                  }}
                />
                Linka
              </div>

              <div
                style={{
                  fontSize: 64,
                  lineHeight: 1.05,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  display: "flex",
                }}
              >
                {user.businessName}
              </div>

              <div
                style={{
                  fontSize: 30,
                  lineHeight: 1.35,
                  color: textSecondary,
                  display: "flex",
                  maxWidth: "88%",
                }}
              >
                Tu pagina para compartir contactos, redes y enlaces en un solo lugar.
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {topLabels.length ? topLabels.map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    padding: "12px 18px",
                    borderRadius: 999,
                    background: surface,
                    border: `1px solid ${primary}22`,
                    fontSize: 24,
                    color: textPrimary,
                  }}
                >
                  {label}
                </div>
              )) : (
                <div
                  style={{
                    display: "flex",
                    padding: "12px 18px",
                    borderRadius: 999,
                    background: surface,
                    border: `1px solid ${primary}22`,
                    fontSize: 24,
                    color: textPrimary,
                  }}
                >
                  Perfil publico
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: 260,
              height: 260,
              borderRadius: 38,
              overflow: "hidden",
              background: surface,
              border: `8px solid ${surface}`,
              boxShadow: "0 30px 60px rgba(11, 16, 32, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {user.photo ? (
              <img
                src={user.photo}
                width="260"
                height="260"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "flex" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${primary}18`,
                  color: primary,
                  fontSize: 96,
                  fontWeight: 800,
                }}
              >
                {(user.businessName || "L").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
