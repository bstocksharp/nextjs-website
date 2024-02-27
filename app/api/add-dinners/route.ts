"use server"; // Mark the file as a server-side script

import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const created_by = searchParams.get("created_by");
  const dinner_item = searchParams.get("dinner_item");
  const date_of_meal = searchParams.get("date_of_meal");

  try {
    if (!created_by || !dinner_item || !date_of_meal)
      throw new Error("Need some more info");

    await sql`INSERT INTO dinner_table (created_by, dinner_item, date_of_meal) VALUES (${created_by}, ${dinner_item}, ${date_of_meal});`;
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  const meals = await sql`SELECT * FROM dinner_table;`;
  return NextResponse.json({ meals }, { status: 200 });
}

//http://localhost:3000/api/add-test?created_by=B&dinner_item=chicken&date_of_meal=01/01/1997
