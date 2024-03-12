"use server"; // Mark the file as a server-side script

import { sql } from "@vercel/postgres";

// Define the Server Action function to create a new dinner
export async function InsertDinner(formData: FormData) {
  const { createdBy, dinnerItem, mealDate, dinnerLink } = {
    createdBy: formData.get("createdBy") as string,
    dinnerItem: formData.get("dinnerItem") as string,
    mealDate: formData.get("mealDate") as string,
    dinnerLink: formData.get("dinnerLink") as string,
  };

  //   Insert the new dinner into the database
  await sql`
    INSERT INTO dinner_table (created_by, dinner_item, date_of_meal, dinner_link)
    VALUES (${createdBy}, ${dinnerItem}, ${mealDate}, ${dinnerLink})
  `;
}
