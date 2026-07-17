import Link from "next/link";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

export const metadata = { title: "Buying guide — The Miata Bible" };

const INSPECTION: { category: string; items: string[]; note?: string }[] = [
  {
    category: "Rust — the #1 killer",
    items: [
      "Rocker panels",
      "Rear wheel arches",
      "Front & rear frame rails",
      "Trunk floor",
      "Under the battery tray",
      "Floor pans",
    ],
    note: "Surface rust is fine. Structural rust in the frame rails is a walk-away.",
  },
  {
    category: "Soft top",
    items: [
      "Tears in the fabric",
      "Rear window clarity / cracks",
      "Leaks or water stains inside",
      "Zipper condition (older tops)",
    ],
    note: "Replacement runs ~$500–1,200 depending on quality.",
  },
  {
    category: "Engine (do a cold start)",
    items: [
      "Rod knock — bad",
      "Light lifter tick — usually normal",
      "Blue or white smoke",
      "Oil & coolant leaks",
      "Steady idle",
    ],
  },
  {
    category: "Cooling system",
    items: [
      "Radiator end tanks still black (brown = old/original)",
      "Hoses feel soft, not crunchy",
    ],
  },
  {
    category: "Timing belt",
    items: [
      "Ask when it was last done",
      "NA Miata is non-interference — if the belt snaps the engine usually survives",
      "If history is unknown, budget to replace it",
    ],
  },
  {
    category: "Clutch",
    items: ["Engages smoothly", "No slipping under load", "No grinding into gear"],
  },
  {
    category: "Transmission",
    items: ["Shifts clean — check 2nd gear especially (older boxes can grind)"],
  },
  {
    category: "Differential",
    items: ["Listen for whining", "Check for leaks"],
  },
  {
    category: "Body & VIN",
    items: [
      "VIN matches the title",
      "Mismatched paint or overspray",
      "Uneven panel gaps (accident sign)",
    ],
  },
  {
    category: "Interior & electrics",
    items: [
      "Cracked dash",
      "Seat tears",
      "Windows work",
      "Both pop-up headlights work",
      "A/C blows cold",
    ],
  },
];

const SELLER_QUESTIONS = [
  "Do you have maintenance records?",
  "When were the timing belt & water pump done?",
  "Has the radiator been replaced?",
  "Has the clutch been replaced?",
  "Any accidents?",
  "Any paint or body work?",
  "Any rust repair?",
  "Was it garage kept?",
  "Ever driven in winter / salt?",
  "Clean title in hand?",
  "Do the original parts come with it?",
];

export default function BuyingGuidePage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Button
        component={Link}
        href="/bible"
        size="small"
        color="inherit"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        The Bible
      </Button>

      <Typography variant="h3" component="h1" gutterBottom>
        Buying guide
      </Typography>
      <Typography variant="h6" component="p" color="text.secondary" fontWeight={400}>
        Your goal isn&apos;t to find a perfect Miata — it&apos;s to find one
        someone else didn&apos;t ruin. A clean, stock, maintained 170k-mile car
        beats a 90k-mile eBay-turbo with cut springs every time.
      </Typography>

      <Alert severity="warning" sx={{ my: 3 }}>
        The single biggest deal-breaker is <strong>structural rust</strong>. Bring
        a flashlight and check the frame rails and floor pans first.
      </Alert>

      <Stack spacing={2}>
        {INSPECTION.map((group) => (
          <Paper key={group.category} variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              {group.category}
            </Typography>
            <List dense disablePadding>
              {group.items.map((item) => (
                <ListItem key={item} disableGutters sx={{ py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckBoxOutlineBlankIcon fontSize="small" color="disabled" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
            {group.note ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, fontStyle: "italic" }}
              >
                {group.note}
              </Typography>
            ) : null}
          </Paper>
        ))}
      </Stack>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h4" component="h2" gutterBottom>
        Questions to ask the seller
      </Typography>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
        <List dense disablePadding>
          {SELLER_QUESTIONS.map((q) => (
            <ListItem key={q} disableGutters sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <HelpOutlineIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary={q} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}
