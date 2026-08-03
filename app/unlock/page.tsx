import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SubmitButton from "@/components/shared/SubmitButton";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import { isEditor } from "@/lib/auth";
import { unlockScreenAction } from "@/app/actions/auth";

// Edit-gated pages redirect here when the device is in view mode. Since Phase D
// there's no password — editing is a one-click toggle (claimed profiles are
// protected by their claim, not by a password; see lib/auth).
export default async function UnlockPage() {
  // Already editing? Nothing to do here.
  if (await isEditor()) redirect("/garage");

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <form action={unlockScreenAction}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <LockOpenOutlinedIcon color="primary" />
              <Typography variant="h5" component="h1">
                You&apos;re in view mode
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Editing starts off so nothing changes by accident while browsing.
              Turn it on to add or change things — profiles claimed by another
              account stay hands-off either way.
            </Typography>
            <SubmitButton variant="contained" size="large" pendingLabel="Turning on…">
              Enter edit mode
            </SubmitButton>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
