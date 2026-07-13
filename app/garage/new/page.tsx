import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { isEditor } from "@/lib/auth";
import { addVehicle } from "@/app/actions/vehicles";
import VehicleForm from "@/components/VehicleForm";

export default async function NewVehiclePage() {
  if (!(await isEditor())) redirect("/unlock");

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Add vehicle
      </Typography>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
        <VehicleForm action={addVehicle} submitLabel="Add vehicle" cancelHref="/" />
      </Paper>
    </Container>
  );
}
