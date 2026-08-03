import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { wishlistItems } from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";
import { vehicleInGroup } from "./scope";

/** Wishlist items for a vehicle — unpurchased first, then newest. */
export async function listWishlist(vehicleId: number) {
  const groupId = await requireGroupId();
  return db
    .select()
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.vehicleId, vehicleId),
        vehicleInGroup(wishlistItems.vehicleId, groupId),
      ),
    )
    .orderBy(asc(wishlistItems.purchased), desc(wishlistItems.id));
}

/** A single wishlist item by id, or null — null too outside the group. */
export async function getWishlistItem(id: number) {
  const groupId = await requireGroupId();
  const rows = await db
    .select()
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.id, id),
        vehicleInGroup(wishlistItems.vehicleId, groupId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
