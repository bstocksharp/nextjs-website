"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import SubmitButton from "./SubmitButton";
import ColorSwatches, { PROFILE_SWATCHES } from "./ColorSwatches";
import { addPerson } from "@/app/actions/profile";

// "Add person" on the /group page (moved out of the profile menu — the group
// page is the one place for household management). Creates a PROFILE (a person
// to track), not a login; new people start open to the whole household.
export default function AddPersonButton() {
  const [open, setOpen] = React.useState(false);
  const [color, setColor] = React.useState(PROFILE_SWATCHES[0]);

  function openDialog() {
    setColor(PROFILE_SWATCHES[0]);
    setOpen(true);
  }
  const close = () => setOpen(false);

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<PersonAddAlt1Icon />}
        onClick={openDialog}
      >
        Add person
      </Button>

      <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
        <form
          action={async (fd) => {
            await addPerson(fd);
            close();
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
              <Typography variant="caption" color="text.secondary">
                New people start open to the whole household. If they get their
                own login later, claiming themselves here makes their stuff
                theirs alone.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={close} color="inherit">
              Cancel
            </Button>
            <SubmitButton variant="contained" pendingLabel="Adding…">
              Add person
            </SubmitButton>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
