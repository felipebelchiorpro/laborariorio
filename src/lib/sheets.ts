'use server';
import { google } from 'googleapis';
import type { Exam } from './types';
import { parse, isValid, getYear } from 'date-fns';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const RANGE = 'A:D';

function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    console.error('[AUTH ERROR] As variáveis de ambiente GOOGLE_CLIENT_EMAIL e GOOGLE_PRIVATE_KEY devem estar definidas.');
    throw new Error('As credenciais do Google não foram configuradas corretamente.');
  }

  // A chave privada pode vir com literais de nova linha '\\n' do ambiente. Substituímos por '\n' real.
  const processedPrivateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: processedPrivateKey,
      },
      scopes: SCOPES,
    });
    return auth;
  } catch (error) {
    console.error("[AUTH ERROR] Falha ao criar o cliente de autenticação:", error);
    throw new Error("As credenciais fornecidas não são válidas.");
  }
}

function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

function mapRowToExam(row: any[], index: number): Exam | null {
  const rowNumber = index + 2; // +1 for zero-based index, +1 for header row
  const [patientName, receivedDateStr, withdrawnBy, observations] = row;

  if (!patientName || String(patientName).trim() === '') {
    return null;
  }

  let receivedDate: string | undefined;
  if (receivedDateStr) {
    const dateString = String(receivedDateStr).trim();
    const currentYear = getYear(new Date());
    
    // Tenta analisar com formatos DD/MM e DD/MM/YYYY
    let parsedDate = parse(`${dateString}/${currentYear}`, 'dd/MM/yyyy', new Date());
    if (!isValid(parsedDate)) {
      parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
    }

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
  
  return examResult;
}

function mapExamToRow(exam: Omit<Exam, 'id' | 'rowNumber'>): any[] {
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
    
    if (!rows || rows.length <= 1) { 
      console.log("[INFO] A planilha está vazia ou contém apenas o cabeçalho.");
      return [];
    }
    
    const exams = rows
      .slice(1)
      .map((row, index) => mapRowToExam(row, index))
      .filter((exam): exam is Exam => exam !== null && exam.patientName.trim() !== '');

    console.log(`[INFO] Processamento concluído. ${exams.length} exames mapeados.`);
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
