"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, isNull, max, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { financialAccounts, accountSnapshots, savingsGoals } from "@/lib/db/schema";
import { requireEditor } from "@/lib/auth";
import { requireGroupId } from "@/lib/session";

// Net worth writes. Everything here is HOUSEHOLD data → requireEditor()
// (communal), scoped to the session group. Money fields arrive as raw strings
// from NumberField's hidden input.

const FINANCE = "/finance";

/** "2026-08" (input type=month) or "2026-08-xx" → "2026-08-01"; null if bogus. */
function normalizeMonth(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  const m = /^(\d{4})-(\d{2})/.exec(s);
  if (!m) return null;
  const mm = Number(m[2]);
  if (mm < 1 || mm > 12) return null;
  return `${m[1]}-${m[2]}-01`;
}

/** A clean money string ("1234.56") or null. Negatives allowed (loans someday). */
function money(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n.toFixed(2) : null;
}

const ACCOUNT_KINDS = new Set([
  "checking",
  "savings",
  "brokerage",
  "retirement",
  "crypto",
  "hsa",
  "credit_card",
  "other",
]);

// ── The monthly ritual ────────────────────────────────────────────────────────
/**
 * Log (or overwrite) one month's balances in a single statement. The form
 * carries one `balance_<accountId>` field per account; blanks are skipped, so a
 * partial log is fine and never nulls out an existing value.
 */
export async function saveSnapshotsAction(formData: FormData): Promise<void> {
  await requireEditor();
  const groupId = await requireGroupId();

  const month = normalizeMonth(formData.get("month"));
  if (!month) throw new Error("Pick a month.");

  // Only OUR accounts can be written — unknown/foreign ids are ignored.
  const ours = await db
    .select({ id: financialAccounts.id })
    .from(financialAccounts)
    .where(eq(financialAccounts.groupId, groupId));

  const rows = ours.flatMap(({ id }) => {
    const balance = money(formData.get(`balance_${id}`));
    return balance === null ? [] : [{ accountId: id, month, balance }];
  });
  if (rows.length === 0) throw new Error("Enter at least one balance.");

  // One multi-row upsert = one statement (atomic on the transactionless driver).
  await db
    .insert(accountSnapshots)
    .values(rows)
    .onConflictDoUpdate({
      target: [accountSnapshots.accountId, accountSnapshots.month],
      set: { balance: sql`excluded.balance` },
    });

  revalidatePath(FINANCE);
}

/** Remove one account's snapshot for one month (fat-fingered a month). */
export async function deleteSnapshotAction(
  accountId: number,
  month: string,
  _formData: FormData,
): Promise<void> {
  await requireEditor();
  const groupId = await requireGroupId();
  const normalized = normalizeMonth(month);
  if (!normalized) return;

  const [account] = await db
    .select({ id: financialAccounts.id })
    .from(financialAccounts)
    .where(
      and(eq(financialAccounts.id, accountId), eq(financialAccounts.groupId, groupId)),
    )
    .limit(1);
  if (!account) throw new Error("Account not found.");

  await db
    .delete(accountSnapshots)
    .where(
      and(
        eq(accountSnapshots.accountId, accountId),
        eq(accountSnapshots.month, normalized),
      ),
    );
  revalidatePath(FINANCE);
}

/** Delete a whole month's row — every account's balance for that month. */
export async function deleteMonthSnapshotsAction(
  month: string,
  _formData: FormData,
): Promise<void> {
  await requireEditor();
  const groupId = await requireGroupId();
  const normalized = normalizeMonth(month);
  if (!normalized) return;

  const ours = await db
    .select({ id: financialAccounts.id })
    .from(financialAccounts)
    .where(eq(financialAccounts.groupId, groupId));
  const ids = ours.map((a) => a.id);
  if (ids.length === 0) return;

  await db
    .delete(accountSnapshots)
    .where(
      and(
        inArray(accountSnapshots.accountId, ids),
        eq(accountSnapshots.month, normalized),
      ),
    );
  revalidatePath(FINANCE);
}

