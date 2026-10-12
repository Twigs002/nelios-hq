import Image from "next/image";

// Public offline fallback (served by the service worker when a navigation
// fails). No seller data, so it is safe to show without a session.
export default function OfflinePage() {
  return (
    <main className="min-h-dvh bg-paper flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-[320px]">
        <Image src="/brand/quay1-logo-blue.png" alt="Quay 1 International Realty" width={140} height={38} className="w-[140px] h-auto" priority />
        <div className="flex flex-col gap-2">
          <h1 className="text-h2">You are offline</h1>
          <p className="text-body text-ink-2">
            Nelio&apos;s HQ needs a connection to load your sellers. Check your signal and try
            again.
          </p>
        </div>
      </div>
    </main>
  );
}
