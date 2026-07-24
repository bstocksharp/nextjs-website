import Link from "@/components/shared/AppLink";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { isEditor, canEditProfile } from "@/lib/auth";
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
  // Per row: can the current (active) person actually manage this profile? A
  // password-protected profile that isn't the active one shows a lock instead of
  // the manage button — you can't edit it from another profile.
  const canManage = await Promise.all(all.map((p) => canEditProfile(p.id)));

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
        {all.map((p, i) => {
          const archived = !!p.archivedAt;
          // Archived rows still show manage so they can be reactivated (that
          // action is open to any editor); otherwise gate on canManage.
          const manageable = canManage[i] || archived;
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

              {manageable ? (
                <EditProfileButton
                  profileId={p.id}
                  profileName={p.name}
                  profileColor={p.color}
                  profileHiddenApps={p.hiddenApps}
                  profileEquipment={p.equipment}
                  profileHasPassword={!!p.editPasswordHash}
                  archived={archived}
                  canDeactivate={canDeactivate}
                  heirs={heirs}
                />
              ) : (
                <Tooltip title={`Password-locked — switch to ${p.name} and unlock to manage`}>
                  <span>
                    <IconButton size="small" disabled aria-label={`${p.name} is locked`}>
                      <LockOutlinedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Container>
  );
}
