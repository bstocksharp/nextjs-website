import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import { formatMiles, formatMoney, formatDate } from "@/lib/format";
import type { Vehicle } from "@/lib/db/schema";

export default function VehicleOverview({ vehicle }: { vehicle: Vehicle }) {
  const facts: [string, string][] = [
    ["Status", vehicle.status],
    ["Current mileage", formatMiles(vehicle.currentMileage)],
    ["Transmission", vehicle.transmission ?? "—"],
    ["Exterior", vehicle.color ?? "—"],
    ["Interior", vehicle.interiorColor ?? "—"],
    ["VIN", vehicle.vin ?? "—"],
    ["Plate", vehicle.licensePlate ?? "—"],
    ["Purchased", formatDate(vehicle.purchaseDate)],
    ["Purchase price", formatMoney(vehicle.purchasePrice)],
    ["Purchase mileage", formatMiles(vehicle.purchaseMileage)],
  ];

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 } }}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
        }}
      >
        {facts.map(([label, value]) => (
          <Box key={label}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
            >
              {label}
            </Typography>
            <Typography
              variant="body1"
              sx={{ textTransform: label === "Status" ? "capitalize" : "none" }}
            >
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
      {vehicle.notes ? (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "pre-wrap" }}
          >
            {vehicle.notes}
          </Typography>
        </>
      ) : null}
    </Paper>
  );
}
