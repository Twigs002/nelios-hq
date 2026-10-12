// Server-side access check. Call at the top of every protected page, route
// handler and server action (defence in depth, not just middleware).
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAllowed } from "./allowlist";

export interface SessionUser {
  email: string;
  name?: string | null;
  image?: string | null;
}

/** Returns the signed-in, allowlisted user, or redirects to /signin. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !isAllowed(email)) {
    redirect("/signin");
  }
  return {
    email,
    name: session!.user?.name,
    image: session!.user?.image,
  };
}

/** Like requireUser but for route handlers: throws a 401 Response instead. */
export async function requireUserOr401(): Promise<SessionUser> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !isAllowed(email)) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return { email, name: session!.user?.name, image: session!.user?.image };
}
