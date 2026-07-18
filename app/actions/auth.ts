"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkPassword,
  setEditorCookie,
  clearEditorCookie,
} from "@/lib/auth";

export type UnlockState = { ok: true } | { ok: false; error: string };

/**
 * Inline unlock — used by the profile-menu password dialog. Returns a result so
 * the dialog can show an error in place; on success it revalidates so editor
 * permissions refresh live, without navigating you away from where you are.
 */
export async function unlockInlineAction(
  _prev: UnlockState | null,
  formData: FormData,
): Promise<UnlockState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) return { ok: false, error: "Incorrect password." };

  await setEditorCookie();
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Full-page unlock — the `/unlock` fallback route that gated pages redirect to
 * when a locked visitor deep-links into an editor-only page. On success, home.
 */
export async function unlockAction(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");

  if (!checkPassword(password)) {
    redirect("/unlock?error=1");
  }

  await setEditorCookie();
  revalidatePath("/", "layout");
  redirect("/");
}

/** Clear the editor cookie (lock editing) and refresh the current page in place. */
export async function lockAction(): Promise<void> {
  await clearEditorCookie();
  revalidatePath("/", "layout");
}
