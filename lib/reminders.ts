// Pure due-soon logic (no DB). "Soon" = within 30 days OR 500 miles; past
// either threshold is "overdue".

export type DueStatus = "overdue" | "soon" | "ok";

const SOON_DAYS = 30;
const SOON_MILES = 500;

type DueFields = {
  nextDueDate: string | null;
  nextDueMileage: number | null;
};

export function recordDueStatus(
  due: DueFields,
  currentMileage: number | null,
  now: Date,
): DueStatus {
  let status: DueStatus = "ok";

  if (due.nextDueDate) {
    const target = new Date(`${due.nextDueDate}T12:00:00`);
    const days = (target.getTime() - now.getTime()) / 86_400_000;
    if (days < 0) return "overdue";
    if (days <= SOON_DAYS) status = "soon";
  }

  if (due.nextDueMileage != null && currentMileage != null) {
    const milesLeft = due.nextDueMileage - currentMileage;
    if (milesLeft < 0) return "overdue";
    if (milesLeft <= SOON_MILES) status = "soon";
  }

  return status;
}

/** Most urgent status across records, or null if none are soon/overdue. */
export function worstStatus(statuses: DueStatus[]): "overdue" | "soon" | null {
  if (statuses.includes("overdue")) return "overdue";
  if (statuses.includes("soon")) return "soon";
  return null;
}
