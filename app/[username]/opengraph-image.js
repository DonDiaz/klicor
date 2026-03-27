import { ImageResponse } from "next/og";
import { getPublicProfileByUsername } from "@/lib/public-profiles";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function FallbackImage() {
  return (
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
  );
}

function ProfileIcon({ user, primary, surface }) {
  const initial = (user.businessName || "L").slice(0, 1).toUpperCase();

  return (
    <div
      style={{
        width: 248,
        height: 248,
        borderRadius: 72,
        overflow: "hidden",
        background: surface,
        border: `10px solid ${surface}`,
        boxShadow: "0 28px 72px rgba(11, 16, 32, 0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {user.photo ? (
        <img
          src={user.photo}
          width="248"
          height="248"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "flex",
          }}
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
            fontSize: 100,
            fontWeight: 800,
          }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}

export default async function OpenGraphImage({ params }) {
  const { username } = await params;
  const user = await getPublicProfileByUsername(username);

  if (!user) {
    return new ImageResponse(<FallbackImage />, size);
  }

  const appearance = user.settings || {};
  const primary = appearance.primaryColor || "#5B21B6";
  const background = appearance.backgroundColor || "#F8FAFC";
  const surface = appearance.surfaceColor || "#FFFFFF";
  const textPrimary = appearance.textPrimaryColor || "#0B1020";
  const textSecondary = appearance.textSecondaryColor || "#64748B";

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
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at top left, ${primary}1f 0%, transparent 42%), radial-gradient(circle at bottom right, #22D3EE1f 0%, transparent 36%)`,
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            borderRadius: 42,
            background: `${surface}E8`,
            border: `1px solid ${primary}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "54px 58px",
            gap: "46px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "18px",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: primary,
                fontSize: 24,
                fontWeight: 700,
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
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 68,
                  lineHeight: 1.02,
                  fontWeight: 800,
                  letterSpacing: "-0.05em",
                  maxWidth: "90%",
                }}
              >
                {user.businessName}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  lineHeight: 1.35,
                  color: textSecondary,
                  maxWidth: "88%",
                }}
              >
                Tu pagina para compartir contactos, redes y enlaces en un solo lugar.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              minWidth: 280,
            }}
          >
            <ProfileIcon user={user} primary={primary} surface={surface} />
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: textSecondary,
              }}
            >
              {user.usernameLower ? `/${user.usernameLower}` : "Perfil publico"}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
