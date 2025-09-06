'use server';
import { google } from 'googleapis';
import type { Exam } from './types';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const RANGE = 'A:D';

function getAuth() {
  const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;

  if (!credentialsBase64) {
    throw new Error('A variável de ambiente GOOGLE_APPLICATION_CREDENTIALS_BASE64 não está definida.');
  }

  try {
    // Decodifica o conteúdo do arquivo de credenciais a partir da string Base64
    const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
    
    // Analisa o JSON para criar o objeto de credenciais
    const credentials = JSON.parse(credentialsJson);

    return new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });
  } catch (error) {
    console.error("Falha ao decodificar ou analisar as credenciais JSON:", error);
    throw new Error("As credenciais fornecidas em GOOGLE_APPLICATION_CREDENTIALS_BASE64 não são um JSON válido.");
  }
}


function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

function mapRowToExam(row: any[], index: number): Exam {
    const rowNumber = index + 2; // +2 to account for 0-based index and header row
    return {
        id: `ROW${rowNumber}`,
        rowNumber,
        patientName: row[0] || '',
        receivedDate: row[1] ? new Date(row[1]).toISOString() : undefined,
        withdrawnBy: row[2] || undefined,
        observations: row[3] || '',
    };
}


function mapExamToRow(exam: Omit<Exam, 'id' | 'rowNumber'>): any[] {
  return [
    exam.patientName || '',
    exam.receivedDate ? new Date(exam.receivedDate).toLocaleDateString('pt-BR') : '',
    exam.withdrawnBy || '',
    exam.observations || '',
  ];
}

function extractSpreadsheetId(idOrUrl: string): string {
  if (idOrUrl.includes('spreadsheets/d/')) {
    const parts = idOrUrl.split('/d/');
    if (parts.length > 1) {
      return parts[1].split('/')[0];
    }
  }
  return idOrUrl;
}


export async function getExams(spreadsheetId: string): Promise<Exam[]> {
  const finalSpreadsheetId = extractSpreadsheetId(spreadsheetId);
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: finalSpreadsheetId,
      range: RANGE,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length <= 1) { 
      return [];
    }
    
    // Filter out completely empty rows
    return rows
      .slice(1) // Skip header row
      .map((row, index) => ({ originalRow: row, originalIndex: index }))
      .filter(({ originalRow }) => originalRow.some(cell => cell && cell.toString().trim() !== ''))
      .map(({ originalRow, originalIndex }) => mapRowToExam(originalRow, originalIndex));

  } catch (error) {
    console.error(`[Sheets API Error] Failed to get exams for spreadsheetId: ${finalSpreadsheetId}`, error);
    throw new Error('Failed to fetch data from Google Sheets.');
  }
}


export async function addExam(spreadsheetId: string, exam: Omit<Exam, 'id' | 'rowNumber'>) {
    const finalSpreadsheetId = extractSpreadsheetId(spreadsheetId);
    const sheets = getSheetsClient();
    const values = [mapExamToRow(exam)];

    await sheets.spreadsheets.values.append({
        spreadsheetId: finalSpreadsheetId,
        range: RANGE,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values,
        },
    });
}


export async function updateExam(spreadsheetId: string, exam: Exam) {
    const finalSpreadsheetId = extractSpreadsheetId(spreadsheetId);
    if (!exam.rowNumber) {
        throw new Error("O número da linha é necessário para atualizar o exame.");
    }
    const sheets = getSheetsClient();
    const range = `A${exam.rowNumber}:D${exam.rowNumber}`;
    const values = [mapExamToRow(exam)];

    await sheets.spreadsheets.values.update({
        spreadsheetId: finalSpreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values,
        },
    });
}
