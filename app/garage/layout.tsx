import * as React from "react";
import AppHeader from "@/components/AppHeader";
import EditControl from "@/components/EditControl";

export default function GarageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader
        current="garage"
        nav={[{ label: "Bible", href: "/garage/bible" }]}
        editControl={<EditControl />}
      />
      {children}
    </>
  );
}
