"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

type Props = ButtonProps & { pendingLabel?: string };

// A submit button that shows a spinner and disables itself while the enclosing
// form's Server Action is in flight. Must be rendered *inside* a <form>.
export default function SubmitButton({
  children,
  pendingLabel,
  startIcon,
  disabled,
  ...rest
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      startIcon={
        pending ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          startIcon
        )
      }
      {...rest}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
