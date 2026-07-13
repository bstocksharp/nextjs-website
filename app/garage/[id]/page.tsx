import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getVehicle } from "@/lib/queries/vehicles";
import { isEditor } from "@/lib/auth";
import { deleteVehicle } from "@/app/actions/vehicles";
import DeleteVehicleButton from "@/components/DeleteVehicleButton";
import VehicleTabs from "@/components/VehicleTabs";
import VehicleOverview from "@/components/VehicleOverview";
import MaintenanceSection from "@/components/MaintenanceSection";
import FuelSection from "@/components/FuelSection";
import PartsSection from "@/components/PartsSection";
import BuildSection from "@/components/BuildSection";
import WishlistSection from "@/components/WishlistSection";

export default async function VehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const { tab } = await searchParams;
  const active =
    tab === "maintenance" ||
    tab === "fuel" ||
    tab === "parts" ||
    tab === "build" ||
    tab === "wishlist"
      ? tab
      : "overview";

  const [vehicle, editor] = await Promise.all([getVehicle(id), isEditor()]);
  if (!vehicle) notFound();

  const subtitle = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(" ");

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

      <VehicleTabs vehicleId={id} active={active} />

      {active === "maintenance" ? (
        <MaintenanceSection vehicleId={id} editor={editor} />
      ) : active === "fuel" ? (
        <FuelSection vehicleId={id} editor={editor} />
      ) : active === "parts" ? (
        <PartsSection vehicleId={id} editor={editor} />
      ) : active === "build" ? (
        <BuildSection vehicleId={id} editor={editor} />
      ) : active === "wishlist" ? (
        <WishlistSection vehicleId={id} editor={editor} />
      ) : (
        <VehicleOverview vehicle={vehicle} />
      )}
    </Container>
  );
}
