import * as React from "react";
import AppShell from "@/components/shared/AppShell";

export default function FinanceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell current="finance">{children}</AppShell>;
}
