import { requireUser } from "@/lib/session";
import { getTemplates } from "@/lib/queries";

export default async function TemplatesPage() {
  await requireUser();
  const templates = await getTemplates();
  return (
    <main className="px-6 md:px-8 pt-6 md:pt-10 max-w-3xl">
      <span className="label">Templates</span>
      <h1 className="text-h1 mt-2">Message templates</h1>
      <div className="mt-6 flex flex-col">
        {templates.map((t) => (
          <div key={t.id} className="min-h-[52px] py-4 border-b border-line flex flex-col gap-1">
            <span className="text-[15px] font-semibold">{t.name}</span>
            <span className="text-small text-ink-3">{t.whenHint}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
