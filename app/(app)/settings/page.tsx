import { requireUser } from "@/lib/session";
import { getSettings, getTemplates } from "@/lib/queries";
import { CODES } from "@/lib/codes";
import { CodeMark } from "@/components/CodeMark";
import { ConfirmToggle, CalendarSync } from "@/components/SettingsClient";
import { syncEnabled, dryRunOnly } from "@/lib/google/calendar";

export default async function SettingsPage() {
  await requireUser();
  const [settings, templates] = await Promise.all([getSettings(), getTemplates()]);
  const unconfirmed = Object.values(settings).filter((s) => !s.confirmed);

  const Group = ({ k, title, children }: { k: string; title: string; children?: React.ReactNode }) => {
    const s = settings[k];
    return (
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="label">{title}</span>
          {s && <ConfirmToggle settingKey={k} confirmed={s.confirmed} />}
        </div>
        {children}
      </section>
    );
  };

  return (
    <main className="px-6 md:px-8 pt-6 md:pt-10 max-w-3xl flex flex-col gap-8 pb-10">
      <div>
        <span className="label md:hidden">Settings</span>
        <h1 className="text-h1 mt-1">Settings</h1>
      </div>

      {unconfirmed.length > 0 && (
        <div className="rounded-3 border border-highlight-edge bg-highlight-soft px-4 py-3 flex flex-col gap-1">
          <span className="text-small font-bold text-ink">Confirm with Nelio</span>
          <span className="text-small text-ink-2">
            These values are placeholders until Nelio confirms them:
          </span>
          <ul className="mt-1 text-small text-ink-2 list-disc pl-5">
            {unconfirmed.map((s) => (
              <li key={s.key}>{s.label ?? s.key}</li>
            ))}
          </ul>
        </div>
      )}

      <Group k="code_cadences" title="Follow-up cadence by code">
        <div className="flex flex-col">
          {CODES.map((c) => (
            <div key={c.id} className="min-h-[52px] flex justify-between items-center gap-3 border-b border-line">
              <span className="flex items-center gap-3 min-w-0">
                <CodeMark mark={c.mark} size={10} />
                <span className="flex flex-col min-w-0">
                  <span className="text-[15px] leading-5 font-semibold whitespace-nowrap">{c.label}</span>
                  <span className="text-[12px] leading-4 text-ink-3 whitespace-nowrap">{c.note}</span>
                </span>
              </span>
              <span className="text-[13px] font-semibold text-ink-2 whitespace-nowrap">{c.cadence}</span>
            </div>
          ))}
        </div>
      </Group>

      <Group k="templates" title="Message templates">
        <div className="flex flex-col">
          {templates.map((t) => (
            <div key={t.id} className="min-h-[52px] flex justify-between items-center gap-3 border-b border-line">
              <div className="flex flex-col">
                <span className="text-[15px] leading-5 font-semibold">{t.name}</span>
                <span className="text-[12px] leading-4 text-ink-3">{t.whenHint}</span>
              </div>
            </div>
          ))}
        </div>
      </Group>

      <Group k="category_colours" title="Category colours" />

      <Group k="calendar_colours" title="Calendar">
        <p className="text-small text-ink-2">
          Creates one Google Calendar event per due follow-up, coloured by category.
          Uses the calendar.events scope only.
        </p>
        <CalendarSync enabled={syncEnabled()} dryRun={dryRunOnly()} />
      </Group>

      <Group k="digest" title="Morning digest">
        <p className="text-small text-ink-2">
          Weekday 07:00 SAST summary of who is due and overdue, posted to Slack. Skips
          public holidays. Dry-run by default.
        </p>
      </Group>
    </main>
  );
}
