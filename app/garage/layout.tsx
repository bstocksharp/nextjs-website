import * as React from "react";
import AppShell from "@/components/shared/AppShell";

export default function GarageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell current="garage">{children}</AppShell>;
}
