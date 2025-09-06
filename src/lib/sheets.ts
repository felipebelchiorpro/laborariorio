'use server';
import { google } from 'googleapis';
import type { Exam } from './types';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const RANGE = 'A:D';

function getAuth() {
  const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
  return new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
}

function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

function mapRowToExam(row: any[], index: number): Exam {
    const rowNumber = index + 2; // +2 para compensar o índice base 0 e o cabeçalho
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
      console.log(`No data found for spreadsheetId: ${finalSpreadsheetId}`);
      return [];
    }
    
    return rows
      .slice(1)
      .map((row, index) => ({ originalRow: row, index }))
      .filter(({ originalRow }) => {
        return originalRow.some(cell => cell !== null && cell.toString().trim() !== '');
      })
      .map(({ originalRow, index }) => {
        return mapRowToExam(originalRow, index);
      });

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
