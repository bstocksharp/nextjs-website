import { redirect } from "next/navigation";
import { destroySession } from "@/lib/session";

// Cookie graveyard (Phase E). requireSession() sends holders of a DEAD session
// here — a valid-signed cookie whose account was removed. It must be a public
// route (see proxy.ts): the whole point is that these visitors can't pass the
// normal gates, and bouncing them to /login directly would loop (the proxy
// redirects signed-cookie holders off /login). GET is fine — clearing your own
// session is idempotent and needs no CSRF ceremony.
export async function GET() {
  await destroySession();
  redirect("/login");
}
