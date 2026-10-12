import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest. Light only; standalone for home-screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nelio's HQ",
    short_name: "Nelio's HQ",
    description: "Private seller follow-up tool for Nelio Mendes, Quay 1 International Realty.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAFA",
    theme_color: "#3D5BA6",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
