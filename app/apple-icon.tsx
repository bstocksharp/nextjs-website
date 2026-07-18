import { ImageResponse } from "next/og";

// iOS "Add to Home Screen" icon (generated to PNG at request time). Next wires
// this up as <link rel="apple-touch-icon"> automatically.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "#4caf7d",
          color: "#0e1214",
          fontSize: 120,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        B
      </div>
    ),
    size,
  );
}
