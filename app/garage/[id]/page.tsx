import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getVehicle } from "@/lib/queries/vehicles";
import { isEditor } from "@/lib/auth";
import { deleteVehicle } from "@/app/actions/vehicles";
import { formatMiles, formatMoney, formatDate } from "@/lib/format";
import DeleteVehicleButton from "@/components/DeleteVehicleButton";

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const [vehicle, editor] = await Promise.all([getVehicle(id), isEditor()]);
  if (!vehicle) notFound();

  const subtitle = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(" ");

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
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Button
        component={Link}
        href="/"
        size="small"
        color="inherit"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Garage
      </Button>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        sx={{ mb: editor ? 2 : 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            {vehicle.name}
          </Typography>
          {subtitle ? (
            <Typography variant="subtitle1" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <Chip
          label={vehicle.status}
          color="primary"
          variant="outlined"
          sx={{ textTransform: "capitalize" }}
        />
      </Stack>

      {editor ? (
        <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
          <Button
            component={Link}
            href={`/garage/${vehicle.id}/edit`}
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
          >
            Edit
          </Button>
          <DeleteVehicleButton
            action={deleteVehicle.bind(null, vehicle.id)}
            name={vehicle.name}
          />
        </Stack>
      ) : null}

      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
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

      <Paper
        variant="outlined"
        sx={{ p: 3, textAlign: "center", color: "text.secondary" }}
      >
        <Typography variant="body2">
          Maintenance log, fuel &amp; MPG, parts, and the build plan arrive in the
          next phases.
        </Typography>
      </Paper>
    </Container>
  );
}
