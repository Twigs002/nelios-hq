import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// iOS home-screen icon: Quay 1 white logo on brand blue, full-bleed (iOS
// rounds the corners itself).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const logo = await readFile(join(process.cwd(), "public/brand/quay1-logo-white.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3D5BA6",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={132} height={36} alt="" style={{ objectFit: "contain" }} />
      </div>
    ),
    { ...size },
  );
}
