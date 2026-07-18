import * as React from "react";
import AppHeader from "@/components/shared/AppHeader";
import EditControl from "@/components/shared/EditControl";
import ProfileControl from "@/components/shared/ProfileControl";

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
        profileControl={<ProfileControl />}
        editControl={<EditControl />}
      />
      {children}
    </>
  );
}
