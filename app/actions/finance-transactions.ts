"use server";

import {
  searchTransactions,
  type TxnFilters,
  type TxnPage,
} from "@/lib/queries/finance-transactions";

// The explorer's "load more" — the client hands back the filters it's showing
// plus the last cursor; we re-derive the group from the session (never trust a
// client-supplied group) and return the next page. Read-only, so no revalidate.
export async function loadMoreTransactionsAction(
  filters: TxnFilters,
  cursor: string | null,
): Promise<TxnPage> {
  return searchTransactions(filters, cursor);
}
