'use server';
import { google } from 'googleapis';
import type { Exam } from './types';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const RANGE = 'A:D';

function getAuth() {
  const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
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


export async function getExams(spreadsheetId: string): Promise<Exam[]> {
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: RANGE,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length <= 1) { // Menor ou igual a 1 para ignorar apenas o cabeçalho
      console.log(`No data found for spreadsheetId: ${spreadsheetId}`);
      return [];
    }

    // Pula a primeira linha (cabeçalho) e depois mapeia e filtra as linhas vazias
    return rows
      .slice(1)
      .map((row, index) => ({ originalRow: row, index }))
      .filter(({ originalRow }) => {
        return originalRow.some(cell => cell !== null && cell !== '');
      })
      .map(({ originalRow, index }) => {
        return mapRowToExam(originalRow, index);
      });

  } catch (error) {
    console.error(`[Sheets API Error] Failed to get exams for spreadsheetId: ${spreadsheetId}`, error);
    throw new Error('Failed to fetch data from Google Sheets.');
  }
}


export async function addExam(spreadsheetId: string, exam: Omit<Exam, 'id' | 'rowNumber'>) {
    const sheets = getSheetsClient();
    const values = [mapExamToRow(exam)];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: RANGE,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values,
        },
    });
}


export async function updateExam(spreadsheetId: string, exam: Exam) {
    if (!exam.rowNumber) {
        throw new Error("O número da linha é necessário para atualizar o exame.");
    }
    const sheets = getSheetsClient();
    const range = `A${exam.rowNumber}:D${exam.rowNumber}`;
    const values = [mapExamToRow(exam)];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values,
        },
    });
}
