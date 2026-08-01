import * as React from "react";
import AppShell from "@/components/shared/AppShell";

export default function WeightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell current="weight">{children}</AppShell>;
}
