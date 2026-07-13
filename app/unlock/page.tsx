import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import SubmitButton from "@/components/SubmitButton";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { isEditor } from "@/lib/auth";
import { unlockAction } from "@/app/actions/auth";

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Already unlocked? Nothing to do here.
  if (await isEditor()) redirect("/");

  const { error } = await searchParams;

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <form action={unlockAction}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <LockOutlinedIcon color="primary" />
              <Typography variant="h5" component="h1">
                Editor unlock
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Enter the edit password to add or change entries. Viewing stays
              open to everyone.
            </Typography>
            {error ? <Alert severity="error">Incorrect password.</Alert> : null}
            <TextField
              name="password"
              type="password"
              label="Password"
              autoFocus
              required
              fullWidth
            />
            <SubmitButton variant="contained" size="large" pendingLabel="Unlocking…">
              Unlock
            </SubmitButton>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
