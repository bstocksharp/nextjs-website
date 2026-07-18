"use client";

import * as React from "react";
import Link from "next/link";
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
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CheckIcon from "@mui/icons-material/Check";
import SubmitButton from "./SubmitButton";
import { switchProfile, addPerson } from "@/app/actions/profile";

export type ProfilePick = { id: number; name: string; color: string | null };

// A few pleasant accents to pick from when adding a person.
const SWATCHES = [
  "#e0864f",
  "#4caf7d",
  "#5b8def",
  "#c65b7c",
  "#9b6bd6",
  "#d9a441",
];

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
  const [color, setColor] = React.useState(SWATCHES[0]);
  const [, startTransition] = React.useTransition();

  const closeMenu = () => setAnchor(null);

  function choose(id: number) {
    closeMenu();
    if (id !== active?.id) startTransition(() => switchProfile(id));
  }

  function openAdd() {
    closeMenu();
    setColor(SWATCHES[0]);
    setAddOpen(true);
  }

  // No profiles yet: offer to create the first one (editors only).
  if (!active) {
    if (!canEdit) return null;
    return (
      <>
        <Button
          color="inherit"
          size="small"
          startIcon={<PersonAddAlt1Icon />}
          onClick={openAdd}
          sx={{ textTransform: "none" }}
        >
          Add person
        </Button>
        <AddPersonDialog
          open={addOpen}
          color={color}
          setColor={setColor}
          onClose={() => setAddOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <Button
        color="inherit"
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label={`Active profile: ${active.name}. Switch profile`}
        sx={{ textTransform: "none", minWidth: 0, gap: 0.75, px: 1 }}
      >
        <ProfileAvatar profile={active} />
        <Box
          component="span"
          sx={{ display: { xs: "none", sm: "inline" }, fontWeight: 600 }}
        >
          {active.name}
        </Box>
        <KeyboardArrowDownIcon fontSize="small" />
      </Button>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ px: 2, display: "block" }}
        >
          Who&apos;s working out
        </Typography>
        {profiles.map((p) => (
          <MenuItem
            key={p.id}
            selected={p.id === active.id}
            onClick={() => choose(p.id)}
          >
            <ListItemIcon>
              <ProfileAvatar profile={p} size={24} />
            </ListItemIcon>
            <ListItemText>{p.name}</ListItemText>
            {p.id === active.id ? (
              <CheckIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
            ) : null}
          </MenuItem>
        ))}
        {canEdit ? <Divider /> : null}
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
      </Menu>

      <AddPersonDialog
        open={addOpen}
        color={color}
        setColor={setColor}
        onClose={() => setAddOpen(false)}
      />
    </>
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
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Color
              </Typography>
              <input type="hidden" name="color" value={color} />
              <Stack direction="row" spacing={1}>
                {SWATCHES.map((c) => (
                  <Box
                    key={c}
                    role="radio"
                    aria-label={`Color ${c}`}
                    aria-checked={c === color}
                    onClick={() => setColor(c)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: c,
                      cursor: "pointer",
                      outline: c === color ? "2px solid" : "none",
                      outlineColor: "text.primary",
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </Stack>
            </Box>
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
