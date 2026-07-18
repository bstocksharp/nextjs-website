import Link from "next/link";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { isEditor } from "@/lib/auth";
import { lockAction } from "@/app/actions/auth";

// Server component: renders the lock/unlock control based on the editor cookie.
// Passed into the (client) AppHeader as a prop. Who's active is a separate
// control (ProfileControl); this is purely the edit-mode lock — an open padlock
// means editing is unlocked, a closed one means read-only.
export default async function EditControl() {
  const editor = await isEditor();

  if (editor) {
    return (
      <form action={lockAction}>
        <Tooltip title="Lock editing">
          <IconButton
            type="submit"
            size="small"
            color="inherit"
            aria-label="Lock editing"
          >
            <LockOpenOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </form>
    );
  }

  return (
    <Tooltip title="Unlock editing">
      <IconButton
        component={Link}
        href="/unlock"
        size="small"
        color="inherit"
        aria-label="Unlock editing"
      >
        <LockOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
