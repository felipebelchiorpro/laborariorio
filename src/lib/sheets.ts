
'use server';
import { google } from 'googleapis';
import type { Exam } from './types';
import { parse, isValid, getYear } from 'date-fns';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const RANGE = 'A:D';

async function getAuth() {
  const base64Credentials = process.env.GOOGLE_CREDENTIALS_BASE64;

  if (!base64Credentials) {
    const errorMsg = 'A variável de ambiente GOOGLE_CREDENTIALS_BASE64 não está definida.';
    console.error(`[AUTH ERROR] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    const credentialsStr = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const credentials = JSON.parse(credentialsStr);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });
    
    const client = await auth.getClient();
    return client;

  } catch (error: any) {
    console.error("[AUTH ERROR] Falha ao decodificar ou processar as credenciais Base64:", error.message);
    throw new Error("As credenciais fornecidas em GOOGLE_CREDENTIALS_BASE64 não são válidas.");
  }
}

async function getSheetsClient() {
  const auth = await getAuth();
  return google.sheets({ version: 'v4', auth });
}

function mapRowToExam(row: any[], index: number): Exam | null {
  const rowNumber = index + 2;
  const [patientName, receivedDateStr, withdrawnBy, observations] = row;

  if (!patientName || String(patientName).trim() === '') {
    console.log(`[PROCESS INFO] Linha ${rowNumber} ignorada: Nome do paciente está vazio.`);
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
        } else {
           console.warn(`[DATE PARSE WARN] Data inválida "${receivedDateStr}" na linha ${rowNumber}.`);
        }
      }
    } catch (e) {
        console.error(`[DATE PARSE ERROR] Erro ao analisar a data "${receivedDateStr}" na linha ${rowNumber}.`, e);
        receivedDate = undefined;
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
  
  console.log(`[PROCESS INFO] Linha ${rowNumber} mapeada:`, JSON.stringify(examResult));
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
    console.log("[INFO] Nenhum ID de planilha fornecido. Retornando array vazio.");
    return [];
  }
  console.log(`[INFO] Iniciando busca de exames para a planilha: ${spreadsheetId}`);
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: RANGE,
    });

    const rows = response.data.values;
    
    console.log('[DEBUG] DADOS BRUTOS RECEBIDOS DA API DO GOOGLE SHEETS:', JSON.stringify(rows, null, 2));
    
    if (!rows || rows.length <= 1) { 
      console.log("[INFO] Planilha vazia ou contém apenas o cabeçalho. Linhas recebidas:", rows ? rows.length : 0);
      return [];
    }
    
    console.log(`[INFO] ${rows.length - 1} linhas de dados encontradas. Iniciando processamento...`);
    const exams = rows
      .slice(1)
      .map((row, index) => mapRowToExam(row, index))
      .filter((exam): exam is Exam => exam !== null);
    
    console.log(`[INFO] Processamento concluído. ${exams.length} exames válidos foram mapeados.`);
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
