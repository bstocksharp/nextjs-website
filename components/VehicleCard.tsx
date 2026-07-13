import Link from "next/link";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { formatMiles } from "@/lib/format";
import VehicleCardMenu from "./VehicleCardMenu";
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

export default function VehicleCard({
  vehicle,
  editor,
}: {
  vehicle: Vehicle;
  editor: boolean;
}) {
  const subtitle = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");

  return (
    <Card variant="outlined" sx={{ position: "relative" }}>
      {editor ? <VehicleCardMenu vehicleId={vehicle.id} /> : null}
      <CardActionArea component={Link} href={`/garage/${vehicle.id}`}>
        <CardContent sx={{ pr: editor ? 5 : 2 }}>
          <Typography variant="h6" component="h2" noWrap>
            {vehicle.name}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" noWrap>
              {subtitle}
            </Typography>
          ) : null}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 1.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              {formatMiles(vehicle.currentMileage)}
            </Typography>
            <Chip
              label={vehicle.status}
              size="small"
              color={STATUS_COLOR[vehicle.status] ?? "default"}
              variant="outlined"
              sx={{ textTransform: "capitalize" }}
            />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
