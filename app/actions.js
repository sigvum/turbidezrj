"use server";

import postgres from "postgres";

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
    return result;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getRioGeometry() {
  try {
    const result = await sql`
      SELECT ST_AsGeoJSON(ST_Simplify(geom, 0.01)) as geojson
      FROM unidades
      WHERE nome = 'Rio de Janeiro'
      LIMIT 1;
    `;

    return result[0]?.geojson ? JSON.parse(result[0].geojson) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function selectBacias() {
  try {
    const result = await sql`
      SELECT 
        ST_AsGeoJSON(ST_Simplify(geom, 0.01)) as geojson,
        sub_bacias
      FROM bacias_rj;
    `;

    if (Array.isArray(result)) {
      return result.map((row) => ({
        geojson: row.geojson ? JSON.parse(row.geojson) : null,
        properties: {
          nome: row.sub_bacias,
        },
      }));
    }
  } catch (error) {
    console.error(error);
    return [];
  }
}
