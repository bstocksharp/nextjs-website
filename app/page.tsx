import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import AddIcon from "@mui/icons-material/Add";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import { listVehicles } from "@/lib/queries/vehicles";
import { isEditor } from "@/lib/auth";
import VehicleCard from "@/components/VehicleCard";

export default async function HomePage() {
  const [vehicles, editor] = await Promise.all([listVehicles(), isEditor()]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            The Garage
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}
          </Typography>
        </Box>
        {editor ? (
          <Button
            component={Link}
            href="/garage/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add vehicle
          </Button>
        ) : null}
      </Stack>

      {vehicles.length === 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 4, md: 6 }, textAlign: "center" }}>
          <DirectionsCarIcon
            sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
          />
          <Typography variant="h6" gutterBottom>
            No vehicles yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {editor
              ? "Add your first vehicle to start tracking maintenance, fuel, and the build."
              : "Unlock editing to add a vehicle."}
          </Typography>
          {editor ? (
            <Button
              component={Link}
              href="/garage/new"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Add vehicle
            </Button>
          ) : (
            <Button component={Link} href="/unlock" variant="outlined">
              Unlock editing
            </Button>
          )}
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(3, 1fr)",
            },
          }}
        >
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </Box>
      )}
    </Container>
  );
}
