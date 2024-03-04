"use server";
import { sql } from "@vercel/postgres";
import AddDinner from "./addDinner";
import { fetchDinners } from "./calendarDB";

export default async function CalendarPage() {
  const dinners = await fetchDinners();

  return (
    <main>
      <div className="calendar-wrapper">
        {dinners.map((row) => (
          <div key={row.id}>
            {row.created_by} - {row.dinner_item} -{" "}
            {row.date_of_meal?.toISOString().split("T")[0]}
          </div>
        ))}
      </div>
      <div className="add-dinner-button-center">
        <AddDinner />
      </div>
    </main>
  );
}
