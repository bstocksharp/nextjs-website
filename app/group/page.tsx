import Link from "@/components/shared/AppLink";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyIcon from "@mui/icons-material/Key";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SubmitButton from "@/components/shared/SubmitButton";
import AddPersonButton from "@/components/shared/AddPersonButton";
import EditProfileButton from "@/components/shared/EditProfileButton";
import DeleteIconButton from "@/components/shared/DeleteIconButton";
import GroupNameEditor from "./GroupNameEditor";
import InvitesPanel, { type InviteRow } from "./InvitesPanel";
import DangerZone from "./DangerZone";
import { getSession } from "@/lib/session";
import { isEditor, canEditProfile } from "@/lib/auth";
import { getMyGroup, listGroupMembers } from "@/lib/queries/groups";
import { listPendingInvites } from "@/lib/queries/invites";
import { listAllProfiles } from "@/lib/queries/profiles";
import { getActiveProfile } from "@/lib/profile";
import {
  claimProfileAction,
  releaseClaimAction,
  removeMemberAction,
} from "@/app/actions/group";

export const metadata = { title: "Group" };

function initial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? "?";
}

// The household's control room — ONE page for people AND logins (/people
// redirects here). People are profiles you track & switch between; logins are
// keys to the door; a claim ties a login to a person ("this login is me"),
// which is the whole protection model since Phase D. Claiming is self-service;
// people management (add/edit/rename) needs edit mode. Invites, removing
// members, and a group owner (groups.ownerAccountId) are Phase E — until then
// logins come from scripts/create-account.mjs (--join <id> for this group).
export default async function GroupPage() {
  const session = await getSession();
  if (!session) redirect("/login"); // proxy already gates; belt anyway

  const [group, members, all, active, canEdit] = await Promise.all([
    getMyGroup(),
    listGroupMembers(),
    listAllProfiles(),
    getActiveProfile(),
    isEditor(),
  ]);
  const canManage = await Promise.all(all.map((p) => canEditProfile(p.id)));

  // Membership controls (invites + removal) are the OWNER's, behind edit mode
  // like every other write. Invite links need an absolute URL — derive the
  // origin from Host headers (same idiom as lib/webauthn), never an env var.
  const viewerIsOwner =
    group?.ownerAccountId != null && group.ownerAccountId === session.accountId;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const origin = `${proto}://${host}`;
  let inviteRows: InviteRow[] = [];
  if (viewerIsOwner && canEdit) {
    inviteRows = (await listPendingInvites()).map((inv) => ({
      id: inv.id,
      link: `${origin}/join/${inv.token}`,
      note: inv.note,
      household: inv.groupId !== null,
      reusable: inv.maxUses === null,
      expiresInDays: Math.max(
        0,
        Math.floor((inv.expiresAt.getTime() - Date.now()) / 86_400_000),
      ),
    }));
  }

  const activeProfiles = all.filter((p) => !p.archivedAt);
  const canDeactivate = activeProfiles.length > 1;
  const profileName = (id: number | null) =>
    all.find((p) => p.id === id)?.name ?? null;
  const claimOf = (profileId: number) =>
    members.find((m) => m.profileId === profileId) ?? null;
  const me = members.find((m) => m.id === session.accountId);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
      <Button
        component={Link}
        href="/"
        startIcon={<ArrowBackIcon />}
        color="inherit"
        sx={{ mb: 2 }}
      >
        Back to hub
      </Button>

      <Stack spacing={2.5}>
        <GroupNameEditor name={group?.name ?? "Group"} canEdit={canEdit} />

        <Typography variant="body2" color="text.secondary">
          Everyone here shares this hub&apos;s data. <strong>People</strong> are
          the profiles you switch between; <strong>logins</strong> open the
          door. Claiming a person means &ldquo;this login is me&rdquo; — signing
          in jumps straight to them, and only that login can edit their stuff.
          Unclaimed people (like a kid) stay open to the whole household.
        </Typography>

        <Divider>
          <Typography variant="overline" color="text.secondary">
            People
          </Typography>
        </Divider>

        <Stack spacing={1.5}>
          {all.map((p, i) => {
            const archived = !!p.archivedAt;
            const claim = claimOf(p.id);
            const mine = claim?.id === session.accountId;
            // Archived rows stay manageable in edit mode so they can be
            // reactivated; live rows need canEditProfile (unclaimed or yours).
            const manageable = canManage[i] || (archived && canEdit);
            const heirs = activeProfiles
              .filter((x) => x.id !== p.id)
              .map((x) => ({ id: x.id, name: x.name }));

            return (
              <Paper
                key={p.id}
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                  opacity: archived ? 0.7 : 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 15,
                    fontWeight: 700,
                    bgcolor: p.color ?? "primary.main",
                    color: "#fff",
                  }}
                >
                  {initial(p.name)}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography fontWeight={600} component="span">
                    {p.name}
                  </Typography>
                  {active?.id === p.id ? (
                    <Chip size="small" label="Active" color="primary" sx={{ ml: 1 }} />
                  ) : null}
                  {archived ? (
                    <Chip size="small" label="Archived" sx={{ ml: 1 }} />
                  ) : null}
                </Box>

                {archived ? null : mine ? (
                  <>
                    <Chip size="small" label="you" color="primary" />
                    <form action={releaseClaimAction}>
                      <SubmitButton size="small" color="inherit" pendingLabel="…">
                        Release
                      </SubmitButton>
                    </form>
                  </>
                ) : claim ? (
                  <Chip size="small" label={claim.username} icon={<KeyIcon />} />
                ) : (
                  <>
                    <Chip size="small" label="open" variant="outlined" />
                    <form action={claimProfileAction.bind(null, p.id)}>
                      <SubmitButton
                        size="small"
                        variant="outlined"
                        pendingLabel="Claiming…"
                      >
                        {me?.profileId != null ? "Claim instead" : "This is me"}
                      </SubmitButton>
                    </form>
                  </>
                )}

                {manageable ? (
                  <EditProfileButton
                    profileId={p.id}
                    profileName={p.name}
                    profileColor={p.color}
                    profileHiddenApps={p.hiddenApps}
                    archived={archived}
                    canDeactivate={canDeactivate}
                    heirs={heirs}
                  />
                ) : canEdit && claim && !mine ? (
                  <Tooltip title={`Claimed — only ${claim.username} can manage ${p.name}`}>
                    <span>
                      <IconButton size="small" disabled aria-label={`${p.name} is claimed`}>
                        <LockOutlinedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                ) : null}
              </Paper>
            );
          })}

          {canEdit ? (
            <Box>
              <AddPersonButton />
            </Box>
          ) : null}
        </Stack>

        <Divider>
          <Typography variant="overline" color="text.secondary">
            Logins
          </Typography>
        </Divider>

        <Stack spacing={1.5}>
          {members.map((m) => (
            <Paper
              key={m.id}
              variant="outlined"
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <KeyIcon fontSize="small" color="disabled" />
              <Typography
                fontWeight={600}
                sx={{ flexGrow: 1, minWidth: 0 }}
                noWrap
              >
                {m.username}
              </Typography>
              {m.id === group?.ownerAccountId ? (
                <Chip size="small" label="owner" color="secondary" />
              ) : null}
              {m.id === session.accountId ? (
                <Chip size="small" label="you" color="primary" variant="outlined" />
              ) : null}
              <Chip
                size="small"
                label={
                  m.profileId !== null
                    ? `is ${profileName(m.profileId) ?? "?"}`
                    : "no profile claimed"
                }
                variant={m.profileId !== null ? "filled" : "outlined"}
              />
              {viewerIsOwner && canEdit && m.id !== session.accountId ? (
                <DeleteIconButton
                  action={removeMemberAction.bind(null, m.id)}
                  confirmMessage={`Remove the login "${m.username}"? Their person and data stay — only the login (and its passkeys) is deleted, and any claim is released.`}
                  label={`Remove login ${m.username}`}
                />
              ) : null}
            </Paper>
          ))}
        </Stack>

        {viewerIsOwner && canEdit ? (
          <>
            <Divider>
              <Typography variant="overline" color="text.secondary">
                Invites
              </Typography>
            </Divider>
            <InvitesPanel
              origin={origin}
              groupName={group?.name ?? "this hub"}
              invites={inviteRows}
            />
          </>
        ) : null}

        <Typography variant="caption" color="text.secondary">
          New logins join through <strong>invite links</strong>
          {viewerIsOwner
            ? " you mint above (single-use, 7-day expiry unless you say otherwise)"
            : ", minted by the group owner"}
          . A &ldquo;join&rdquo; invite makes them a member of this hub; an
          &ldquo;own hub&rdquo; invite gives them a fresh private one. Removing
          a login never touches the person or their data.
        </Typography>

        {!group?.isDemo ? (
          <DangerZone
            isOwner={viewerIsOwner}
            groupName={group?.name ?? "this hub"}
            others={members
              .filter((m) => m.id !== session.accountId)
              .map((m) => ({ id: m.id, username: m.username }))}
          />
        ) : null}
      </Stack>
    </Container>
  );
}
