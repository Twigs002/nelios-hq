import { requireUser } from "@/lib/session";
import { getSellersByDue } from "@/lib/queries";
import { todayInJohannesburg } from "@/lib/followup";
import { decorateSeller } from "@/lib/view";
import { Board } from "@/components/Board";

export default async function BoardPage() {
  await requireUser();
  const today = todayInJohannesburg();
  const rows = (await getSellersByDue()).map((s) => decorateSeller(s, today));
  const counts = {
    total: rows.length,
    overdue: rows.filter((s) => s.dueState === "overdue").length,
    today: rows.filter((s) => s.dueState === "today").length,
  };
  return <Board sellers={rows} counts={counts} />;
}
