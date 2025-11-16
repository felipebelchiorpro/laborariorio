
'use server';
import { google } from 'googleapis';
import type { Exam, PdfLink, Recoleta } from './types';
import { parse, isValid, format } from 'date-fns';
import { randomUUID } from 'crypto';
import { uploadPdfToCloudinary } from './cloudinary';

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
];

// Colunas Exame: ID, Paciente, Data, Retirado, OBS, PDFs
const EXAM_SHEETS_RANGE = 'A:F';
const EXAM_ID_COLUMN_INDEX = 0;

// Colunas Recoleta: ID, Paciente, UBS, Avisado, OBS
const RECOLETA_SHEETS_RANGE = 'A:E';
const RECOLETA_ID_COLUMN_INDEX = 0;


async function getAuthClient() {
  const base64Credentials = process.env.GOOGLE_CREDENTIALS_BASE64;

  if (!base64Credentials) {
    console.error("[AUTH ERROR] A variável de ambiente GOOGLE_CREDENTIALS_BASE64 não foi encontrada.");
    throw new Error('A variável de ambiente GOOGLE_CREDENTIALS_BASE64 não foi encontrada.');
  }

  try {
    const credentialsStr = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const credentials = JSON.parse(credentialsStr.trim());

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
    });

    return auth.getClient();
  } catch (error: any) {
    console.error("[AUTH ERROR] Falha ao decodificar ou processar as credenciais Base64:", error.message);
    throw new Error("As credenciais fornecidas em GOOGLE_CREDENTIALS_BASE64 não são válidas.");
  }
}

// --- Mapeamento de Linhas ---

function mapRowToExam(row: any[], index: number): Exam | null {
  const rowNumber = index + 2; // GSheets is 1-based, and we skip the header
  const [id, patientName, receivedDateStr, withdrawnBy, observations, pdfData] = row;

  if (!patientName || String(patientName).trim() === '') {
    return null;
  }

  let receivedDate: string | undefined;
  if (receivedDateStr) {
    try {
      const dateString = String(receivedDateStr).trim();
      if (dateString) {
        let parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
          receivedDate = parsedDate.toISOString();
        }
      }
    } catch (e) {
        // Silently fail
    }
  }

  let pdfLinks: PdfLink[] | undefined;
  if (pdfData) {
    try {
      pdfLinks = JSON.parse(pdfData);
    } catch (e) {
      if (typeof pdfData === 'string' && pdfData.startsWith('http')) {
        pdfLinks = [{ url: pdfData, name: 'Resultado.pdf' }];
      }
    }
  }

  return {
    id: String(id || `MISSING_ID_ROW_${rowNumber}`),
    patientName: String(patientName || ''),
    receivedDate,
    withdrawnBy: withdrawnBy || undefined,
    observations: observations || '',
    pdfLinks,
    rowNumber: rowNumber
  };
}

function mapExamToRow(exam: Partial<Omit<Exam, 'rowNumber'>>): any[] {
  const displayDate = exam.receivedDate ? format(new Date(exam.receivedDate), 'dd/MM/yyyy') : '';
  const pdfData = exam.pdfLinks && exam.pdfLinks.length > 0 ? JSON.stringify(exam.pdfLinks) : '';
  
  return [
    exam.id || '',
    exam.patientName || '',
    displayDate,
    exam.withdrawnBy || '',
    exam.observations || '',
    pdfData,
  ];
}

function mapRowToRecoleta(row: any[], index: number): Recoleta | null {
    const rowNumber = index + 2;
    const [id, patientName, ubs, notifiedStr, observations] = row;

    if (!patientName || String(patientName).trim() === '') {
        return null;
    }

    return {
        id: String(id || `MISSING_ID_ROW_${rowNumber}`),
        patientName: String(patientName || ''),
        ubs: ubs || '',
        notified: String(notifiedStr).toUpperCase() === 'SIM',
        observations: observations || '',
        rowNumber: rowNumber
    };
}

function mapRecoletaToRow(recoleta: Partial<Omit<Recoleta, 'rowNumber'>>): any[] {
    return [
        recoleta.id || '',
        recoleta.patientName || '',
        recoleta.ubs || '',
        recoleta.notified ? 'SIM' : 'NÃO',
        recoleta.observations || '',
    ];
}


// --- Funções Genéricas ---

async function getSheetsApi() {
    const auth = await getAuthClient();
    return google.sheets({ version: 'v4', auth });
}

async function findRowById(sheets: any, spreadsheetId: string, id: string, range: string): Promise<number | null> {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });
    const ids = response.data.values;
    if (!ids) return null;

    for (let i = 1; i < ids.length; i++) {
        if (ids[i][0] === id) {
            return i + 1; // Return 1-based row number
        }
    }
    return null;
}

