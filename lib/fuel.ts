// Pure MPG math (no DB / no "server-only"), so it can be unit-tested and used
// anywhere. Uses the tank method: between two full-tank fill-ups, MPG = miles
// driven / gallons added over that span (summing any partial fills between).

import type { FuelLog } from "@/lib/db/schema";

export type FuelLogWithMpg = FuelLog & { mpg: number | null };

export function withMpg(logs: FuelLog[]): FuelLogWithMpg[] {
  // Compute in odometer order (fallback fill date), then map back to input order.
  const asc = [...logs].sort((a, b) => {
    const ao = a.odometer ?? Number.NEGATIVE_INFINITY;
    const bo = b.odometer ?? Number.NEGATIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return (a.fillDate ?? "").localeCompare(b.fillDate ?? "");
  });

  const mpgById = new Map<number, number | null>();
  let lastFullOdo: number | null = null;
  let accGallons = 0;

  for (const log of asc) {
    accGallons += log.gallons != null ? Number(log.gallons) : 0;
    let mpg: number | null = null;
    if (log.isFullTank && log.odometer != null) {
      if (lastFullOdo != null && accGallons > 0) {
        const miles = log.odometer - lastFullOdo;
        if (miles > 0) mpg = miles / accGallons;
      }
      lastFullOdo = log.odometer;
      accGallons = 0;
    }
    mpgById.set(log.id, mpg);
  }

  return logs.map((l) => ({ ...l, mpg: mpgById.get(l.id) ?? null }));
}

export function fuelSummary(logs: FuelLog[]) {
  const mpgs = withMpg(logs)
    .map((l) => l.mpg)
    .filter((m): m is number => m != null && Number.isFinite(m));
  const avgMpg = mpgs.length
    ? mpgs.reduce((a, b) => a + b, 0) / mpgs.length
    : null;
  const totalCost = logs.reduce(
    (s, l) => s + (l.totalCost != null ? Number(l.totalCost) : 0),
    0,
  );
  const totalGallons = logs.reduce(
    (s, l) => s + (l.gallons != null ? Number(l.gallons) : 0),
    0,
  );
  return { avgMpg, totalCost, totalGallons, count: logs.length };
}
