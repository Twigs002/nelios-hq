// Seed script - FICTIONAL data only (never real people). Run: npm run db:seed.
// Ports the design system's 10 fictional sellers plus templates, comparable
// sales, contact history and the Nelio-brief settings.
import "dotenv/config";
import { db } from "./index";
import {
  sellers,
  templates,
  comparableSales,
  contactLogs,
  calendarEvents,
  appSettings,
} from "./schema";
import { toE164 } from "../lib/format";
import { nelioBrief, codeCadenceDays } from "../config/nelio-brief";

const CREATED_BY = "nelio@quay1.co.za";

type Row = {
  code: string;
  name: string;
  phone: string;
  address: string;
  suburb: string;
  temperature: string;
  category: string;
  status: string;
  last: string;
  next: string;
  val: { type: "PV" | "DV"; date: string; value: number; low: number; high: number };
  facts: { kind: string; beds: number; baths: number; erf: number | null; floor: number; parking: number };
};

const DATA: Row[] = [
  { code: "veryhot", name: "Thandi Mokoena", phone: "0824551290", address: "14 Avenue Disandt", suburb: "Fresnaye", temperature: "hot", category: "valuation", status: "Future seller", last: "2026-09-28", next: "2026-10-08", val: { type: "PV", date: "2026-09-14", value: 8450000, low: 8100000, high: 8900000 }, facts: { kind: "Freehold house", beds: 4, baths: 3.5, erf: 595, floor: 320, parking: 2 } },
  { code: "lwc", name: "Pieter van der Merwe", phone: "0731187744", address: "702 The Bordeaux, 2 Clarens Rd", suburb: "Sea Point", temperature: "warm", category: "competitor", status: "Listed elsewhere", last: "2026-09-30", next: "2026-10-11", val: { type: "DV", date: "2026-09-30", value: 4950000, low: 4700000, high: 5200000 }, facts: { kind: "Sectional title", beds: 2, baths: 2, erf: null, floor: 104, parking: 1 } },
  { code: "stock", name: "Fatima Davids", phone: "0796024418", address: "31 Upper Orange St", suburb: "Oranjezicht", temperature: "hot", category: "opportunity", status: "Valuation only", last: "2026-10-05", next: "2026-10-12", val: { type: "PV", date: "2026-10-05", value: 6200000, low: 5900000, high: 6500000 }, facts: { kind: "Freehold house", beds: 3, baths: 2, erf: 412, floor: 215, parking: 2 } },
  { code: "warm", name: "James O’Connor", phone: "0829137702", address: "8 Kloof Nek Rd", suburb: "Tamboerskloof", temperature: "warm", category: "valuation", status: "Valuation only", last: "2026-10-02", next: "2026-10-12", val: { type: "DV", date: "2026-10-02", value: 3850000, low: 3650000, high: 4050000 }, facts: { kind: "Victorian semi", beds: 2, baths: 1, erf: 180, floor: 118, parking: 0 } },
  { code: "private", name: "Lindiwe Khumalo", phone: "0614482290", address: "5 Hely Hutchinson Ave", suburb: "Camps Bay", temperature: "cold", category: "private", status: "Future seller", last: "2026-09-12", next: "2026-10-12", val: { type: "PV", date: "2026-08-21", value: 14750000, low: 14000000, high: 15500000 }, facts: { kind: "Freehold house", beds: 5, baths: 4, erf: 820, floor: 460, parking: 3 } },
  { code: "jswc", name: "Mark Rosenberg", phone: "0837720156", address: "19 Ocean View Dr", suburb: "Green Point", temperature: "hot", category: "opportunity", status: "Valuation only", last: "2026-10-09", next: "2026-10-14", val: { type: "PV", date: "2026-10-09", value: 7300000, low: 6950000, high: 7650000 }, facts: { kind: "Freehold house", beds: 3, baths: 3, erf: 390, floor: 240, parking: 2 } },
  { code: "hot", name: "Ayesha Parker", phone: "0725519043", address: "4 Loader St", suburb: "De Waterkant", temperature: "warm", category: "private", status: "Valuation only", last: "2026-10-01", next: "2026-10-15", val: { type: "DV", date: "2026-10-01", value: 5600000, low: 5350000, high: 5850000 }, facts: { kind: "Cottage", beds: 2, baths: 2, erf: 96, floor: 112, parking: 0 } },
  { code: "cold", name: "Sipho Ndlovu", phone: "0843306671", address: "22 Exner Ave", suburb: "Vredehoek", temperature: "cold", category: "valuation", status: "Valuation only", last: "2026-08-30", next: "2026-10-19", val: { type: "PV", date: "2026-08-30", value: 4250000, low: 4000000, high: 4500000 }, facts: { kind: "Freehold house", beds: 3, baths: 2, erf: 310, floor: 170, parking: 1 } },
  { code: "sellerlwc", name: "Claire Dubois", phone: "0762248815", address: "11 Kloof Rd", suburb: "Bantry Bay", temperature: "warm", category: "competitor", status: "Listed elsewhere", last: "2026-09-25", next: "2026-10-21", val: { type: "DV", date: "2026-09-25", value: 11900000, low: 11400000, high: 12500000 }, facts: { kind: "Apartment", beds: 3, baths: 3, erf: null, floor: 210, parking: 2 } },
  { code: "lwcseller", name: "Riaan Botha", phone: "0820094437", address: "1201 Mouille Point Village", suburb: "Mouille Point", temperature: "cold", category: "opportunity", status: "Future seller", last: "2026-09-02", next: "2026-11-02", val: { type: "PV", date: "2026-09-02", value: 3450000, low: 3250000, high: 3650000 }, facts: { kind: "Sectional title", beds: 1, baths: 1, erf: null, floor: 68, parking: 1 } },
];

