import Chip, { type ChipProps } from "@mui/material/Chip";

// One pill style used everywhere (targets, rounds, "saved by", categories,
// profile labels) so they're always consistent. Thin wrapper over MUI Chip:
// small + comfortable padding, with a bit of breathing room around any icon.
// All Chip props pass through (color, variant, clickable, component, href, …).
export default function Pill({ sx, ...props }: ChipProps) {
  return (
    <Chip
      size="small"
      variant="outlined"
      {...props}
      sx={{
        height: 26,
        borderRadius: "13px",
        "& .MuiChip-icon": { ml: 1, mr: -0.25, fontSize: 16 },
        "& .MuiChip-label": { px: 1.25 },
        ...sx,
      }}
    />
  );
}
