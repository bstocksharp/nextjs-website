"use server"; // Mark the file as a server-side script

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Define the Server Action function to create a new dinner
export async function InsertDinner(formData: FormData) {
  const { createdBy, dinnerItem, mealDate } = {
    createdBy: formData.get("createdBy") as string,
    dinnerItem: formData.get("dinnerItem") as string,
    mealDate: formData.get("mealDate") as string,
  };

  //   Insert the new dinner into the database
  await sql`
    INSERT INTO dinner_table (created_by, dinner_item, date_of_meal)
    VALUES (${createdBy}, ${dinnerItem}, ${mealDate})
  `;

  // Revalidate the cache for the dinner_table page
  revalidatePath("/calendar");

  // Redirect the user back to the dinner_table page
  redirect("/calendar");
}
