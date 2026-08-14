"use client";

import * as React from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import {
  retagGroupAction,
  upsertNameAction,
  removeNameAction,
  renameGroupAction,
  deleteGroupAction,
} from "@/app/actions/finance-categories";
import type { MerchantGroup, MerchantGroupsView } from "@/lib/queries/finance-categories";

const NEW = "__new__";

// A compact category dropdown; the group's current value is merged into the
// options so a stray category still shows. "New category…" prompts for one.
function CategorySelect({
  value,
  categories,
  disabled,
  label,
  onPick,
}: {
  value: string;
  categories: string[];
  disabled?: boolean;
  label: string;
  onPick: (category: string) => void;
}) {
  const opts = Array.from(new Set([...categories, value].filter(Boolean)));
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value || ""}
      disabled={disabled}
      onChange={(e) => {
        const v = e.target.value;
        if (v === NEW) {
          const name = window.prompt("New category name?")?.trim();
          if (name) onPick(name);
        } else if (v && v !== value) {
          onPick(v);
        }
      }}
      sx={{ minWidth: 150 }}
    >
      {opts.map((c) => (
        <MenuItem key={c} value={c}>
          {c}
        </MenuItem>
      ))}
      <MenuItem value={NEW}>
        <em>New category…</em>
      </MenuItem>
    </TextField>
  );
}

function GroupCard({
  group,
  categories,
  editable,
  busy,
  run,
}: {
  group: MerchantGroup;
  categories: string[];
  editable: boolean;
  busy: boolean;
  run: (fn: () => Promise<void>) => void;
}) {
  const [addName, setAddName] = React.useState("");
  const [rename, setRename] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  const shown = showAll ? group.merchants : group.merchants.slice(0, 12);

  return (
    <Accordion variant="outlined" disableGutters sx={{ "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ flexWrap: "wrap", rowGap: 0.5, pr: 1, width: "100%" }}
        >
          <Typography fontWeight={600}>{group.name}</Typography>
          <Chip size="small" label={group.category} sx={{ bgcolor: "action.selected" }} />
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {group.txns} txns · {group.names.length} name{group.names.length === 1 ? "" : "s"}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {editable ? (
            <CategorySelect
              label="Category"
              value={group.category}
              categories={categories}
              disabled={busy}
              onPick={(cat) => run(() => retagGroupAction(group.name, cat))}
            />
          ) : null}

          {/* Match-names */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}
            >
              Match names
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75, mt: 0.75 }}>
              {group.names.map((n) => (
                <Chip
                  key={n.ruleId}
                  size="small"
                  variant="outlined"
                  label={n.pattern}
                  onDelete={
                    editable && group.names.length > 1
                      ? () => run(() => removeNameAction(n.ruleId))
                      : undefined
                  }
                />
              ))}
            </Stack>
            {editable ? (
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add a name (e.g. WAL-MART)"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  disabled={busy || !addName.trim()}
                  onClick={() => {
                    const p = addName.trim();
                    setAddName("");
                    run(() => upsertNameAction(group.name, group.category, p));
                  }}
                >
                  Add
                </Button>
              </Stack>
            ) : null}
          </Box>

          {/* Merchants caught */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}
            >
              Merchants ({group.merchants.length})
            </Typography>
            <Stack spacing={0.25} sx={{ mt: 0.75 }}>
              {shown.map((m) => (
                <Stack key={m.merchant} direction="row" justifyContent="space-between" spacing={2}>
                  <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                    {m.merchant}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {m.count}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            {group.merchants.length > 12 ? (
              <Button size="small" color="inherit" onClick={() => setShowAll((s) => !s)}>
                {showAll ? "Show less" : `Show all ${group.merchants.length}`}
              </Button>
            ) : null}
          </Box>

          {editable ? (
            <>
              <Divider />
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Rename group / merge into…"
                  value={rename}
                  onChange={(e) => setRename(e.target.value)}
                  sx={{ flexGrow: 1, minWidth: 200 }}
                />
                <Button
                  size="small"
                  disabled={busy || !rename.trim()}
                  onClick={() => {
                    const nn = rename.trim();
                    setRename("");
                    run(() => renameGroupAction(group.name, nn));
                  }}
                >
                  Rename
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton
                  size="small"
                  color="error"
                  disabled={busy}
                  aria-label={`Delete group ${group.name}`}
                  onClick={() => {
                    if (window.confirm(`Delete the "${group.name}" group? Its transactions keep their category.`)) {
                      run(() => deleteGroupAction(group.name));
                    }
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Renaming to an existing group merges them.
              </Typography>
            </>
          ) : null}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default function MerchantGroups({
  view,
  editable,
}: {
  view: MerchantGroupsView;
  editable: boolean;
}) {
  const [isPending, startTransition] = React.useTransition();
  const run = (fn: () => Promise<void>) => startTransition(() => void fn());

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        A <strong>group</strong> is a name, a category, and the merchant
        &ldquo;names&rdquo; that fall into it. Retagging a group re-tags every
        transaction it catches; the longest name always wins, so a specific
        override beats a broad group.
      </Typography>

      {view.groups.map((g) => (
        <GroupCard
          key={g.name}
          group={g}
          categories={view.categories}
          editable={editable}
          busy={isPending}
          run={run}
        />
      ))}

      {view.ungrouped.length > 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Ungrouped merchants
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Not caught by any group yet. Assign a category to start a group for each.
          </Typography>
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            {view.ungrouped.slice(0, 40).map((m) => (
              <Stack
                key={m.merchant}
                direction="row"
                spacing={1.5}
                alignItems="center"
                justifyContent="space-between"
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                    {m.merchant}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {m.count} txns
                  </Typography>
                </Box>
                {editable ? (
                  <CategorySelect
                    label="Assign"
                    value=""
                    categories={view.categories}
                    disabled={isPending}
                    onPick={(cat) => run(() => upsertNameAction(m.merchant, cat, m.merchant))}
                  />
                ) : null}
              </Stack>
            ))}
          </Stack>
          {view.ungrouped.length > 40 ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
              +{view.ungrouped.length - 40} more — tag the rest from the Transactions tab.
            </Typography>
          ) : null}
        </Paper>
      ) : null}
    </Stack>
  );
}
