import Link from "@/components/shared/AppLink";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getSession } from "@/lib/session";
import { isEditor } from "@/lib/auth";
import { getGroupTimezone } from "@/lib/queries/group";
import { todayISO } from "@/lib/finance/parse";
import { formatMoney } from "@/lib/format";
import {
  searchTransactionsForGroup,
  summarizeTransactionsForGroup,
  type TxnFilters,
} from "@/lib/queries/finance-transactions";
import { listSpendCategoriesForGroup } from "@/lib/queries/finance-categories";
import TxnFilterBar, { type RawFilters } from "@/components/finance/TxnFilterBar";
import TransactionsExplorer from "@/components/finance/TransactionsExplorer";

export const metadata = { title: "Transactions" };

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
function monthsAgo(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString().slice(0, 10);
}

// F4b — the all-time transactions explorer. Presets ("this year", "past 12
// months") resolve against the HOUSEHOLD's today, then everything flows through
// the same group-scoped keyset search the infinite scroll uses.
export default async function TransactionsPage({
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

  const range = str(get("range")) ?? "all";
  let from: string | undefined;
  let to: string | undefined;
  if (range === "custom") {
    from = datev(get("from"));
    to = datev(get("to"));
  } else if (range === "year") {
    from = `${today.slice(0, 4)}-01-01`;
  } else if (range === "12mo") {
    from = monthsAgo(today, 12);
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

  const raw: RawFilters = {
    q: str(get("q")) ?? "",
    min: str(get("min")) ?? "",
    max: str(get("max")) ?? "",
    range,
    from: datev(get("from")) ?? "",
    to: datev(get("to")) ?? "",
    cat: catParam ?? "",
  };

  const [page, summary, categories, editor] = await Promise.all([
    searchTransactionsForGroup(groupId, filters, null),
    summarizeTransactionsForGroup(groupId, filters),
    listSpendCategoriesForGroup(groupId),
    isEditor(),
  ]);

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
          Transactions
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary" fontWeight={400}>
          Search everything you&apos;ve spent
        </Typography>
      </Stack>

      <TxnFilterBar raw={raw} categories={categories} />

      <Box sx={{ mb: 2, px: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {summary.count === 0
            ? "No matches"
            : `${summary.count.toLocaleString()} ${
                summary.count === 1 ? "match" : "matches"
              } · ${formatMoney(summary.total)} total`}
        </Typography>
      </Box>

      <TransactionsExplorer
        key={JSON.stringify(filters)}
        filters={filters}
        initialRows={page.rows}
        initialCursor={page.nextCursor}
        funds={[]}
        categories={categories}
        editable={editor}
      />
    </Container>
  );
}
