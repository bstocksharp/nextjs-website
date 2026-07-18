import * as React from "react";
import AppHeader from "@/components/shared/AppHeader";
import EditControl from "@/components/shared/EditControl";

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
          { label: "Today", href: "/workout" },
          { label: "Catalog", href: "/workout/catalog" },
        ]}
        editControl={<EditControl />}
      />
      {children}
    </>
  );
}
