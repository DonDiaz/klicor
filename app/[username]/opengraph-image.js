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
        fontSize: 84,
        fontWeight: 800,
        fontFamily: "sans-serif",
      }}
    >
      Perfil publico
    </div>
  );
}

export default async function OpenGraphImage({ params }) {
  const { username } = await params;
  const user = await getPublicProfileByUsername(username);

  if (!user) {
    return new ImageResponse(<FallbackImage />, size);
  }

  if (user.photo) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: "#ffffff",
            overflow: "hidden",
          }}
        >
          <img
            src={user.photo}
            width="1200"
            height="630"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "flex",
            }}
          />
        </div>
      ),
      size,
    );
  }

  const appearance = user.settings || {};
  const primary = appearance.primaryColor || "#5B21B6";
  const background = appearance.backgroundColor || "#F8FAFC";
  const textPrimary = appearance.textPrimaryColor || "#0B1020";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background,
          color: textPrimary,
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at top left, ${primary}25 0%, transparent 42%), radial-gradient(circle at bottom right, #22D3EE20 0%, transparent 36%)`,
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: 260,
            height: 260,
            borderRadius: 72,
            background: `${primary}18`,
            color: primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 120,
            fontWeight: 800,
            boxShadow: "0 30px 70px rgba(11, 16, 32, 0.14)",
          }}
        >
          {(user.businessName || "P").slice(0, 1).toUpperCase()}
        </div>
      </div>
    ),
    size,
  );
}