const COMPS = [
  { address: "9 Avenue Disandt, Fresnaye", saleDate: "2026-08-22", price: 8650000, sizeM2: 335, status: "Sold" },
  { address: "27 Avenue Normandie, Fresnaye", saleDate: "2026-07-30", price: 8100000, sizeM2: 305, status: "Sold" },
  { address: "3 Avenue St Leon, Fresnaye", saleDate: "2026-07-11", price: 9250000, sizeM2: 360, status: "Sold" },
  { address: "41 Avenue Le Sueur, Fresnaye", saleDate: "2026-06-18", price: 7950000, sizeM2: 298, status: "Sold" },
  { address: "16 Avenue Bordeaux, Fresnaye", saleDate: "2026-05-27", price: 8400000, sizeM2: 318, status: "Pending transfer" },
] as const;

const TIMELINE = [
  { date: "2026-09-28", channel: "WhatsApp", note: "Sent valuation follow-up. Read, no reply." },
  { date: "2026-09-14", channel: "In person", note: "PV on site with Thandi and her husband. Keen to sell before March; buying in Constantia." },
  { date: "2026-09-09", channel: "Call", note: "Inbound from the Fresnaye flyer drop. Booked valuation." },
] as const;

const AGENT = {
  name: "Nelio Mendes",
  role: "Property Practitioner",
  phone: "+27 82 868 3539",
  email: "nelio@quay1.co.za",
  office: "Quay 1 International Realty",
  web: "quay1.co.za",
};

async function main() {
  console.log("Clearing existing data…");
  await db.delete(contactLogs);
  await db.delete(comparableSales);
  await db.delete(calendarEvents);
  await db.delete(sellers);
  await db.delete(templates);
  await db.delete(appSettings);

  console.log("Inserting sellers…");
  const inserted = await db
    .insert(sellers)
    .values(
      DATA.map((r) => ({
        name: r.name,
        cell: toE164(r.phone),
        email: null,
        address: r.address,
        suburb: r.suburb,
        propertyType: r.facts.kind,
        beds: r.facts.beds,
        baths: String(r.facts.baths),
        erfSizeM2: r.facts.erf,
        floorSizeM2: r.facts.floor,
        parking: r.facts.parking,
        valuationType: r.val.type,
        valuationDate: r.val.date,
        valueLow: r.val.low,
        valueHigh: r.val.high,
        recommendedPrice: r.val.value,
        temperature: r.temperature as "hot" | "warm" | "cold",
        category: r.category as "valuation" | "opportunity" | "competitor" | "private",
        code: r.code as (typeof sellers.$inferInsert)["code"],
        status: r.status as (typeof sellers.$inferInsert)["status"],
        nextFollowUpDate: r.next,
        lastContactDate: r.last,
        createdBy: CREATED_BY,
      })),
    )
    .returning({ id: sellers.id, name: sellers.name });

  const thandi = inserted.find((s) => s.name === "Thandi Mokoena")!;

  console.log("Inserting comparable sales for Thandi…");
  await db.insert(comparableSales).values(
    COMPS.map((c) => ({
      sellerId: thandi.id,
      address: c.address,
      saleDate: c.saleDate,
      price: c.price,
      sizeM2: c.sizeM2,
      status: c.status as "Sold" | "Pending transfer",
    })),
  );

  console.log("Inserting contact history for Thandi…");
  await db.insert(contactLogs).values(
    TIMELINE.map((t) => ({
      sellerId: thandi.id,
      date: t.date,
      channel: t.channel as "WhatsApp" | "Call" | "Email" | "In person",
      note: t.note,
    })),
  );

  console.log("Inserting templates…");
  await db.insert(templates).values(
    nelioBrief.templates.value.map((t) => ({
      slug: t.id,
      name: t.name,
      body: t.body,
      temperature: t.temperature,
      whenHint: t.whenHint,
      confirmed: nelioBrief.templates.confirmed,
    })),
  );

  console.log("Inserting settings…");
  await db.insert(appSettings).values([
    { key: "code_cadences", value: codeCadenceDays, confirmed: nelioBrief.codes.confirmed, placeholder: nelioBrief.codes.placeholder, label: nelioBrief.codes.label },
    { key: "category_colours", value: nelioBrief.categoryColours.value, confirmed: nelioBrief.categoryColours.confirmed, placeholder: nelioBrief.categoryColours.placeholder, label: nelioBrief.categoryColours.label },
    { key: "calendar_colours", value: nelioBrief.calendarColours.value, confirmed: nelioBrief.calendarColours.confirmed, placeholder: nelioBrief.calendarColours.placeholder, label: nelioBrief.calendarColours.label },
    { key: "digest", value: nelioBrief.digest.value, confirmed: nelioBrief.digest.confirmed, placeholder: nelioBrief.digest.placeholder, label: nelioBrief.digest.label },
    { key: "templates", value: { count: nelioBrief.templates.value.length }, confirmed: nelioBrief.templates.confirmed, placeholder: nelioBrief.templates.placeholder, label: nelioBrief.templates.label },
    { key: "agent", value: AGENT, confirmed: true, placeholder: false, label: "Agent details" },
  ]);

  console.log(`Seeded ${inserted.length} sellers. Done.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
