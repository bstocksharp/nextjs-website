"use server";

import { QueryResultRow, sql } from "@vercel/postgres";
import { Meal } from "./sharedTypes";

export async function fetchDinners() {
  try {
    //TODO maybe add dynamic date ranges so we could have non-static-size calendar
    const data = await sql` 
    SELECT *
    FROM dinner_table
    WHERE date_of_meal >= CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE) * INTERVAL '1 day'
      AND date_of_meal <= CURRENT_DATE + INTERVAL '14 days';
    `;
    return selectDinners(data.rows);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch dinners.");
  }
}

function selectDinners(data: QueryResultRow[]): Meal[] {
  return data.map((item) => ({
    id: item.id,
    date: item.date_of_meal,
    dinnerItem: item.dinner_item,
    createdBy: item.created_by,
    link: item.dinner_link,
  }));
}
