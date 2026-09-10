import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS, which ignores SVG favicons. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#030810",
          color: "#65e7d1",
          fontSize: 92,
          fontWeight: 600,
          letterSpacing: -4,
        }}
      >
        BA
      </div>
    ),
    size,
  );
}
