import Link from "@/components/shared/AppLink";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getSession } from "@/lib/session";
import { isEditor } from "@/lib/auth";
import { getMerchantGroupsForGroup } from "@/lib/queries/finance-categories";
import MerchantGroups from "@/components/finance/MerchantGroups";

export const metadata = { title: "Categories" };

// F4d — the merchant-groups management page. A group is a NAME + a category +
// several match-names; retag a whole group at once, fold names together, and
// mop up the ungrouped tail.
export default async function CategoriesPage() {
  const session = await getSession();
  if (session === null) redirect("/login");

  const [view, editor] = await Promise.all([
    getMerchantGroupsForGroup(session.groupId),
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
          Categories
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary" fontWeight={400}>
          Group your merchants and tag each group
        </Typography>
      </Stack>

      <MerchantGroups view={view} editable={editor} />
    </Container>
  );
}
