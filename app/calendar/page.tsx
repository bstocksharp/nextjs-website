"use server";
import { sql } from "@vercel/postgres";
import AddDinner from "./addDinner";

async function FetchDinners() {
  try {
    const data = await sql`SELECT * from dinner_table`;
    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}

export default async function CalendarPage() {
  const dinners = await FetchDinners();

  return (
    <main>
      <div className="calendar-wrapper">
        {dinners.map((row) => (
          <div key={row.id}>
            {row.created_by} - {row.dinner_item} -{" "}
            {row.date_of_meal.toISOString().split("T")[0]}
          </div>
        ))}
      </div>
      <div className="add-dinner-button-center">
        <AddDinner />
      </div>
    </main>
  );
}
