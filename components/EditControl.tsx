import Link from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { isEditor } from "@/lib/auth";
import { lockAction } from "@/app/actions/auth";

// Server component: renders the lock/unlock control based on the editor cookie.
// Passed into the (client) SiteHeader as a prop.
export default async function EditControl() {
  const editor = await isEditor();

  if (editor) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Chip label="Editing" color="primary" size="small" variant="outlined" />
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
      </Box>
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
