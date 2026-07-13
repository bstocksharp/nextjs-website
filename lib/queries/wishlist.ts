import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { wishlistItems } from "@/lib/db/schema";

/** Wishlist items for a vehicle — unpurchased first, then newest. */
export function listWishlist(vehicleId: number) {
  return db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.vehicleId, vehicleId))
    .orderBy(asc(wishlistItems.purchased), desc(wishlistItems.id));
}

/** A single wishlist item by id, or null. */
export async function getWishlistItem(id: number) {
  const rows = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.id, id))
    .limit(1);
  return rows[0] ?? null;
}
