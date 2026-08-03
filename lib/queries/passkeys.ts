import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { passkeys, type Passkey } from "@/lib/db/schema";

/** All of an account's passkeys, newest first (the /passkeys list). */
export function listPasskeys(accountId: number): Promise<Passkey[]> {
  return db
    .select()
    .from(passkeys)
    .where(eq(passkeys.accountId, accountId))
    .orderBy(desc(passkeys.createdAt));
}

/** One passkey by its WebAuthn credential id (login lookup). */
export async function getPasskey(id: string): Promise<Passkey | null> {
  const [row] = await db.select().from(passkeys).where(eq(passkeys.id, id)).limit(1);
  return row ?? null;
}
