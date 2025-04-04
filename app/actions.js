"use server";

import postgres from "postgres";
import { revalidatePath } from "next/cache";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "allow",
});

export async function selectPoints() {
  try {
    const result = await sql`
            SELECT
                id,
                corpodagua,
                med,
                med_13,
                med_14,
                med_15,
                med_16,
                med_17,
                med_18,
                med_19,
                ST_X(ST_Transform(geom, 4326)) AS longitude,
                ST_Y(ST_Transform(geom, 4326)) AS latitude
            FROM turbidez_rj;
        `;
    revalidatePath("/");
    return result;
  } catch (error) {
    console.error(error);
    return [];
  }
}
