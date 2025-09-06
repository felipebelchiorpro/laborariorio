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
    // Decodifica a variável de ambiente Base64 para uma string.
    const decodedString = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
    
    // O problema é que a string decodificada pode ser um JSON que contém outra string JSON
    // Ex: '"{\\"type\\": \\"service_account\\", ...}"'
    // Primeiro, fazemos o parse dessa string externa para obter a string interna.
    const innerJsonString = JSON.parse(decodedString);

    // Agora, fazemos o parse da string JSON interna para obter o objeto de credenciais.
    const credentials = JSON.parse(innerJsonString);

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

export async function getExams(spreadsheetId: string): Promise<Exam[]> {
  if (!spreadsheetId) {
    console.warn("Spreadsheet ID is missing.");
    return [];
  }
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: RANGE,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length <= 1) { 
      return [];
    }
    
    return rows
      .slice(1)
      .map((row, index) => ({ originalRow: row, originalIndex: index }))
      .filter(({ originalRow }) => originalRow.some(cell => cell && cell.toString().trim() !== ''))
      .map(({ originalRow, originalIndex }) => mapRowToExam(originalRow, originalIndex));

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
