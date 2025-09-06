
'use server';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import type { Exam } from './types';
import { parse, isValid, getYear } from 'date-fns';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const RANGE = 'A:D'; 

async function getSheetsClient() {
  const base64Credentials = process.env.GOOGLE_CREDENTIALS_BASE64;

  if (!base64Credentials) {
    const errorMsg = 'A variável de ambiente GOOGLE_CREDENTIALS_BASE64 não está definida.';
    console.error(`[AUTH ERROR] ${errorMsg}`);
    throw new Error(errorMsg);
  }
  
  try {
    const credentialsStr = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const credentials = JSON.parse(credentialsStr);

    const auth = new GoogleAuth({
      credentials,
      scopes: SCOPES,
    });
    
    const client = await auth.getClient();
    
    const sheets = google.sheets({ version: 'v4', auth: client as any });
    return sheets;

  } catch (error: any) {
    console.error("[AUTH ERROR] Falha ao decodificar ou processar as credenciais Base64:", error.message);
    throw new Error("As credenciais fornecidas em GOOGLE_CREDENTIALS_BASE64 não são válidas.");
  }
}

function mapRowToExam(row: any[], index: number): Exam | null {
  const rowNumber = index + 2; 
  const [patientName, receivedDateStr, withdrawnBy, observations] = row;

  if (!patientName || String(patientName).trim() === '') {
    return null;
  }

  let receivedDate: string | undefined;
  if (receivedDateStr) {
    try {
      const dateString = String(receivedDateStr).trim();
      if (dateString) {
        let parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
        
        if (!isValid(parsedDate)) {
           const currentYear = getYear(new Date());
           parsedDate = parse(`${dateString}/${currentYear}`, 'dd/MM/yyyy', new Date());
        }

        if (isValid(parsedDate)) {
          receivedDate = parsedDate.toISOString();
        }
      }
    } catch (e) {
        // Silently fail on date parse error, leave date undefined
    }
  }

  const examResult: Exam = {
    id: `ROW${rowNumber}`,
    rowNumber,
    patientName: String(patientName || ''),
    receivedDate,
    withdrawnBy: withdrawnBy || undefined,
    observations: observations || '',
  };
  
  return examResult;
}

function mapExamToRow(exam: Omit<Exam, 'id' | 'rowNumber'>): any[] {
  const displayDate = exam.receivedDate ? new Date(exam.receivedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  return [
    exam.patientName || '',
    displayDate,
    exam.withdrawnBy || '',
    exam.observations || '',
  ];
}

export async function getExams(spreadsheetId: string): Promise<Exam[]> {
  if (!spreadsheetId) {
    return [];
  }
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: RANGE,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length <= 1) { 
      return [];
    }
    
    const exams = rows
      .slice(1)
      .map((row, index) => mapRowToExam(row, index))
      .filter((exam): exam is Exam => exam !== null);
    
    return exams;

  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    console.error(`[Sheets API Error] Falha ao buscar exames para a planilha ${spreadsheetId}`, errorMessage);
    throw new Error('Failed to fetch data from Google Sheets.');
  }
}

export async function addExam(spreadsheetId: string, exam: Omit<Exam, 'id' | 'rowNumber'>) {
    const sheets = await getSheetsClient();
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
    const sheets = await getSheetsClient();
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
