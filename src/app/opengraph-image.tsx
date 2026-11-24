import { ImageResponse } from "next/og";

// Link-preview image (LINE, Slack, Facebook, X…) for every page that doesn't
// define its own. Rendered once at build time. English only: next/og's
// bundled font has no Thai glyphs.
export const alt = "ThunderOne | Empowered People. Connected Organization.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "linear-gradient(135deg, #eaf4ff 0%, #f1e8ff 100%)",
          color: "#071858",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background: "#075df7",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 800,
            }}
          >
            T1
          </div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>
            <span>Thunder</span>
            <span style={{ color: "#075df7" }}>One</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 48, fontSize: 56, fontWeight: 700, lineHeight: 1.15 }}>
          <span>Empowered People.</span>
          <span style={{ color: "#075df7" }}>Connected Organization.</span>
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 28, color: "#536999" }}>
          People · Assets · Media · Service — one connected workspace.
        </div>
      </div>
    ),
    size
  );
}
