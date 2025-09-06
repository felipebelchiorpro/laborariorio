
'use server';
import { google } from 'googleapis';
import type { Exam } from './types';
import { parse, isValid, getYear } from 'date-fns';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const RANGE = 'A:D';

function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail) {
    const errorMsg = 'A variável de ambiente GOOGLE_CLIENT_EMAIL não está definida.';
    console.error(`[AUTH ERROR] ${errorMsg}`);
    throw new Error(errorMsg);
  }
  if (!privateKey) {
    const errorMsg = 'A variável de ambiente GOOGLE_PRIVATE_KEY não está definida.';
    console.error(`[AUTH ERROR] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Corrigir a formatação da chave privada para o ambiente de produção
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
  } catch (error: any) {
    console.error("[AUTH ERROR] Falha ao criar o cliente de autenticação:", error.message);
    throw new Error("As credenciais fornecidas não são válidas.");
  }
}

function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

function mapRowToExam(row: any[], index: number): Exam | null {
  const rowNumber = index + 2;
  const [patientName, receivedDateStr, withdrawnBy, observations] = row;

  // A linha só é inválida se a célula do nome do paciente for estritamente nula, indefinida ou uma string vazia.
  if (patientName === null || patientName === undefined || String(patientName).trim() === '') {
    return null;
  }

  let receivedDate: string | undefined;
  if (receivedDateStr) {
    try {
      const dateString = String(receivedDateStr).trim();
      if (dateString) {
          const currentYear = getYear(new Date());
          
          let parsedDate = parse(`${dateString}/${currentYear}`, 'dd/MM/yyyy', new Date());
          if (!isValid(parsedDate)) {
            parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
          }

          if (isValid(parsedDate)) {
            receivedDate = parsedDate.toISOString();
          }
      }
    } catch (e) {
        console.error(`[DATE PARSE ERROR] Erro ao analisar a data "${receivedDateStr}" na linha ${rowNumber}. Deixando o campo em branco.`);
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
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: RANGE,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length <= 1) { 
      console.log("[INFO] Planilha vazia ou contém apenas o cabeçalho.");
      return [];
    }
    
    console.log(`[INFO] ${rows.length - 1} linhas de dados encontradas. Processando...`);
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
