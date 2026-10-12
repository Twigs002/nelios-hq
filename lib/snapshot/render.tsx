// Branded valuation snapshot - shared data + Satori renderer.
// One source of truth so the PNG route and the PDF route draw the same image.
//
// Satori is NOT a browser: every element with more than one child carries an
// explicit `display:'flex'` + `flexDirection`, there is no CSS grid, no CSS
// vars, and all sizes are literal pixels. Colours are the Quay 1 palette hexes
// copied from app/tokens.css. Fonts are the four vendored Montserrat woffs that
// live under the image route folder; logos are fetched from the running origin
// and inlined as data URIs (Satori only accepts data URIs or absolute URLs).

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getSeller, getComps, getAgent, type AgentDetails } from "@/lib/queries";
import { decorateSeller } from "@/lib/view";
import { rand, formatDate, sqm } from "@/lib/format";
import { todayInJohannesburg } from "@/lib/followup";

export interface SnapshotComp {
  street: string;
  saleDate: string; // formatted, e.g. "12 Oct 2026" or "-"
  price: string; // rand() or "-"
  size: string; // "220 m²" or "-"
  rPerM2: string; // rand(rounded) or "-"
}

export interface SnapshotData {
  preparedDate: string; // formatDate(today)
  sellerName: string;
  address: string;
  subtitle: string; // "{suburb}, Cape Town · 3 bed · 2 bath · 180 m²"
  valValue: string; // recommended asking price, rand
  valueLow: string; // rand(low) or "-"
  valueHigh: string; // rand(high) or "-"
  compsCaption: string; // "{suburb} · last 6 months"
  comps: SnapshotComp[]; // up to 5
  agent: AgentDetails;
}

const NB = " "; // non-breaking space, matches lib/format

/** R/m² rounded to the nearest 100, as rand(). "-" when either side is missing. */
function rPerM2Label(price: number | null, size: number | null): string {
  if (price == null || size == null || size === 0) return "-";
  return rand(Math.round(price / size / 100) * 100);
}

/**
 * Assemble everything the snapshot needs. Returns null when the seller is
 * missing or has no valuation (nothing to show). Mirrors the detail page's use
 * of getSeller + decorateSeller, and reuses getComps + getAgent verbatim.
 */
export async function buildSnapshotData(sellerId: string): Promise<SnapshotData | null> {
  const row = await getSeller(sellerId);
  if (!row) return null;
  const today = todayInJohannesburg();
  const s = decorateSeller(row, today);
  if (!s.hasValuation) return null;

  const [comps, agent] = await Promise.all([getComps(sellerId), getAgent()]);

  // Subtitle: suburb + city, then whatever property facts we actually have.
  const facts: string[] = [`${s.suburb}, Cape Town`];
  if (row.beds != null) facts.push(`${row.beds} bed`);
  if (row.baths != null) facts.push(`${row.baths} bath`);
  if (row.floorSizeM2 != null) facts.push(`${row.floorSizeM2}${NB}m²`);
  const subtitle = facts.join(" · ");

  return {
    preparedDate: formatDate(today),
    sellerName: s.name,
    address: s.address,
    subtitle,
    valValue: s.valValue,
    valueLow: row.valueLow != null ? rand(row.valueLow) : "-",
    valueHigh: row.valueHigh != null ? rand(row.valueHigh) : "-",
    compsCaption: `${s.suburb} · last 6 months`,
    comps: comps.slice(0, 5).map((c) => ({
      street: c.address.split(",")[0]?.trim() || c.address,
      saleDate: c.saleDate ? formatDate(c.saleDate) : "-",
      price: c.price != null ? rand(c.price) : "-",
      size: sqm(c.sizeM2),
      rPerM2: rPerM2Label(c.price, c.sizeM2),
    })),
    agent,
  };
}

// Read vendored assets from disk via process.cwd(). fetch(file://) is not
// implemented in the Next runtime, so fs is the portable choice. next.config's
// outputFileTracingIncludes bundles these files for the Vercel function.
const FONT_DIR = "app/(app)/sellers/[id]/snapshot/image/fonts";

