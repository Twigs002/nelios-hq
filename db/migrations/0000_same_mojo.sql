CREATE TYPE "public"."category" AS ENUM('valuation', 'opportunity', 'competitor', 'private');--> statement-breakpoint
CREATE TYPE "public"."contact_channel" AS ENUM('WhatsApp', 'Call', 'Email', 'In person');--> statement-breakpoint
CREATE TYPE "public"."seller_code" AS ENUM('veryhot', 'hot', 'warm', 'cold', 'private', 'lwc', 'stock', 'sellerlwc', 'lwcseller', 'jswc');--> statement-breakpoint
CREATE TYPE "public"."comp_status" AS ENUM('Sold', 'Pending transfer');--> statement-breakpoint
CREATE TYPE "public"."seller_status" AS ENUM('Valuation only', 'Future seller', 'Not interested', 'Listed elsewhere', 'Mandate signed');--> statement-breakpoint
CREATE TYPE "public"."temperature" AS ENUM('hot', 'warm', 'cold');--> statement-breakpoint
CREATE TYPE "public"."valuation_type" AS ENUM('PV', 'DV');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL,
	"placeholder" boolean DEFAULT true NOT NULL,
	"label" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"seller_id" uuid PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"calendar_id" text NOT NULL,
	"synced_date" date,
	"synced_color" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comparable_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"address" text NOT NULL,
	"sale_date" date,
	"price" integer,
	"size_m2" integer,
	"status" "comp_status" DEFAULT 'Sold' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"date" date NOT NULL,
	"channel" "contact_channel" NOT NULL,
	"note" text,
	"template_used" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_accounts" (
	"email" text PRIMARY KEY NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"scope" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cell" text NOT NULL,
	"email" text,
	"address" text NOT NULL,
	"suburb" text NOT NULL,
	"property_type" text,
	"beds" integer,
	"baths" numeric,
	"erf_size_m2" integer,
	"floor_size_m2" integer,
	"parking" integer,
	"valuation_type" "valuation_type",
	"valuation_date" date,
	"value_low" integer,
	"value_high" integer,
	"recommended_price" integer,
	"temperature" "temperature",
	"category" "category",
	"code" "seller_code" NOT NULL,
	"status" "seller_status" DEFAULT 'Valuation only' NOT NULL,
	"next_follow_up_date" date,
	"last_contact_date" date,
	"notes" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"temperature" "temperature",
	"when_hint" text,
	"confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparable_sales" ADD CONSTRAINT "comparable_sales_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_logs" ADD CONSTRAINT "contact_logs_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;