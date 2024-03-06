"use server";

import { QueryResultRow, sql } from "@vercel/postgres";
import { Meal } from "./sharedTypes";

export async function fetchDinners() {
  try {
    const data = await sql`SELECT * from dinner_table`;
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
