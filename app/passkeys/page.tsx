import Link from "@/components/shared/AppLink";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import { getSession } from "@/lib/session";
import { listPasskeys } from "@/lib/queries/passkeys";
import { deletePasskey } from "@/app/actions/passkeys";
import DeleteIconButton from "@/components/shared/DeleteIconButton";
import AddPasskeyButton from "./AddPasskeyButton";

export const metadata = { title: "Passkeys" };

const fmtDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

// Passkey management for the signed-in ACCOUNT (not profile): add this device's
// Face ID / fingerprint, see what's registered, remove lost devices. The
// password always remains as a fallback, so deleting every passkey just means
// signing in the old way.
export default async function PasskeysPage() {
  const session = await getSession();
  if (session === null) redirect("/login"); // proxy already gates; belt anyway

  const keys = await listPasskeys(session.accountId);

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

      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FingerprintIcon color="primary" />
          <Typography variant="h5" component="h1">
            Passkeys
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          A passkey signs you in with Face ID, Touch ID, or your device PIN — no
          password typed, nothing to phish. Add one per device (an iCloud-synced
          passkey covers all your Apple devices at once). Your password keeps
          working as the fallback.
        </Typography>

        <AddPasskeyButton />

        {keys.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              No passkeys yet — add one on the device you&apos;re holding.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {keys.map((k) => (
              <Paper
                key={k.id}
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={600} noWrap>
                      {k.label ?? "Passkey"}
                    </Typography>
                    {k.backedUp ? (
                      <Chip label="synced" size="small" variant="outlined" />
                    ) : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {k.lastUsedAt
                      ? `Last used ${fmtDate.format(k.lastUsedAt)}`
                      : `Never used · added ${fmtDate.format(k.createdAt)}`}
                  </Typography>
                </Stack>
                <DeleteIconButton
                  action={deletePasskey.bind(null, k.id)}
                  confirmMessage="Remove this passkey? The device it lives on will need the password (or a new passkey) to sign in."
                  label="Remove passkey"
                />
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
