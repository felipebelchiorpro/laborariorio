import { config } from 'dotenv';
import { google } from 'googleapis';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

async function getAuthClient() {
  const base64Credentials = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (!base64Credentials) throw new Error('No base64 creds');
  
  const credentialsStr = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const credentials = JSON.parse(credentialsStr.trim());

  const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth.getClient();
}

async function run() {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheetId = process.env.NEXT_PUBLIC_RECOLETA_SHEET_ID;
    console.log(`Using Spreadsheet ID: ${spreadsheetId}`);
    
    // 1. Get sheet info
    const info = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId! });
    const sheetTitles = info.data.sheets?.map(s => s.properties?.title) || [];
    console.log("Available Sheet Tabs:", sheetTitles.join(', '));
    
    // 2. Try fetching both possible names
    for (const name of ['Recoleta', 'São Lucas', ...sheetTitles]) {
        try {
            console.log(`\nFetching ${name}!A:E ...`);
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId!,
                range: `${name}!A:E`
            });
            console.log(`Success! Fetched ${res.data.values?.length || 0} rows.`);
            if (res.data.values && res.data.values.length > 0) {
                console.log("First row:", res.data.values[0]);
                if (res.data.values.length > 1) {
                    console.log("Second row:", res.data.values[1]);
                }
            }
        } catch (e: any) {
            console.log(`Failed to fetch ${name}: ${e.message}`);
        }
    }
  } catch (e: any) {
    console.error("Test script failed:", e.message);
  }
}

run();