/** Load the four vendored Montserrat woffs. */
async function loadFonts(): Promise<Buffer[]> {
  return Promise.all(
    ["400", "500", "600", "700"].map((w) =>
      readFile(join(process.cwd(), FONT_DIR, `montserrat-latin-${w}-normal.woff`)),
    ),
  );
}

/** Read a brand logo and inline it as a data URI. */
async function logoDataUri(file: string): Promise<string> {
  const buf = await readFile(join(process.cwd(), "public/brand", file));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

// Palette (literal hex - CSS vars do not work in Satori).
const C = {
  paper: "#FAFAFA",
  ink: "#15171C",
  ink2: "#44474F",
  ink3: "#686B73",
  line: "#E8E9EC",
  lineStrong: "#D2D5DB",
  accent: "#3D5BA6",
  yellow: "#FDC503",
  white: "#FFFFFF",
};

export async function renderSnapshotImage(data: SnapshotData): Promise<ImageResponse> {
  const [w400, w500, w600, w700] = await loadFonts();
  const [logoBlue, logoWhite] = await Promise.all([
    logoDataUri("quay1-logo-blue.png"),
    logoDataUri("quay1-logo-white.png"),
  ]);

  const compRows = data.comps.length
    ? data.comps.map((c, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            borderBottom: `1px solid ${C.line}`,
            paddingTop: 18,
            paddingBottom: 18,
            fontSize: 21,
            lineHeight: "28px",
          }}
        >
          <span style={{ display: "flex", flex: 1, fontWeight: 600, color: C.ink }}>
            {c.street}
          </span>
          <span style={{ display: "flex", width: 140, color: C.ink2, fontWeight: 400 }}>
            {c.saleDate}
          </span>
          <span
            style={{
              display: "flex",
              width: 170,
              justifyContent: "flex-end",
              fontWeight: 500,
              color: C.ink,
            }}
          >
            {c.price}
          </span>
          <span
            style={{
              display: "flex",
              width: 96,
              justifyContent: "flex-end",
              color: C.ink2,
              fontWeight: 400,
            }}
          >
            {c.size}
          </span>
          <span
            style={{
              display: "flex",
              width: 120,
              justifyContent: "flex-end",
              color: C.ink2,
              fontWeight: 400,
            }}
          >
            {c.rPerM2}
          </span>
        </div>
      ))
    : [
        <div
          key="empty"
          style={{
            display: "flex",
            paddingTop: 24,
            fontSize: 21,
            lineHeight: "28px",
            color: C.ink3,
            fontWeight: 400,
          }}
        >
          No comparable sales captured yet.
        </div>,
      ];

  const element = (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: "flex",
        flexDirection: "column",
        backgroundColor: C.paper,
        color: C.ink,
        fontFamily: "Montserrat",
      }}
    >
      {/* Body */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
          padding: "64px 88px 0",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 40,
              borderBottom: `1px solid ${C.lineStrong}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoBlue} width={236} alt="Quay 1" />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span
                style={{
                  fontSize: 18,
                  lineHeight: "24px",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Valuation snapshot
              </span>
              <span
                style={{
                  fontSize: 18,
                  lineHeight: "24px",
                  fontWeight: 500,
                  color: C.ink3,
                  marginTop: 6,
                }}
              >
                Prepared {data.preparedDate}
              </span>
            </div>
          </div>

          {/* Prepared-for */}
          <div style={{ display: "flex", flexDirection: "column", paddingTop: 48 }}>
            <span
              style={{
                fontSize: 18,
                lineHeight: "24px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.ink3,
              }}
            >
              Prepared for {data.sellerName}
            </span>
            <span
              style={{
                fontSize: 64,
                lineHeight: "72px",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                marginTop: 12,
              }}
            >
              {data.address}
            </span>
            <span
              style={{
                fontSize: 32,
                lineHeight: "40px",
                fontWeight: 400,
                color: C.ink2,
                marginTop: 12,
              }}
            >
              {data.subtitle}
            </span>
          </div>

          {/* Price row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginTop: 48,
              borderTop: `1px solid ${C.lineStrong}`,
              borderBottom: `1px solid ${C.lineStrong}`,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1.5,
                flexBasis: 0,
                padding: "32px 48px 32px 0",
                borderRight: `1px solid ${C.line}`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span
                  style={{
                    display: "flex",
                    width: 28,
                    height: 4,
                    backgroundColor: C.yellow,
                    marginRight: 14,
                  }}
                />
                <span
                  style={{
                    fontSize: 18,
                    lineHeight: "24px",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                  }}
                >
                  Recommended asking price
                </span>
              </div>
              <span
                style={{
                  fontSize: 88,
                  lineHeight: "96px",
                  fontWeight: 500,
                  letterSpacing: "-0.04em",
                  marginTop: 16,
                }}
              >
                {data.valValue}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                flexGrow: 1,
                flexBasis: 0,
                padding: "32px 0 32px 48px",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  lineHeight: "24px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: C.ink3,
                }}
              >
                Value range
              </span>
              <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
                <span style={{ fontSize: 36, lineHeight: "46px", fontWeight: 500 }}>
                  {data.valueLow}
                </span>
                <span style={{ fontSize: 24, lineHeight: "30px", fontWeight: 400, color: C.ink3 }}>
                  to
                </span>
                <span style={{ fontSize: 36, lineHeight: "46px", fontWeight: 500 }}>
                  {data.valueHigh}
                </span>
              </div>
            </div>
          </div>

          {/* Comps */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 40, paddingBottom: 40 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  lineHeight: "24px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Recent comparable sales
              </span>
              <span style={{ fontSize: 18, lineHeight: "24px", fontWeight: 500, color: C.ink3 }}>
                {data.compsCaption}
              </span>
            </div>
            {/* Table header */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                borderBottom: `1px solid ${C.lineStrong}`,
                paddingTop: 20,
                paddingBottom: 14,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: C.ink3,
              }}
            >
              <span style={{ display: "flex", flex: 1 }}>Address</span>
              <span style={{ display: "flex", width: 140 }}>Sold</span>
              <span style={{ display: "flex", width: 170, justifyContent: "flex-end" }}>Price</span>
              <span style={{ display: "flex", width: 96, justifyContent: "flex-end" }}>Size</span>
              <span style={{ display: "flex", width: 120, justifyContent: "flex-end" }}>R/m²</span>
            </div>
            {compRows}
          </div>
        </div>
      </div>

      {/* Footer band */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          height: 232,
          backgroundColor: C.accent,
          color: C.white,
          padding: "36px 88px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 160,
            height: 160,
            backgroundColor: "rgba(255,255,255,0.12)",
            marginRight: 40,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ fontSize: 36, lineHeight: "42px", fontWeight: 600 }}>
            {data.agent.name}
          </span>
          <span
            style={{
              fontSize: 16,
              lineHeight: "22px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.85,
              marginTop: 6,
            }}
          >
            {data.agent.role}
          </span>
          <span style={{ fontSize: 22, lineHeight: "30px", fontWeight: 500, marginTop: 12 }}>
            {data.agent.phone}
          </span>
          <span style={{ fontSize: 22, lineHeight: "30px", fontWeight: 500 }}>
            {data.agent.email}
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoWhite} width={200} alt="Quay 1" />
      </div>
    </div>
  );

  return new ImageResponse(element, {
    width: 1080,
    height: 1350,
    fonts: [
      { name: "Montserrat", data: w400, weight: 400, style: "normal" },
      { name: "Montserrat", data: w500, weight: 500, style: "normal" },
      { name: "Montserrat", data: w600, weight: 600, style: "normal" },
      { name: "Montserrat", data: w700, weight: 700, style: "normal" },
    ],
  });
}
