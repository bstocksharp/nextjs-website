import { redirect } from "next/navigation";

// People management moved into the group page (one place for the household:
// people, logins, claims). Kept as a redirect so old links keep working.
export default function PeoplePage() {
  redirect("/group");
}