async function deleteRow(spreadsheetId: string, id: string, idColumnRange: string, sheetIndex: number = 0) {
  if (!id) {
    throw new Error("O ID é necessário para excluir.");
  }
  const sheets = await getSheetsApi();
  const rowNumber = await findRowById(sheets, spreadsheetId, id, idColumnRange);

  if (!rowNumber) {
      console.warn(`Tentativa de exclusão de um item com ID '${id}' que não foi encontrado.`);
      return; 
  }

  try {
    const sheetIdResponse = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties.sheetId)',
    });

    const sheetId = sheetIdResponse.data.sheets?.[sheetIndex]?.properties?.sheetId;

    if (sheetId === null || sheetId === undefined) {
      throw new Error("Não foi possível encontrar o ID da página da planilha.");
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });
  } catch (error: any) {
    console.error("[Sheets API Delete Error]", error);
    throw new Error(`Falha ao excluir item: ${error.message}`);
  }
}

// --- Funções de Exame ---

export async function getExams(spreadsheetId: string): Promise<Exam[]> {
  if (!spreadsheetId) return [];
  try {
    const sheets = await getSheetsApi();
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: EXAM_SHEETS_RANGE });
    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];
    
    return rows.slice(1)
      .map((row: any[], index: number) => mapRowToExam(row, index + 1))
      .filter((exam: Exam | null): exam is Exam => exam !== null && exam.patientName.trim() !== '');
  } catch (error) {
    console.error(`[Sheets API Error] Falha ao buscar exames:`, error);
    throw new Error('Failed to fetch data from Google Sheets.');
  }
}

export async function addExam(spreadsheetId: string, exam: Omit<Exam, 'id' | 'rowNumber'>) {
    const sheets = await getSheetsApi();
    const newId = randomUUID();
    const values = [mapExamToRow({ ...exam, id: newId })];
    await sheets.spreadsheets.values.append({ spreadsheetId, range: EXAM_SHEETS_RANGE, valueInputOption: 'USER_ENTERED', requestBody: { values } });
}

export async function updateExam(spreadsheetId: string, exam: Exam) {
    if (!exam.id) throw new Error("O ID do exame é necessário para atualizar.");
    const sheets = await getSheetsApi();
    const rowNumber = await findRowById(sheets, spreadsheetId, exam.id, 'A:A');

    if (!rowNumber) {
        console.warn(`Exame com ID ${exam.id} não encontrado. Adicionando como novo.`);
        await addExam(spreadsheetId, exam);
        return;
    }

    const range = `A${rowNumber}:F${rowNumber}`;
    const values = [mapExamToRow(exam)];
    await sheets.spreadsheets.values.update({ spreadsheetId, range, valueInputOption: 'USER_ENTERED', requestBody: { values } });
}

export async function deleteExam(spreadsheetId: string, id: string) {
    await deleteRow(spreadsheetId, id, 'A:A');
}

// --- Funções de Recoleta ---

export async function getRecoletas(spreadsheetId: string): Promise<Recoleta[]> {
    if (!spreadsheetId) return [];
    try {
        const sheets = await getSheetsApi();
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: RECOLETA_SHEETS_RANGE });
        const rows = response.data.values;
        if (!rows || rows.length <= 1) return [];

        return rows.slice(1)
            .map((row: any[], index: number) => mapRowToRecoleta(row, index + 1))
            .filter((item: Recoleta | null): item is Recoleta => item !== null && item.patientName.trim() !== '');
    } catch (error) {
        console.error(`[Sheets API Error] Falha ao buscar recoletas:`, error);
        throw new Error('Failed to fetch data from Google Sheets.');
    }
}

export async function addRecoleta(spreadsheetId: string, recoleta: Omit<Recoleta, 'id' | 'rowNumber'>) {
    const sheets = await getSheetsApi();
    const newId = randomUUID();
    const values = [mapRecoletaToRow({ ...recoleta, id: newId })];
    await sheets.spreadsheets.values.append({ spreadsheetId, range: RECOLETA_SHEETS_RANGE, valueInputOption: 'USER_ENTERED', requestBody: { values } });
}

export async function updateRecoleta(spreadsheetId: string, recoleta: Recoleta) {
    if (!recoleta.id) throw new Error("O ID da recoleta é necessário para atualizar.");
    const sheets = await getSheetsApi();
    const rowNumber = await findRowById(sheets, spreadsheetId, recoleta.id, 'A:A');

    if (!rowNumber) {
        console.warn(`Recoleta com ID ${recoleta.id} não encontrada. Adicionando como nova.`);
        await addRecoleta(spreadsheetId, recoleta);
        return;
    }

    const range = `A${rowNumber}:E${rowNumber}`;
    const values = [mapRecoletaToRow(recoleta)];
    await sheets.spreadsheets.values.update({ spreadsheetId, range, valueInputOption: 'USER_ENTERED', requestBody: { values } });
}

export async function deleteRecoleta(spreadsheetId: string, id: string) {
    await deleteRow(spreadsheetId, id, 'A:A');
}

// Re-export the new upload function for convenience
export { uploadPdfToCloudinary };
