"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import SubmitButton from "@/components/shared/SubmitButton";
import EquipmentPicker from "@/components/workout/EquipmentPicker";
import { setProfileEquipment } from "@/app/actions/profile";

// Editor-only entry point for "what gear do I own." Opens the shared
// EquipmentPicker in a dialog and saves via setProfileEquipment (which sets
// profiles.equipment for the active person). Dropped into the catalog header and
// the builder so you never have to dig through Manage People to set it.
export default function MyEquipmentButton({
  profileId,
  profileName,
  owned,
  size = "medium",
  variant = "outlined",
}: {
  profileId: number;
  profileName: string;
  owned: string[];
  size?: "small" | "medium" | "large";
  variant?: "text" | "outlined" | "contained";
}) {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size={size}
        variant={variant}
        color="inherit"
        startIcon={<FitnessCenterOutlinedIcon />}
      >
        My equipment
      </Button>

      <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
        <form
          action={async (fd) => {
            await setProfileEquipment(profileId, fd);
            close();
          }}
        >
          <DialogTitle>{profileName}&apos;s equipment</DialogTitle>
          <DialogContent>
            <EquipmentPicker
              name="equipment"
              defaultValue={owned}
              label="What you own"
              helperText="The catalog dims (and the builder warns about) moves that need gear you haven't ticked. Leave all unchecked to see everything."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={close} color="inherit">
              Cancel
            </Button>
            <SubmitButton variant="contained" pendingLabel="Saving…">
              Save
            </SubmitButton>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
