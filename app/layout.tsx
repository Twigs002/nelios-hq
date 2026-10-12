import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

// Montserrat stands in for Gotham. Self-hosted by next/font at build time,
// so there is no runtime request to a third-party font host (POPIA).
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nelio's HQ",
  description: "Private seller follow-up tool for Nelio Mendes, Quay 1 International Realty.",
  applicationName: "Nelio's HQ",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Nelio's HQ" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#3D5BA6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={montserrat.variable}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
