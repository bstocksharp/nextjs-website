"use client";

import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// A one-shot success toast, shown when a page is reached after a save
// (e.g. /workout/[id]?saved=1). Auto-hides.
export default function SavedToast({ message }: { message: string }) {
  const [open, setOpen] = React.useState(true);
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        severity="success"
        variant="filled"
        onClose={() => setOpen(false)}
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
