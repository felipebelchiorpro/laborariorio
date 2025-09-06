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
    const rowNumber = index + 1; // +1 para o índice base 1
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
    
    // Se não houver dados ou a resposta for vazia, retorne um array vazio.
    if (!rows || rows.length === 0) {
      console.log(`No data found for spreadsheetId: ${spreadsheetId}`);
      return [];
    }

    // Mapeia as linhas para exames, pulando o cabeçalho (índice 0)
    return rows
      .map((row, index) => ({ originalRow: row, exam: mapRowToExam(row, index + 1) }))
      .filter(({ originalRow, exam }, index) => {
        // Pula a primeira linha (cabeçalho)
        if (index === 0) return false;
        // Verifica se a linha não está completamente vazia
        const isRowEmpty = originalRow.every(cell => cell === null || cell === '');
        return !isRowEmpty;
      })
      .map(({ exam }) => exam);

  } catch (error) {
    console.error(`[Sheets API Error] Failed to get exams for spreadsheetId: ${spreadsheetId}`, error);
    // Lança o erro para que o componente que chamou possa tratá-lo (e mostrar um toast, por exemplo)
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
