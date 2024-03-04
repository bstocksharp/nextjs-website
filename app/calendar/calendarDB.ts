"use server";

import { sql } from "@vercel/postgres";

export async function fetchDinners() {
  try {
    const data = await sql`SELECT * from dinner_table`;
    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch dinners.");
  }
}
