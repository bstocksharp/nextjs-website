"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { deleteProfileForever } from "@/app/actions/profile";

// The scary one. Shared cars + workouts move to the chosen heir; the person's
// private cars (and history) and weekly schedule are deleted. Irreversible.
export default function DeleteProfileButton({
  profileId,
  profileName,
  heirs,
  onDeleted,
}: {
  profileId: number;
  profileName: string;
  heirs: { id: number; name: string }[];
  onDeleted?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [heirId, setHeirId] = React.useState(heirs[0]?.id ?? 0);
  const [pending, startTransition] = React.useTransition();

  const noHeir = heirs.length === 0;

  const button = (
    <Box component="span">
      <Button
        color="error"
        size="small"
        startIcon={<DeleteForeverIcon />}
        disabled={noHeir}
        onClick={() => setOpen(true)}
      >
        Delete…
      </Button>
    </Box>
  );

  return (
    <>
      {noHeir ? (
        <Tooltip title="Add another active person first — someone has to inherit the shared cars & workouts.">
          {button}
        </Tooltip>
      ) : (
        button
      )}

      <Dialog
        open={open}
        onClose={() => (pending ? null : setOpen(false))}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete {profileName} forever?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Alert severity="warning">
              This can&apos;t be undone. {profileName}&apos;s <b>private cars</b>{" "}
              (and their history) and <b>weekly schedule</b> will be deleted.
            </Alert>
            <TextField
              select
              name="heirId"
              label="Move shared cars & workouts to"
              value={heirId}
              onChange={(e) => setHeirId(Number(e.target.value))}
              fullWidth
              slotProps={{ select: { native: true } }}
            >
              {heirs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={pending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={pending || !heirId}
            onClick={() =>
              startTransition(async () => {
                await deleteProfileForever(profileId, heirId);
                setOpen(false);
                onDeleted?.();
              })
            }
          >
            {pending ? "Deleting…" : "Delete forever"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
