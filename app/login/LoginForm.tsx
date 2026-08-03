"use client";

import * as React from "react";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SubmitButton from "@/components/shared/SubmitButton";
import { loginAction } from "@/app/actions/session";

// The global sign-in form. autoComplete hints matter: username/current-password
// is what lets iCloud Keychain (and friends) offer the saved login behind a
// Face ID prompt — the "free tier" of biometric login until real passkeys land.
export default function LoginForm({ from }: { from: string }) {
  const [state, formAction] = React.useActionState(loginAction, null);

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <form action={formAction}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <LockOutlinedIcon color="primary" />
              <Typography variant="h5" component="h1">
                Sign in
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              This hub is private — sign in to continue.
            </Typography>
            {state ? <Alert severity="error">{state.error}</Alert> : null}
            <input type="hidden" name="from" value={from} />
            <TextField
              name="username"
              label="Username"
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
              required
              fullWidth
            />
            <TextField
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              required
              fullWidth
            />
            <SubmitButton variant="contained" size="large" pendingLabel="Signing in…">
              Sign in
            </SubmitButton>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