// ── Accounts ──────────────────────────────────────────────────────────────────
function parseAccount(formData: FormData) {
  const kindRaw = String(formData.get("kind") ?? "other");
  return {
    name: String(formData.get("name") ?? "").trim(),
    kind: ACCOUNT_KINDS.has(kindRaw) ? kindRaw : "other",
    includeInBankSaved: formData.get("includeInBankSaved") != null,
    trackBalance: formData.get("trackBalance") != null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function addAccountAction(formData: FormData): Promise<void> {
  await requireEditor();
  const groupId = await requireGroupId();
  const data = parseAccount(formData);
  if (!data.name) throw new Error("Account name is required.");

  const [{ maxSort }] = await db
    .select({ maxSort: max(financialAccounts.sortOrder) })
    .from(financialAccounts)
    .where(eq(financialAccounts.groupId, groupId));

  await db
    .insert(financialAccounts)
    .values({ ...data, groupId, sortOrder: (maxSort ?? 0) + 1 });
  revalidatePath(FINANCE);
}

export async function updateAccountAction(
  id: number,
  formData: FormData,
): Promise<void> {
  await requireEditor();
  const groupId = await requireGroupId();
  const data = parseAccount(formData);
  if (!data.name) throw new Error("Account name is required.");

  await db
    .update(financialAccounts)
    .set(data)
    .where(
      and(eq(financialAccounts.id, id), eq(financialAccounts.groupId, groupId)),
    );
  revalidatePath(FINANCE);
}

/** Soft-close (keep history) or reopen an account. */
export async function setAccountArchivedAction(
  id: number,
  archived: boolean,
  _formData: FormData,
): Promise<void> {
  await requireEditor();
  const groupId = await requireGroupId();
  await db
    .update(financialAccounts)
    .set({ archivedAt: archived ? new Date() : null })
    .where(
      and(eq(financialAccounts.id, id), eq(financialAccounts.groupId, groupId)),
    );
  revalidatePath(FINANCE);
}

/** Hard delete — cascades every snapshot. The UI confirms loudly. */
export async function deleteAccountAction(
  id: number,
  _formData: FormData,
): Promise<void> {
  await requireEditor();
  const groupId = await requireGroupId();
  await db
    .delete(financialAccounts)
    .where(
      and(eq(financialAccounts.id, id), eq(financialAccounts.groupId, groupId)),
    );
  revalidatePath(FINANCE);
}

// ── Savings goal (effective-dated segments, weightPlans-style) ────────────────
/**
 * Edit the ACTIVE goal in place (typo fix / same-timeframe adjustment). The
 * start month is editable too: it decides when the goal line starts
 * accumulating, so getting it wrong is the one mistake that makes the goal
 * look like it doesn't exist.
 */
export async function saveSavingsGoalAction(formData: FormData): Promise<void> {
  await requireEditor();
  const groupId = await requireGroupId();

  const monthlyGoal = money(formData.get("monthlyGoal"));
  if (monthlyGoal === null) throw new Error("Monthly goal is required.");

  // Latest-starting open segment — the same row the dashboard calls "active",
  // so Adjust always edits the goal the dialog just showed.
  const [active] = await db
    .select()
    .from(savingsGoals)
    .where(and(eq(savingsGoals.groupId, groupId), isNull(savingsGoals.endMonth)))
    .orderBy(desc(savingsGoals.startMonth), desc(savingsGoals.id))
    .limit(1);

  const startMonth =
    normalizeMonth(formData.get("startMonth")) ??
    active?.startMonth ??
    normalizeMonth(new Date().toISOString())!;

  if (active) {
    await db
      .update(savingsGoals)
      .set({ monthlyGoal, startMonth })
      .where(eq(savingsGoals.id, active.id));
  } else {
    await db.insert(savingsGoals).values({ groupId, monthlyGoal, startMonth });
  }
  revalidatePath(FINANCE);
}

/**
 * Start a NEW goal segment from a month (raise season). INSERT the new segment
 * FIRST, then end-date the old — a crash between the two leaves a harmless
 * overlap (latest-starting wins) instead of a hole.
 */
export async function startSavingsGoalAction(formData: FormData): Promise<void> {
  await requireEditor();
  const groupId = await requireGroupId();

  const monthlyGoal = money(formData.get("monthlyGoal"));
  const startMonth = normalizeMonth(formData.get("startMonth"));
  if (monthlyGoal === null || !startMonth) {
    throw new Error("Monthly goal and start month are required.");
  }

  const [active] = await db
    .select()
    .from(savingsGoals)
    .where(and(eq(savingsGoals.groupId, groupId), isNull(savingsGoals.endMonth)))
    .limit(1);

  await db.insert(savingsGoals).values({ groupId, monthlyGoal, startMonth });

  if (active && active.startMonth < startMonth) {
    // Previous segment ends the month before the new one starts.
    const d = new Date(`${startMonth}T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - 1);
    const endMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
    await db
      .update(savingsGoals)
      .set({ endMonth })
      .where(eq(savingsGoals.id, active.id));
  } else if (active) {
    // New segment starts at/before the old one — the old row is superseded
    // entirely; close it out at its own start so it can't shadow anything.
    await db
      .update(savingsGoals)
      .set({ endMonth: active.startMonth })
      .where(eq(savingsGoals.id, active.id));
  }
  revalidatePath(FINANCE);
}
