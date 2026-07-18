import * as React from "react";
import AppShell from "@/components/shared/AppShell";

export default function WorkoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell current="workout">{children}</AppShell>;
}
