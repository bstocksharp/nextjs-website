import { redirect } from "next/navigation";

// The Budget tab moved to the finance app's root (/finance). This stub keeps
// old links working — phone bookmarks, the Shortcut, anything already saved.
// Safe to delete once nothing points here.
export default function BudgetMoved() {
  redirect("/finance");
}
