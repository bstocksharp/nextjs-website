import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

// Skeleton that roughly mirrors the vehicle detail layout while it loads.
export default function Loading() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Skeleton width={90} height={32} />
      <Skeleton variant="text" width="55%" height={52} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="35%" height={28} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3, mb: 3 }} />
      <Skeleton variant="rounded" height={72} sx={{ borderRadius: 3 }} />
    </Container>
  );
}
