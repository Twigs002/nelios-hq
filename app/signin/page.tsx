import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { allowedEmails } from "@/lib/allowlist";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.email) redirect("/");
  const { error } = await searchParams;
  const refused = error === "AccessDenied";
  const devLogin = process.env.AUTH_DEV_LOGIN === "true";
  const demo = process.env.DEMO_DB === "true";
  const emails = allowedEmails();

  return (
    <main className="min-h-dvh bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-[360px] flex flex-col items-center gap-8 text-center">
        <Image
          src="/brand/quay1-logo-blue.png"
          alt="Quay 1 International Realty"
          width={160}
          height={44}
          className="h-auto w-[160px]"
          priority
        />
        <div className="flex flex-col gap-2">
          <span className="label">Nelio&apos;s HQ</span>
          <h1 className="text-h1">{demo ? "Live demo" : "Welcome back"}</h1>
          <p className="text-body text-ink-2">
            {demo
              ? "A quick look with sample data. Pick a person to explore."
              : "Sign in with your Quay 1 Google account to continue."}
          </p>
        </div>

        {refused && (
          <p className="text-small text-signal border border-signal/40 rounded-2 px-4 py-3">
            That account is not on the list for this tool. Ask Nelio to add you, then try
            again.
          </p>
        )}

        {!demo && (
          <form
            className="w-full"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full h-12 rounded-2 border border-line-strong bg-raised text-ink font-semibold text-[15px] flex items-center justify-center gap-3 transition-colors duration-[180ms] hover:bg-paper"
            >
              <GoogleGlyph />
              Continue with Google
            </button>
          </form>
        )}

        {devLogin && (
          <form
            className={`w-full flex flex-col gap-2 ${demo ? "" : "border-t border-line pt-6"}`}
            action={async (fd) => {
              "use server";
              await signIn("dev", { email: String(fd.get("email")), redirectTo: "/" });
            }}
          >
            <span className="label">{demo ? "Explore as" : "Local dev sign-in"}</span>
            <select
              name="email"
              defaultValue={emails[0] ?? ""}
              className="h-11 px-3 bg-raised border border-line-strong rounded-2 text-[16px] text-ink"
            >
              {emails.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className={`h-11 rounded-2 font-semibold text-[14px] ${demo ? "bg-accent text-accent-ink hover:bg-accent-hover" : "border border-line-strong bg-transparent text-ink hover:bg-paper"}`}
            >
              {demo ? "Enter the demo" : "Continue without Google"}
            </button>
          </form>
        )}

        <p className="text-small text-ink-3">
          Private tool. Access is limited to approved people.
        </p>
      </div>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.98 8.98 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
