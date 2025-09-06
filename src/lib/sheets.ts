'use server';
import { google } from 'googleapis';
import type { Exam } from './types';
import { parse, isValid } from 'date-fns';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const RANGE = 'A:D';

function getAuth() {
  const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;

  if (!credentialsBase64) {
    throw new Error('A variável de ambiente GOOGLE_APPLICATION_CREDENTIALS_BASE64 não está definida.');
  }

  try {
    const decodedCredentials = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
    const credentials = JSON.parse(decodedCredentials);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });
    
    return auth;

  } catch (error) {
    console.error("Falha ao decodificar ou processar as credenciais:", error);
    throw new Error("As credenciais fornecidas em GOOGLE_APPLICATION_CREDENTIALS_BASE64 não são válidas.");
  }
}

function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

function mapRowToExam(row: any[], index: number): Exam | null {
  const rowNumber = index + 2; // +1 for zero-based index, +1 for header row
  const [patientName, receivedDateStr, withdrawnBy, observations] = row;

  if (!patientName || patientName.trim() === '') {
    return null; // Ignore rows without a patient name
  }

  let receivedDate: string | undefined;
  if (receivedDateStr) {
    const currentYear = new Date().getFullYear();
    // Append the current year to the date string, assuming dates are for the current year
    const dateWithYear = `${receivedDateStr}/${currentYear}`;
    
    // Try to parse the date in dd/MM/yyyy format
    const parsedDate = parse(dateWithYear, 'dd/MM/yyyy', new Date());

    if (isValid(parsedDate)) {
      receivedDate = parsedDate.toISOString();
    } else {
      console.warn(`Data em formato inválido na linha ${rowNumber}: ${receivedDateStr}. A data será ignorada.`);
    }
  }

  return {
    id: `ROW${rowNumber}`,
    rowNumber,
    patientName: patientName || '',
    receivedDate,
    withdrawnBy: withdrawnBy || undefined,
    observations: observations || '',
  };
}


function mapExamToRow(exam: Omit<Exam, 'id' | 'rowNumber'>): any[] {
  // Format the date back to DD/MM for display in the sheet
  const displayDate = exam.receivedDate ? new Date(exam.receivedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
  return [
    exam.patientName || '',
    displayDate,
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
      .slice(1) // Skip header
      .map((row, index) => mapRowToExam(row, index))
      .filter((exam): exam is Exam => exam !== null && exam.patientName.trim() !== ''); // Filter out empty/null rows

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
