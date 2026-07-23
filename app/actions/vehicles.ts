"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";
import { requireEditor } from "@/lib/auth";
import { requireVehicleEditor } from "@/lib/authz";
import { getActiveProfile } from "@/lib/profile";

/** Pull vehicle fields out of a submitted form (empty strings → null). */
function parseVehicle(formData: FormData) {
  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };
  const int = (k: string) => {
    const v = str(k);
    if (v === null) return null;
    const n = Number.parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
  };

  return {
    name: String(formData.get("name") ?? "").trim(),
    status: str("status") ?? "owned",
    make: str("make"),
    model: str("model"),
    year: int("year"),
    trim: str("trim"),
    vin: str("vin"),
    licensePlate: str("licensePlate"),
    color: str("color"),
    interiorColor: str("interiorColor"),
    transmission: str("transmission"),
    purchaseDate: str("purchaseDate"),
    purchasePrice: str("purchasePrice"), // numeric column takes a string
    purchaseMileage: int("purchaseMileage"),
    currentMileage: int("currentMileage"),
    notes: str("notes"),
    profileId: int("profileId"), // owner (see Profiles & visibility)
    visibility: str("visibility") === "private" ? "private" : "shared",
  };
}

export async function addVehicle(formData: FormData): Promise<void> {
  await requireEditor();
  const data = parseVehicle(formData);
  if (!data.name) throw new Error("Name is required.");

  // Default the owner to whoever's active if the form didn't specify one.
  const profileId = data.profileId ?? (await getActiveProfile())?.id ?? null;

  const [row] = await db
    .insert(vehicles)
    .values({ ...data, profileId })
    .returning({ id: vehicles.id });

  revalidatePath("/garage");
  redirect(`/garage/${row.id}`);
}

export async function updateVehicle(
  id: number,
  formData: FormData,
): Promise<void> {
  await requireVehicleEditor(id);
  const data = parseVehicle(formData);
  if (!data.name) throw new Error("Name is required.");

  await db.update(vehicles).set(data).where(eq(vehicles.id, id));

  revalidatePath("/garage");
  revalidatePath(`/garage/${id}`);
  redirect(`/garage/${id}`);
}

export async function deleteVehicle(
  id: number,
  _formData: FormData,
): Promise<void> {
  await requireVehicleEditor(id);
  await db.delete(vehicles).where(eq(vehicles.id, id));

  revalidatePath("/garage");
  redirect("/garage");
}
