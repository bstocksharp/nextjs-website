import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Drop the table if it exists
    // await sql`DROP TABLE dinner_table;`;
    await sql`DELETE FROM dinner_table ;`;

    return NextResponse.json(
      { message: "Table dropped successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
