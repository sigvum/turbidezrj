"use server";

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "allow",
});

const sql_pat = postgres(process.env.DATABASE_URL_pat, {
  ssl: "allow",
});

export async function checkUser(name, email) {
  try {
    const result = await sql_pat`
      SELECT infoaldeias
      FROM patrim_users 
      WHERE email = ${email ?? ""}
      LIMIT 1`;

    if (result?.length > 0) {
      if (result[0].infoaldeias === true) {
        return "Ativo";
      } else {
        return "Inativo";
      }
    } else {
      try {
        await sql_pat`
          INSERT INTO patrim_users (name, email, infoaldeias)
          VALUES (${name ?? ""}, ${email ?? ""}, false)`;

        try {
          const message =
            "TurbidezRJ: Nov@ usuári@ registrad@: " + name + " - " + email;
          const chatId = process.env.TELEGRAM_CHAT_ID;
          const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
          const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
          const response = await fetch(telegramApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
            }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              `Erro ao enviar mensagem para o Telegram: ${response.status} - ${
                errorData.description || response.statusText
              }`
            );
          }
        } catch (error) {
          console.error(error);
        }
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

export async function contactDev(name, email, messagedev) {
  try {
    const message = `TurbidezRJ: Mensagem ao Desenvolvedor:\nNome: ${name}\nEmail: ${email}\nMensagem: ${messagedev}`;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ description: response.statusText }));
      throw new Error(
        `Erro ${response.status}: ${
          errorData.description || "Falha ao enviar mensagem"
        }`
      );
    }
  } catch (error) {
    console.error(error);
  }
}

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
