"use server";

import { revalidatePath } from "next/cache";
import { requireEditor } from "@/lib/auth";
import { requireGroupId } from "@/lib/session";
import {
  retagGroupForGroup,
  upsertNameForGroup,
  removeNameForGroup,
  renameGroupForGroup,
  deleteGroupForGroup,
} from "@/lib/queries/finance-categories";

// The Categories page's writes. Each re-derives the group from the session and
// revalidates the spend surfaces so their chips reflect the sweep.
async function editorGroupId(): Promise<number> {
  await requireEditor();
  return requireGroupId();
}
function revalidateSpend(): void {
  revalidatePath("/finance/categories");
  revalidatePath("/finance");
  revalidatePath("/finance/transactions");
}

export async function retagGroupAction(name: string, category: string): Promise<void> {
  await retagGroupForGroup(await editorGroupId(), name, category);
  revalidateSpend();
}

export async function upsertNameAction(
  name: string,
  category: string,
  pattern: string,
): Promise<void> {
  await upsertNameForGroup(await editorGroupId(), name, category, pattern);
  revalidateSpend();
}

export async function removeNameAction(ruleId: number): Promise<void> {
  await removeNameForGroup(await editorGroupId(), ruleId);
  revalidateSpend();
}

export async function renameGroupAction(oldName: string, newName: string): Promise<void> {
  await renameGroupForGroup(await editorGroupId(), oldName, newName);
  revalidateSpend();
}

export async function deleteGroupAction(name: string): Promise<void> {
  await deleteGroupForGroup(await editorGroupId(), name);
  revalidateSpend();
}
