"use server"; // Mark the file as a server-side script

import { sql } from "@vercel/postgres";
import { Meal } from "../sharedTypes/sharedTypes";

// Define the Server Action function to create a new dinner
export async function createMeal(meal: Meal) {
  await sql`
    INSERT INTO dinner_table (created_by, dinner_item, date_of_meal, dinner_link)
    VALUES (
        ${meal.createdBy}, 
        ${meal.dinnerItem}, 
        ${meal.date.toISOString()}, 
        ${meal.link})
    `;
}
