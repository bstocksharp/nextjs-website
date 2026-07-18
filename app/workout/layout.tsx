import * as React from "react";
import AppHeader from "@/components/shared/AppHeader";
import EditControl from "@/components/shared/EditControl";
import ProfileControl from "@/components/shared/ProfileControl";

export default function WorkoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader
        current="workout"
        nav={[
          { label: "Today", href: "/workout/today" },
          { label: "Week", href: "/workout" },
          { label: "Catalog", href: "/workout/catalog" },
        ]}
        profileControl={<ProfileControl />}
        editControl={<EditControl />}
      />
      {children}
    </>
  );
}
