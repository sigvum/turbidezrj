"use server";

import { google } from "googleapis";

export async function selectAldeias() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "infoaldeias!A1:Z1000",
    });

    const rows = response.data.values;

    if (!rows?.length) {
      throw new Error("Nenhum dado encontrado na planilha");
    }

    const headers = rows[0];
    return rows.slice(1).map((row) => {
      return headers.reduce((obj, header, index) => {
        obj[header] = row[index] || null;

        return obj;
      }, {});
    });
  } catch (error) {
    console.error("Erro ao acessar Google Sheets:", error);
    throw new Error("Falha ao buscar dados da planilha");
  }
}
