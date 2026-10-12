// Drizzle schema for Nelio's HQ (Postgres / Neon).
// Dates that are calendar dates (follow-ups, valuation date, sale date) use
// `date` in string mode -> "YYYY-MM-DD", matching lib/followup + lib/format.

import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  date,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const codeEnum = pgEnum("seller_code", [
  "veryhot",
  "hot",
  "warm",
  "cold",
  "private",
  "lwc",
  "stock",
  "sellerlwc",
  "lwcseller",
  "jswc",
]);

export const temperatureEnum = pgEnum("temperature", ["hot", "warm", "cold"]);

export const categoryEnum = pgEnum("category", [
  "valuation",
  "opportunity",
  "competitor",
  "private",
]);

export const statusEnum = pgEnum("seller_status", [
  "Valuation only",
  "Future seller",
  "Not interested",
  "Listed elsewhere",
  "Mandate signed",
]);

export const valuationTypeEnum = pgEnum("valuation_type", ["PV", "DV"]);

export const channelEnum = pgEnum("contact_channel", [
  "WhatsApp",
  "Call",
  "Email",
  "In person",
]);

export const compStatusEnum = pgEnum("comp_status", ["Sold", "Pending transfer"]);

export const sellers = pgTable("sellers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  cell: text("cell").notNull(), // stored E.164, +27…
  email: text("email"),
  address: text("address").notNull(),
  suburb: text("suburb").notNull(),
  propertyType: text("property_type"),
  beds: integer("beds"),
  baths: numeric("baths"), // can be 3.5
  erfSizeM2: integer("erf_size_m2"),
  floorSizeM2: integer("floor_size_m2"),
  parking: integer("parking"),
  valuationType: valuationTypeEnum("valuation_type"),
  valuationDate: date("valuation_date", { mode: "string" }),
  valueLow: integer("value_low"),
  valueHigh: integer("value_high"),
  recommendedPrice: integer("recommended_price"),
  temperature: temperatureEnum("temperature"),
  category: categoryEnum("category"),
  code: codeEnum("code").notNull(),
  status: statusEnum("status").notNull().default("Valuation only"),
  nextFollowUpDate: date("next_follow_up_date", { mode: "string" }),
  lastContactDate: date("last_contact_date", { mode: "string" }),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactLogs = pgTable("contact_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => sellers.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  channel: channelEnum("channel").notNull(),
  note: text("note"),
  templateUsed: text("template_used"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(), // stable id from the brief
  name: text("name").notNull(),
  body: text("body").notNull(), // {first_name} {address} {suburb} {value_range} {agent_name}
  temperature: temperatureEnum("temperature"),
  whenHint: text("when_hint"),
  confirmed: boolean("confirmed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const comparableSales = pgTable("comparable_sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => sellers.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  saleDate: date("sale_date", { mode: "string" }),
  price: integer("price"),
  sizeM2: integer("size_m2"),
  status: compStatusEnum("status").notNull().default("Sold"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Calendar sync bookkeeping: one row per seller -> the Google event it maps to.
export const calendarEvents = pgTable("calendar_events", {
  sellerId: uuid("seller_id")
    .primaryKey()
    .references(() => sellers.id, { onDelete: "cascade" }),
  eventId: text("event_id").notNull(),
  calendarId: text("calendar_id").notNull(),
  syncedDate: date("synced_date", { mode: "string" }),
  syncedColor: text("synced_color"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Persisted Google OAuth tokens (for cron/calendar when there is no session).
// Keyed by the signed-in email. Refresh token lets the server act for Nelio.
export const googleAccounts = pgTable("google_accounts", {
  email: text("email").primaryKey(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  scope: text("scope"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Editable settings seeded from config/nelio-brief.ts. One row per group, each
// with a confirmed flag powering the "Confirm with Nelio" banner.
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  confirmed: boolean("confirmed").notNull().default(false),
  placeholder: boolean("placeholder").notNull().default(true),
  label: text("label"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type Seller = typeof sellers.$inferSelect;
export type NewSeller = typeof sellers.$inferInsert;
export type ContactLog = typeof contactLogs.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type ComparableSale = typeof comparableSales.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
