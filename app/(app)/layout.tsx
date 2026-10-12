import { requireUser } from "@/lib/session";
import { AppChrome } from "@/components/AppChrome";
import { getDueSellers, getAgent } from "@/lib/queries";
import { todayInJohannesburg } from "@/lib/followup";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const today = todayInJohannesburg();
  const [due, agent] = await Promise.all([getDueSellers(today), getAgent()]);
  return (
    <AppChrome dueCount={due.length} agentName={agent.name} agentEmail={user.email}>
      {children}
    </AppChrome>
  );
}
