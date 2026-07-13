import Link from "next/link";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { formatMiles } from "@/lib/format";
import type { Vehicle } from "@/lib/db/schema";

const STATUS_COLOR: Record<
  string,
  "primary" | "secondary" | "default" | "warning"
> = {
  owned: "primary",
  dream: "secondary",
  prospect: "warning",
  sold: "default",
};

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const subtitle = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");

  return (
    <Card variant="outlined">
      <CardActionArea component={Link} href={`/garage/${vehicle.id}`}>
        <CardContent>
          <Stack spacing={1}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              spacing={1}
            >
              <Typography variant="h6" component="h2">
                {vehicle.name}
              </Typography>
              <Chip
                label={vehicle.status}
                size="small"
                color={STATUS_COLOR[vehicle.status] ?? "default"}
                variant="outlined"
                sx={{ textTransform: "capitalize" }}
              />
            </Stack>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
            <Typography variant="body2" color="text.secondary">
              {formatMiles(vehicle.currentMileage)}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
