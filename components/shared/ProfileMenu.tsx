"use client";

import * as React from "react";
import Link from "next/link";
import { useColorScheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import CheckIcon from "@mui/icons-material/Check";
import SubmitButton from "./SubmitButton";
import ColorSwatches, { PROFILE_SWATCHES } from "./ColorSwatches";
import { switchProfile, addPerson } from "@/app/actions/profile";
import { lockAction, unlockInlineAction } from "@/app/actions/auth";

export type ProfilePick = { id: number; name: string; color: string | null };

/** "Bryce" → "B", "Bryce Stock" → "BS". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ProfileAvatar({
  profile,
  size = 26,
}: {
  profile: ProfilePick;
  size?: number;
}) {
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.48,
        fontWeight: 700,
        bgcolor: profile.color ?? "primary.main",
        color: "#fff",
      }}
    >
      {initials(profile.name)}
    </Avatar>
  );
}

// The account menu for the whole hub: who you are (switch/add/manage people),
// plus the two app-wide settings that used to be separate top-bar icons — the
// light/dark toggle and the editing lock. The trigger always renders, so those
// settings stay reachable even before any profile exists.
export default function ProfileMenu({
  active,
  profiles,
  canEdit,
}: {
  active: ProfilePick | null;
  profiles: ProfilePick[];
  canEdit: boolean;
}) {
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [unlockOpen, setUnlockOpen] = React.useState(false);
  const [color, setColor] = React.useState(PROFILE_SWATCHES[0]);
  const [, startTransition] = React.useTransition();

  // Color mode. useColorScheme() is undefined until mounted, so guard the toggle.
  const { mode, systemMode, setMode } = useColorScheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = (mode === "system" ? systemMode : mode) === "dark";

  const closeMenu = () => setAnchor(null);

  function choose(id: number) {
    closeMenu();
    if (id !== active?.id) startTransition(() => switchProfile(id));
  }

  function openAdd() {
    closeMenu();
    setColor(PROFILE_SWATCHES[0]);
    setAddOpen(true);
  }

  function openUnlock() {
    closeMenu();
    setUnlockOpen(true);
  }

  function lock() {
    closeMenu();
    startTransition(() => lockAction());
  }

  // Whether the "who you are" section renders anything above the settings —
  // used so we don't emit a leading divider when that section is empty.
  const hasProfileSection = profiles.length > 0 || canEdit;

  return (
    <>
      <Button
        color="inherit"
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label={active ? `${active.name} — open account menu` : "Open account menu"}
        sx={{ textTransform: "none", minWidth: 0, gap: 0.75, px: 1 }}
      >
        {active ? (
          <>
            <ProfileAvatar profile={active} />
            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline" }, fontWeight: 600 }}
            >
              {active.name}
            </Box>
          </>
        ) : (
          <PersonOutlineIcon />
        )}
        <KeyboardArrowDownIcon fontSize="small" />
      </Button>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu}>
        {profiles.length > 0 ? (
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ px: 2, display: "block" }}
          >
            Switch profile
          </Typography>
        ) : null}
        {profiles.map((p) => (
          <MenuItem
            key={p.id}
            selected={p.id === active?.id}
            onClick={() => choose(p.id)}
          >
            <ListItemIcon>
              <ProfileAvatar profile={p} size={24} />
            </ListItemIcon>
            <ListItemText>{p.name}</ListItemText>
            {p.id === active?.id ? (
              <CheckIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
            ) : null}
          </MenuItem>
        ))}
        {canEdit ? (
          <MenuItem onClick={openAdd}>
            <ListItemIcon>
              <PersonAddAlt1Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add person…</ListItemText>
          </MenuItem>
        ) : null}
        {canEdit ? (
          <MenuItem component={Link} href="/people" onClick={closeMenu}>
            <ListItemIcon>
              <ManageAccountsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manage people…</ListItemText>
          </MenuItem>
        ) : null}

        {hasProfileSection ? <Divider /> : null}

        {/* App-wide settings: appearance + the editing lock. */}
        <MenuItem
          onClick={() => setMode(isDark ? "light" : "dark")}
          disabled={!mounted}
        >
          <ListItemIcon>
            {isDark ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>{isDark ? "Light mode" : "Dark mode"}</ListItemText>
        </MenuItem>

        {canEdit ? (
          <MenuItem onClick={lock}>
            <ListItemIcon>
              <LockOpenOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Lock editing</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={openUnlock}>
            <ListItemIcon>
              <LockOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Unlock editing…</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <AddPersonDialog
        open={addOpen}
        color={color}
        setColor={setColor}
        onClose={() => setAddOpen(false)}
      />

      {/* Mounted only while open so useActionState resets fresh each time. */}
      {unlockOpen ? <UnlockDialog onClose={() => setUnlockOpen(false)} /> : null}
    </>
  );
}

function UnlockDialog({ onClose }: { onClose: () => void }) {
  const [state, formAction] = React.useActionState(unlockInlineAction, null);

  // On success the cookie's set and the page revalidated — just close.
  React.useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form action={formAction}>
        <DialogTitle>Unlock editing</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the edit password to add or change entries. Viewing stays
              open to everyone.
            </Typography>
            {state && !state.ok ? (
              <Alert severity="error">{state.error}</Alert>
            ) : null}
            <TextField
              name="password"
              type="password"
              label="Password"
              autoFocus
              required
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <SubmitButton variant="contained" pendingLabel="Unlocking…">
            Unlock
          </SubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function AddPersonDialog({
  open,
  color,
  setColor,
  onClose,
}: {
  open: boolean;
  color: string;
  setColor: (c: string) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form
        action={async (fd) => {
          await addPerson(fd);
          onClose();
        }}
      >
        <DialogTitle>Add a person</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField
              name="name"
              label="Name"
              required
              fullWidth
              autoFocus
              placeholder="e.g. Bryce"
            />
            <input type="hidden" name="color" value={color} />
            <ColorSwatches value={color} onChange={setColor} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <SubmitButton variant="contained" pendingLabel="Adding…">
            Add person
          </SubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
