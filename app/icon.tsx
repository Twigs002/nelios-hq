import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Favicon / PWA icon: the Quay 1 white logo centred on brand blue.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function Icon() {
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
        <img src={src} width={360} height={98} alt="" style={{ objectFit: "contain" }} />
      </div>
    ),
    { ...size },
  );
}
