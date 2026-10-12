// Nelio's brief - the single source for values Nelio has not fully confirmed.
// Every group carries a `confirmed` flag. Unconfirmed values are PLACEHOLDERs
// and surface in the Settings "Confirm with Nelio" banner. These are SEEDED
// into the database (app_settings + templates) so Settings can edit them with
// no code change; this file is only the first-run default.
//
// Decision (12 Oct 2026): seller codes + cadences are confirmed (Nelio's own
// calendar key); templates, calendar colours and digest timing are not yet.

export interface Confirmable<T> {
  confirmed: boolean;
  placeholder: boolean; // true while the value is a stand-in to confirm with Nelio
  label: string; // shown in the Settings confirm banner
  value: T;
}

export interface BriefTemplate {
  id: string;
  name: string;
  body: string; // {first_name} {address} {suburb} {value_range} {agent_name}
  temperature: "hot" | "warm" | "cold" | null;
  whenHint: string;
}

// Cadence interval (days) per seller code - Nelio's confirmed key.
export const codeCadenceDays = {
  veryhot: 7,
  hot: 30,
  warm: 60,
  cold: 180,
  private: 14,
  lwc: 30,
  stock: 30,
  sellerlwc: 30,
  lwcseller: 30,
  jswc: 7,
} as const;

// Placeholder follow-up templates. Short, warm, plain South African English,
// no emoji. Confirm wording with Nelio before relying on them.
export const briefTemplates: BriefTemplate[] = [
  {
    id: "hot-sameday-snapshot",
    name: "Hot same-day valuation snapshot",
    temperature: "hot",
    whenHint: "Same day as the valuation",
    body: "Hi {first_name}, thank you for having me at {address} today. Here is your valuation snapshot for the home. My recommended range is {value_range}. Shout if you would like to chat it through. {agent_name}",
  },
  {
    id: "hot-2day-followup",
    name: "Hot 2-day follow-up",
    temperature: "hot",
    whenHint: "2 days after the valuation",
    body: "Hi {first_name}, just following up on my valuation at {address}. Any questions on the numbers or on the {suburb} market? Happy to help whenever suits you. {agent_name}",
  },
  {
    id: "warm-7day-checkin",
    name: "Warm 7-day check-in",
    temperature: "warm",
    whenHint: "About a week later",
    body: "Hi {first_name}, checking in on {address}. A couple of homes in {suburb} are drawing good interest at the moment. Let me know if you would like an update. {agent_name}",
  },
  {
    id: "warm-30day-market",
    name: "Warm 30-day market update",
    temperature: "warm",
    whenHint: "Monthly",
    body: "Hi {first_name}, a quick {suburb} update: the market has been steady and well-priced homes are moving. Still happy to help with {address} whenever you are ready. {agent_name}",
  },
  {
    id: "cold-quarterly-market",
    name: "Cold quarterly market update",
    temperature: "cold",
    whenHint: "Every quarter",
    body: "Hi {first_name}, {agent_name} here. No pressure at all, just a seasonal note on {suburb}. If your plans for {address} change, I am only a message away.",
  },
  {
    id: "private-first-touch",
    name: "Private seller first touch",
    temperature: null,
    whenHint: "First contact with a private seller",
    body: "Hi {first_name}, I see {address} is on the market privately. I work the {suburb} area closely and would love to help where I can. Could I share a quick valuation with you? {agent_name}",
  },
];

export const nelioBrief = {
  codes: {
    confirmed: true,
    placeholder: false,
    label: "Follow-up cadence by code",
    value: codeCadenceDays,
  } as Confirmable<typeof codeCadenceDays>,

  categoryColours: {
    confirmed: false,
    placeholder: true,
    label: "Category colours",
    value: {
      valuation: "#3D5BA6",
      opportunity: "#7A4FB0",
      competitor: "#15171C",
      private: "#EE7203",
    },
  } as Confirmable<Record<string, string>>,

  calendarColours: {
    confirmed: false,
    placeholder: true,
    label: "Calendar event colours (Google colorId per category)",
    value: {
      valuation: "9", // Blueberry
      opportunity: "3", // Grape
      competitor: "8", // Graphite
      private: "6", // Tangerine
    },
  } as Confirmable<Record<string, string>>,

  digest: {
    confirmed: false,
    placeholder: true,
    label: "Morning digest time",
    value: { cron: "0 5 * * 1-5", tz: "Africa/Johannesburg", localTime: "07:00" },
  } as Confirmable<{ cron: string; tz: string; localTime: string }>,

  templates: {
    confirmed: false,
    placeholder: true,
    label: "Message templates",
    value: briefTemplates,
  } as Confirmable<BriefTemplate[]>,
};

export type NelioBrief = typeof nelioBrief;
