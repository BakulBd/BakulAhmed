import { ImageResponse } from "next/og";
import { profile, site } from "@/lib/content";

export const OG_SIZE = { width: 1200, height: 630 };

/** One template so every route's card is visually consistent. */
export function renderOg({ label, title }: { label: string; title: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#030810",
          color: "#fafafa",
          padding: "70px 78px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 6,
            display: "flex",
            background: "linear-gradient(90deg, #65e7d1, #b6a8ff)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: "#65e7d1" }} />
          <div style={{ fontSize: 21, letterSpacing: 3, color: "#9b9baa" }}>{label.toUpperCase()}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 82, letterSpacing: -3, lineHeight: 1.06, maxWidth: 1000 }}>{title}</div>
          <div style={{ marginTop: 24, fontSize: 33, letterSpacing: -1, color: "#9b9baa" }}>
            {site.name}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 22, color: "#6f6f80", letterSpacing: 1 }}>
            {`${profile.roleChip} · ${profile.location}`}
          </div>
          <div style={{ fontSize: 22, color: "#65e7d1", letterSpacing: 1 }}>bakul.app</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
