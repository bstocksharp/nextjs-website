import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import BuildIcon from "@mui/icons-material/Build";
import MenuBookIcon from "@mui/icons-material/MenuBook";

const sections = [
  {
    icon: <DirectionsCarIcon fontSize="large" color="primary" />,
    title: "The Garage",
    desc: "Every vehicle you own, with maintenance history, fuel & MPG, parts inventory, and running costs.",
    phase: "Phase 3–4",
  },
  {
    icon: <BuildIcon fontSize="large" color="primary" />,
    title: "The Build",
    desc: "The dream NA Miata's phased plan, dream-parts wishlist with a budget, and a build journal.",
    phase: "Phase 5",
  },
  {
    icon: <MenuBookIcon fontSize="large" color="primary" />,
    title: "The Bible",
    desc: "Buying checklist, what to look for, questions for the seller, and the OEM+ reference — all in one place.",
    phase: "Phase 6",
  },
];

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={2} sx={{ mb: 5 }}>
        <Box>
          <Chip
            label="Reliability → Safety → Handling → Power"
            color="secondary"
            variant="outlined"
            size="small"
          />
        </Box>
        <Typography variant="h3" component="h1">
          Bryce&apos;s Garage
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary" fontWeight={400}>
          A maintenance tracker for the daily drivers — and a living build bible for
          the dream NA Miata. Tasteful, OEM+, and definitely not slammed.
        </Typography>
      </Stack>

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
        {sections.map((s) => (
          <Card key={s.title} variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                {s.icon}
                <Typography variant="h5" component="h2">
                  {s.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.desc}
                </Typography>
                <Box>
                  <Chip label={s.phase} size="small" variant="outlined" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 6 }}>
        Scaffolding is live on Next 15 · React 19 · MUI v7. Next up: the database
        layer and password-protected editing.
      </Typography>
    </Container>
  );
}
