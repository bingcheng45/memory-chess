import "server-only";

type SheetCell = string | number | boolean;

interface AppendGoogleSheetRowOptions {
  range: string;
  row: readonly SheetCell[];
  valueInputOption: "RAW" | "USER_ENTERED";
}

export async function appendGoogleSheetRow({
  range,
  row,
  valueInputOption,
}: AppendGoogleSheetRowOptions): Promise<void> {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!serviceAccountKey) {
    throw new Error("Google service account key is missing");
  }

  if (!spreadsheetId) {
    throw new Error("Google Sheet ID is missing");
  }

  let credentials: object;
  try {
    credentials = JSON.parse(serviceAccountKey) as object;
  } catch {
    throw new Error("Invalid Google service account key format");
  }

  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const accessToken = await auth.getAccessToken();

  if (!accessToken) {
    throw new Error("Unable to authorize Google Sheets request");
  }

  const endpoint = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append`,
  );
  endpoint.searchParams.set("valueInputOption", valueInputOption);
  endpoint.searchParams.set("insertDataOption", "INSERT_ROWS");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [[...row]] }),
  });

  if (!response.ok) {
    throw new Error(
      `Google Sheets append failed with status ${response.status}`,
    );
  }
}
