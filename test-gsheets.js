const fs = require('fs');
const { google } = require('googleapis');

async function run() {
  try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    let base64Credentials = '';
    let sheetId = '';
    
    envFile.split('\n').forEach(line => {
      if (line.startsWith('GOOGLE_CREDENTIALS_BASE64=')) {
        base64Credentials = line.split('=')[1].trim();
      }
      if (line.startsWith('NEXT_PUBLIC_RECOLETA_SHEET_ID=')) {
        sheetId = line.split('=')[1].trim();
      }
    });

    if (!base64Credentials) throw new Error('No base64 creds');
    
    const credentialsStr = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const credentials = JSON.parse(credentialsStr.trim());

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    console.log(`Using Spreadsheet ID: ${sheetId}`);
    
    // 1. Get sheet info
    const info = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetTitles = info.data.sheets?.map(s => s.properties?.title) || [];
    console.log("Available Sheet Tabs:", sheetTitles.join(', '));
    
    // 2. Try fetching both possible names
    for (const name of ['Recoleta', 'São Lucas', ...sheetTitles]) {
        try {
            console.log(`\nFetching ${name}!A:E ...`);
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: `${name}!A:E`
            });
            console.log(`Success! Fetched ${res.data.values?.length || 0} rows.`);
            if (res.data.values && res.data.values.length > 0) {
                console.log("First row:", res.data.values[0]);
                if (res.data.values.length > 1) {
                    console.log("Second row:", res.data.values[1]);
                }
            }
        } catch (e) {
            console.log(`Failed to fetch ${name}: ${e.message}`);
        }
    }
  } catch (e) {
    console.error("Test script failed:", e.message);
  }
}

run();
