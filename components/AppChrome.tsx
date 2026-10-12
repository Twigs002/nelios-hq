"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { QuickAddSheet } from "@/components/QuickAddSheet";

const NAV = [
  { href: "/today", label: "Today", icon: IconToday },
  { href: "/board", label: "Board", icon: IconBoard },
  { href: "/templates", label: "Templates", icon: IconTemplates },
  { href: "/settings", label: "Settings", icon: IconSettings },
] as const;

export function AppChrome({
  children,
  dueCount,
  agentName,
  agentEmail,
}: {
  children: React.ReactNode;
  dueCount: number;
  agentName: string;
  agentEmail: string;
}) {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  // Seller detail is a drill-in with its own bottom action bar; hide the tab bar there.
  const hideMobileNav = pathname.startsWith("/sellers/");

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[208px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col gap-8 bg-surface border-r border-line px-4 py-8 h-dvh sticky top-0">
        <div className="px-3 flex flex-col gap-4">
          <Image src="/brand/quay1-logo-blue.png" alt="Quay 1 International Realty" width={136} height={37} className="w-[136px] h-auto" priority />
          <span className="label">Nelio&apos;s HQ</span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative h-11 flex items-center justify-between px-3 rounded-2 text-[14px] ${active ? "bg-highlight-soft text-ink font-bold" : "text-ink-2 font-medium hover:bg-paper"}`}
              >
                {active && <span className="absolute left-0 top-3 bottom-3 w-0.5 bg-highlight" />}
                <span>{label}</span>
                {href === "/today" && dueCount > 0 && (
                  <span className="text-[12px] font-bold text-signal tnum">{dueCount}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setAddOpen(true)}
          className="h-11 rounded-2 bg-accent text-accent-ink font-semibold text-[14px] flex items-center justify-center gap-2.5 hover:bg-accent-hover"
        >
          <Plus />
          New seller
        </button>
        <div className="mt-auto pt-4 px-3 border-t border-line flex flex-col gap-0.5">
          <span className="text-[14px] font-semibold">{agentName}</span>
          <span className="text-[12px] text-ink-3">{agentEmail}</span>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0 pb-[88px] md:pb-0">{children}</div>

      {/* Mobile tab bar */}
      {!hideMobileNav && (
      <nav
        className="md:hidden fixed left-0 right-0 bottom-0 bg-surface border-t border-line grid grid-cols-5 z-40"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <TabItem href="/today" label="Today" Icon={IconToday} active={isActive("/today")} />
        <TabItem href="/board" label="Board" Icon={IconBoard} active={isActive("/board")} />
        <button onClick={() => setAddOpen(true)} className="flex flex-col items-center justify-center gap-1.5 pt-2.5 text-ink-3">
          <span className="w-10 h-7 bg-accent rounded-2 relative">
            <span className="absolute left-[13px] top-[13px] w-3.5 h-0.5 bg-accent-ink" />
            <span className="absolute left-[19px] top-[7px] w-0.5 h-3.5 bg-accent-ink" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.08em] uppercase">Add</span>
        </button>
        <TabItem href="/templates" label="Templates" Icon={IconTemplates} active={isActive("/templates")} />
        <TabItem href="/settings" label="Settings" Icon={IconSettings} active={isActive("/settings")} />
      </nav>
      )}

      <QuickAddSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function TabItem({ href, label, Icon, active }: { href: string; label: string; Icon: () => React.ReactElement; active: boolean }) {
  return (
    <Link href={href} className={`relative flex flex-col items-center justify-center gap-1.5 pt-2.5 pb-1 ${active ? "text-ink" : "text-ink-3"}`}>
      {active && <span className="absolute top-0 w-6 h-0.5 bg-highlight" />}
      <Icon />
      <span className="text-[10px] font-bold tracking-[0.08em] uppercase">{label}</span>
    </Link>
  );
}

function Plus() {
  return (
    <span className="relative w-3 h-3" aria-hidden="true">
      <span className="absolute left-0 top-[5px] w-3 h-0.5 bg-current" />
      <span className="absolute left-[5px] top-0 w-0.5 h-3 bg-current" />
    </span>
  );
}
function IconToday() {
  return (
    <span className="w-[18px] h-[18px] border-[1.5px] border-current rounded-full grid place-items-center" aria-hidden="true">
      <span className="w-1.5 h-1.5 bg-current rounded-full" />
    </span>
  );
}
function IconBoard() {
  return (
    <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="w-2 h-2 border-[1.5px] border-current" />
      ))}
    </span>
  );
}
function IconTemplates() {
  return (
    <span className="flex flex-col gap-1 w-[18px] py-0.5" aria-hidden="true">
      <span className="h-[1.5px] bg-current" />
      <span className="h-[1.5px] bg-current" />
      <span className="h-[1.5px] w-[11px] bg-current" />
    </span>
  );
}
function IconSettings() {
  return (
    <span className="flex flex-col gap-[7px] w-[18px] py-0.5" aria-hidden="true">
      <span className="relative h-[1.5px] bg-current">
        <span className="absolute left-0.5 -top-[3.25px] w-2 h-2 rounded-full bg-surface border-[1.5px] border-current" />
      </span>
      <span className="relative h-[1.5px] bg-current">
        <span className="absolute right-0.5 -top-[3.25px] w-2 h-2 rounded-full bg-surface border-[1.5px] border-current" />
      </span>
    </span>
  );
}
