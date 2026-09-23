import Link from "@/components/shared/AppLink";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getSession } from "@/lib/session";
import { isEditor } from "@/lib/auth";
import { getGroupTimezone } from "@/lib/queries/group";
import { lastDayOfMonth, todayISO } from "@/lib/finance/parse";
import { formatMoney, formatMonth } from "@/lib/format";
import { searchTransactionsForGroup, type TxnFilters } from "@/lib/queries/finance-transactions";
import {
  cashFlowByMonth,
  incomeByTag,
  spendByTag,
  summarizeCashFlow,
} from "@/lib/queries/finance-cashflow";
import {
  listIncomeCategoriesForGroup,
  listSpendCategoriesForGroup,
} from "@/lib/queries/finance-categories";
import { UNTAGGED, type Flow } from "@/lib/finance/cashflow";
import {
  listBills,
  listMerchantSuggestions,
  listOpenFunds,
} from "@/lib/queries/finance-budget";
import TxnFilterBar, { type RawFilters } from "@/components/finance/TxnFilterBar";
import TransactionsTable from "@/components/finance/TransactionsTable";
import CashFlowHistory from "@/components/finance/CashFlowHistory";
import ListFilterChip from "@/components/finance/ListFilterChip";

export const metadata = { title: "History" };

const str = (v: string | undefined) => {
  const s = (v ?? "").trim();
  return s === "" ? undefined : s;
};
const numv = (v: string | undefined) => {
  const s = (v ?? "").trim().replace(/[$,]/g, "");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};
const datev = (v: string | undefined) => {
  const s = (v ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
};
/** First day of the month `n - 1` months before `iso`'s — n whole months incl. this one. */
function monthStartAgo(iso: string, n: number): string {
  const d = new Date(`${iso.slice(0, 7)}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - (n - 1));
  return d.toISOString().slice(0, 10);
}

const RANGE_LABELS: Record<string, string> = {
  all: "All time",
  year: "This year",
  "6mo": "Past 6 months",
  "12mo": "Past 12 months",
  custom: "Custom range",
};

// History (F4b + cash flow) — money in & out by month for the filtered range,
// where it went by tag, and the searchable ledger beneath. Defaults to this
// year; presets resolve against the HOUSEHOLD's today and start on a month
// boundary so every bar is a whole month. `m` (YYYY-MM) drills into one month:
// the tag breakdown and the list follow it, while the bars keep the whole
// range. `tag` + `tagflow` narrow just the list to one tapped slice.
export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (session === null) redirect("/login");

  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const groupId = session.groupId;
  const tz = await getGroupTimezone(groupId);
  const today = todayISO(tz);

  const range = str(get("range")) ?? "year";
  let from: string | undefined;
  let to: string | undefined;
  if (range === "custom") {
    from = datev(get("from"));
    to = datev(get("to"));
  } else if (range === "year") {
    from = `${today.slice(0, 4)}-01-01`;
  } else if (range === "6mo") {
    from = monthStartAgo(today, 6);
  } else if (range === "12mo") {
    from = monthStartAgo(today, 12);
  }

  const catParam = str(get("cat"));
  const filters: TxnFilters = {
    q: str(get("q")),
    min: numv(get("min")),
    max: numv(get("max")),
    from,
    to,
    category: catParam && catParam !== "__none__" ? catParam : undefined,
    uncategorized: catParam === "__none__",
  };

  // The drilled month, clipped to the range so a custom partial month stays honest.
  const mParam = str(get("m"));
  const month = mParam && /^\d{4}-\d{2}$/.test(mParam) ? `${mParam}-01` : null;
  const scoped: TxnFilters = month
    ? {
        ...filters,
        from: from && from > month ? from : month,
        to: to && to < lastDayOfMonth(month) ? to : lastDayOfMonth(month),
      }
    : filters;

  // A tapped slice: only the rows that make up that slice (same flow + tag).
  const tag = str(get("tag")) ?? null;
  const tagFlow: Flow = get("tagflow") === "in" ? "in" : "out";
  const listFilters: TxnFilters = tag
    ? {
        ...scoped,
        category: tag === UNTAGGED ? undefined : tag,
        uncategorized: tag === UNTAGGED,
        flow: tagFlow,
      }
    : scoped;

  const raw: RawFilters = {
    q: str(get("q")) ?? "",
    min: str(get("min")) ?? "",
    max: str(get("max")) ?? "",
    range,
    from: datev(get("from")) ?? "",
    to: datev(get("to")) ?? "",
    cat: catParam ?? "",
  };

  const [
    page,
    listSummary,
    months,
    rangeTags,
    drillTags,
    rangeIncomeTags,
    drillIncomeTags,
    categories,
    incomeCategories,
    funds,
    bills,
    suggest,
    editor,
  ] = await Promise.all([
    searchTransactionsForGroup(groupId, listFilters, null),
    summarizeCashFlow(groupId, listFilters),
    cashFlowByMonth(groupId, filters),
    spendByTag(groupId, filters),
    month ? spendByTag(groupId, scoped) : Promise.resolve([]),
    incomeByTag(groupId, filters),
    month ? incomeByTag(groupId, scoped) : Promise.resolve([]),
    listSpendCategoriesForGroup(groupId),
    listIncomeCategoriesForGroup(groupId),
    listOpenFunds(),
    listBills(),
    listMerchantSuggestions(),
    isEditor(),
  ]);
  const tagLabel = tag === UNTAGGED ? "Untagged" : tag;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Button
        component={Link}
        href="/finance"
        startIcon={<ArrowBackIcon />}
        color="inherit"
        sx={{ mb: 2 }}
      >
        Back to budget
      </Button>

      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h3" component="h1">
          History
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary" fontWeight={400}>
          Everything that came in and went out
        </Typography>
      </Stack>

      <TxnFilterBar
        raw={raw}
        categories={[...new Set([...categories, ...incomeCategories])].sort()}
      />

      <CashFlowHistory
        months={months}
        selected={month}
        rangeLabel={RANGE_LABELS[range] ?? "This year"}
        rangeTags={rangeTags}
        drillTags={drillTags}
        rangeIncomeTags={rangeIncomeTags}
        drillIncomeTags={drillIncomeTags}
        tag={tag}
        tagFlow={tagFlow}
      />

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, px: 0.5, flexWrap: "wrap", rowGap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {listSummary.count === 0
            ? "No matches"
            : `${listSummary.count.toLocaleString()} ${
                listSummary.count === 1 ? "transaction" : "transactions"
              }${month ? ` in ${formatMonth(month)}` : ""}`}
        </Typography>
        {tagLabel ? (
          <ListFilterChip
            label={`${tagLabel} ${tagFlow === "in" ? "income" : "spending"} · ${formatMoney(
              tagFlow === "in" ? listSummary.moneyIn : listSummary.moneyOut,
            )}`}
            params={["tag", "tagflow"]}
          />
        ) : null}
      </Stack>

      <TransactionsTable
        key={JSON.stringify(listFilters)}
        filters={listFilters}
        initialRows={page.rows}
        initialCursor={page.nextCursor}
        emptyText="No transactions match these filters."
        funds={funds}
        bills={bills}
        merchants={suggest.merchants}
        sources={suggest.sources}
        categories={categories}
        incomeCategories={incomeCategories}
        editable={editor}
      />
    </Container>
  );
}
