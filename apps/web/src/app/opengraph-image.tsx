import { ImageResponse } from "next/og";

export const alt = "PawnPool: your community vs the AI Boss";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#070605",
          color: "#ede6dc",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          borderBottom: "12px solid #e6a855",
        }}
      >
        <div style={{ fontSize: 40, color: "#e6a855", fontWeight: 700 }}>PawnPool</div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.02, marginTop: 24, letterSpacing: -2 }}>
          Your community vs the AI Boss
        </div>
        <div style={{ fontSize: 36, color: "#8e8276", marginTop: 32 }}>
          Free to play. Sponsors put up the prizes.
        </div>
      </div>
    ),
    size,
  );
}
