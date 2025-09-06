'use server';
import { google } from 'googleapis';
import type { Exam } from './types';
import { parse, isValid, getYear } from 'date-fns';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const RANGE = 'A:D';

function getAuth() {
  const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;

  if (!credentialsBase64) {
    console.error('[AUTH ERROR] A variável de ambiente GOOGLE_APPLICATION_CREDENTIALS_BASE64 não está definida.');
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
    console.error("[AUTH ERROR] Falha ao decodificar ou processar as credenciais:", error);
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
  
  // Log para cada linha processada
  console.log(`[DEBUG] Processando Linha ${rowNumber}:`, { patientName, receivedDateStr, withdrawnBy, observations });

  if (!patientName || String(patientName).trim() === '') {
    console.log(`[DEBUG] Linha ${rowNumber} ignorada: Nome do paciente está vazio.`);
    return null; // Ignore rows without a patient name
  }

  let receivedDate: string | undefined;
  if (receivedDateStr) {
    const currentYear = getYear(new Date());
    const dateWithYear = `${String(receivedDateStr).trim()}/${currentYear}`;
    
    // Tenta analisar a data no formato dd/MM/yyyy
    const parsedDate = parse(dateWithYear, 'dd/MM/yyyy', new Date());

    if (isValid(parsedDate)) {
      receivedDate = parsedDate.toISOString();
    } else {
      console.warn(`[WARN] Data em formato inválido na linha ${rowNumber}: "${receivedDateStr}". A data será ignorada.`);
    }
  }

  const examResult: Exam = {
    id: `ROW${rowNumber}`,
    rowNumber,
    patientName: String(patientName),
    receivedDate,
    withdrawnBy: withdrawnBy || undefined,
    observations: observations || '',
  };
  
  console.log(`[DEBUG] Linha ${rowNumber} mapeada para:`, examResult);
  return examResult;
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
  console.log(`[INFO] Iniciando busca de exames para a planilha: ${spreadsheetId}`);
  if (!spreadsheetId) {
    console.warn("[WARN] O ID da planilha está ausente.");
    return [];
  }
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: RANGE,
    });

    const rows = response.data.values;
    
    console.log('[DEBUG] Dados brutos recebidos da API do Google Sheets:', JSON.stringify(rows, null, 2));
    
    if (!rows || rows.length <= 1) { 
      console.log("[INFO] A planilha está vazia ou contém apenas o cabeçalho. Retornando array vazio.");
      return [];
    }
    
    const exams = rows
      .slice(1) // Skip header
      .map((row, index) => mapRowToExam(row, index))
      .filter((exam): exam is Exam => exam !== null && exam.patientName.trim() !== '');

    console.log(`[INFO] Processamento concluído. ${exams.length} exames mapeados.`);
    console.log('[DEBUG] Exames processados que serão retornados:', exams);

    return exams;

  } catch (error) {
    console.error(`[Sheets API Error] Falha ao buscar exames para a planilha ${spreadsheetId}`, error);
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
