"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkPassword,
  setEditorCookie,
  clearEditorCookie,
} from "@/lib/auth";

/** Handle the unlock form. On success, set the editor cookie and go home. */
export async function unlockAction(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");

  if (!checkPassword(password)) {
    redirect("/unlock?error=1");
  }

  await setEditorCookie();
  revalidatePath("/", "layout");
  redirect("/");
}

/** Clear the editor cookie (lock editing). */
export async function lockAction(): Promise<void> {
  await clearEditorCookie();
  revalidatePath("/", "layout");
  redirect("/");
}
