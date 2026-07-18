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
import { deactivateProfile, reactivateProfile } from "@/app/actions/profile";
import DeleteProfileButton from "@/components/shared/DeleteProfileButton";

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
        Deactivate hides someone but keeps everything (restore anytime). Delete
        forever removes them — their shared cars &amp; workouts move to someone
        else; their private cars and schedule are deleted. Add people from the
        profile menu in any app header.
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

              {archived ? (
                <form action={reactivateProfile.bind(null, p.id)}>
                  <Button type="submit" size="small">
                    Reactivate
                  </Button>
                </form>
              ) : (
                <form action={deactivateProfile.bind(null, p.id)}>
                  <Button
                    type="submit"
                    size="small"
                    color="inherit"
                    disabled={!canDeactivate}
                  >
                    Deactivate
                  </Button>
                </form>
              )}

              <DeleteProfileButton
                profileId={p.id}
                profileName={p.name}
                heirs={heirs}
              />
            </Paper>
          );
        })}
      </Stack>
    </Container>
  );
}
