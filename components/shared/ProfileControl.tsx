import { listProfiles } from "@/lib/queries/profiles";
import { getActiveProfile } from "@/lib/profile";
import { isEditor } from "@/lib/auth";
import ProfileMenu, { type ProfilePick } from "./ProfileMenu";

// Server component: reads who's active + the roster, then hands a plain,
// serializable slice to the client menu. Passed into AppHeader like EditControl.
export default async function ProfileControl() {
  const [profiles, active, canEdit] = await Promise.all([
    listProfiles(),
    getActiveProfile(),
    isEditor(),
  ]);

  const pick = (p: { id: number; name: string; color: string | null }): ProfilePick => ({
    id: p.id,
    name: p.name,
    color: p.color,
  });

  return (
    <ProfileMenu
      active={active ? pick(active) : null}
      profiles={profiles.map(pick)}
      canEdit={canEdit}
    />
  );
}
