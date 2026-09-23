"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Chip from "@mui/material/Chip";

// A dismissible "what the list is narrowed to" chip; deleting it drops the
// given URL params (e.g. a tapped tag) and keeps everything else.
export default function ListFilterChip({ label, params }: { label: string; params: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  return (
    <Chip
      size="small"
      color="primary"
      label={label}
      onDelete={() => {
        const p = new URLSearchParams(search.toString());
        for (const k of params) p.delete(k);
        const qs = p.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }}
    />
  );
}
