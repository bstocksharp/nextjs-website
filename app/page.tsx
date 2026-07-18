import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import ColorModeToggle from "@/components/shared/ColorModeToggle";
import { APPS } from "@/lib/apps";

export const metadata = { title: "Bryce" };

// The Hub: a launcher for all the sub-apps (from the registry in lib/apps.tsx).
export default function HubPage() {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
        <ColorModeToggle />
      </Box>
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 6 } }}>
        <Stack spacing={1} sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1">
            Bryce
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" fontWeight={400}>
            Your apps
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          {APPS.map((a) => {
            const Icon = a.Icon;
            return (
              <Card key={a.slug} variant="outlined">
                <CardActionArea component={Link} href={a.href} sx={{ height: "100%" }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Icon fontSize="large" sx={{ color: a.accent }} />
                      <Typography variant="h5" component="h2">
                        {a.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {a.tagline}
                      </Typography>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
