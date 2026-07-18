import Link from "next/link";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { isEditor } from "@/lib/auth";
import { listAllProfiles } from "@/lib/queries/profiles";
import { getActiveProfile } from "@/lib/profile";
import EditProfileButton from "@/components/shared/EditProfileButton";

export const metadata = { title: "People" };

function initial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? "?";
}

export default async function PeoplePage() {
  if (!(await isEditor())) redirect("/unlock");

  const [all, active] = await Promise.all([
    listAllProfiles(),
    getActiveProfile(),
  ]);
  const activeProfiles = all.filter((p) => !p.archivedAt);
  const canDeactivate = activeProfiles.length > 1;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
      <Button
        component={Link}
        href="/"
        startIcon={<ArrowBackIcon />}
        color="inherit"
        sx={{ mb: 2 }}
      >
        Back to hub
      </Button>

      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        People
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Open a person to edit their name, color &amp; which apps they see — or, in
        the Danger zone, deactivate them (hidden but kept, restore anytime) or
        delete forever. Add people from the profile menu in any app header.
      </Typography>

      <Stack spacing={1.5}>
        {all.map((p) => {
          const archived = !!p.archivedAt;
          const heirs = activeProfiles
            .filter((x) => x.id !== p.id)
            .map((x) => ({ id: x.id, name: x.name }));

          return (
            <Paper
              key={p.id}
              variant="outlined"
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
                opacity: archived ? 0.7 : 1,
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: 15,
                  fontWeight: 700,
                  bgcolor: p.color ?? "primary.main",
                  color: "#fff",
                }}
              >
                {initial(p.name)}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography fontWeight={600} component="span">
                  {p.name}
                </Typography>
                {active?.id === p.id ? (
                  <Chip size="small" label="Active" color="primary" sx={{ ml: 1 }} />
                ) : null}
                {archived ? (
                  <Chip size="small" label="Archived" sx={{ ml: 1 }} />
                ) : null}
              </Box>

              <EditProfileButton
                profileId={p.id}
                profileName={p.name}
                profileColor={p.color}
                profileHiddenApps={p.hiddenApps}
                archived={archived}
                canDeactivate={canDeactivate}
                heirs={heirs}
              />
            </Paper>
          );
        })}
      </Stack>
    </Container>
  );
}
