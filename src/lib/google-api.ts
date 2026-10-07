'use server';
import { google } from 'googleapis';
import type { Exam, PdfLink, Recoleta, Fosp, Appointment, AppointmentStatus } from './types';
import { parse, isValid, format } from 'date-fns';
import { randomUUID } from 'crypto';
import { uploadPdfToCloudinary } from './cloudinary';
import { unstable_noStore as noStore } from 'next/cache';

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
];

// Colunas Exame: ID, Paciente, Data, Retirado, OBS, PDFs
const EXAM_SHEETS_RANGE = 'A:F';
const EXAM_ID_COLUMN_INDEX = 0;

// Colunas Recoleta: ID, Paciente, UBS, Cor do Tubo, Avisado, OBS
const RECOLETA_SHEETS_RANGE = 'A:F';
const RECOLETA_ID_COLUMN_INDEX = 0;

// Colunas Agendamento: ID, Paciente, Data do Exame, Telefone, Avisado, Status, OBS
const AGENDAMENTO_SHEETS_RANGE = 'A:G';
const AGENDAMENTO_ID_COLUMN_INDEX = 0;


async function getAuthClient() {
  const rawCredentials = process.env.GOOGLE_CREDENTIALS_BASE64;

  if (!rawCredentials) {
    console.error("[AUTH ERROR] A variável de ambiente GOOGLE_CREDENTIALS_BASE64 não foi encontrada.");
    throw new Error('A variável de ambiente GOOGLE_CREDENTIALS_BASE64 não foi encontrada.');
  }

  try {
    // Remove literal '\n', real newlines, and whitespace inserted by environment variable editors
    const cleanBase64 = rawCredentials
      .replace(/\\n/g, '')
      .replace(/[\r\n\s]/g, '')
      .trim();

    let credentialsStr: string;
    if (cleanBase64.startsWith('{')) {
      credentialsStr = cleanBase64;
    } else {
      credentialsStr = Buffer.from(cleanBase64, 'base64').toString('utf-8');
    }

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
    if (!row || row.length === 0) return null;

    let id: string;
    let patientName: string;
    let ubs: string;
    let tubeColor: string = '';
    let notifiedStr: string = '';
    let observations: string = '';

    const isSimNao = (val: any) => String(val || '').trim().toUpperCase() === 'SIM' || String(val || '').trim().toUpperCase() === 'NÃO';

    if (isSimNao(row[4])) {
        // 6-column layout: ID, Paciente, UBS, Cor do Tubo, Avisado, OBS
        id = String(row[0] || `MISSING_ID_ROW_${rowNumber}`);
        patientName = String(row[1] || '');
        ubs = String(row[2] || '');
        tubeColor = String(row[3] || '');
        notifiedStr = String(row[4] || '').toUpperCase();
        observations = String(row[5] || '');
    } else if (isSimNao(row[3])) {
        // 5-column legacy layout: ID, Paciente, UBS, Avisado, OBS
        id = String(row[0] || `MISSING_ID_ROW_${rowNumber}`);
        patientName = String(row[1] || '');
        ubs = String(row[2] || '');
        tubeColor = '';
        notifiedStr = String(row[3] || '').toUpperCase();
        observations = String(row[4] || '');
    } else if (isSimNao(row[2])) {
        // 4-column layout without ID: Paciente, UBS, Avisado, OBS
        id = `ROW_${rowNumber}`;
        patientName = String(row[0] || '');
        ubs = String(row[1] || '');
        tubeColor = '';
        notifiedStr = String(row[2] || '').toUpperCase();
        observations = String(row[3] || '');
    } else {
        id = String(row[0] || `MISSING_ID_ROW_${rowNumber}`);
        patientName = String(row[1] || row[0] || '');
        ubs = String(row[2] || '');
        tubeColor = String(row[3] || '');
        notifiedStr = String(row[4] || '').toUpperCase();
        observations = String(row[5] || '');
    }

    if (!patientName || patientName.trim() === '') {
        return null;
    }

    return {
        id,
        patientName: patientName.trim(),
        ubs: ubs || '',
        tubeColor: tubeColor || '',
        notified: notifiedStr === 'SIM',
        observations: observations || '',
        rowNumber: rowNumber
    };
}

function mapRecoletaToRow(recoleta: Partial<Omit<Recoleta, 'rowNumber'>>): any[] {
    return [
        recoleta.id || '',
        recoleta.patientName || '',
        recoleta.ubs || '',
        recoleta.tubeColor || '',
        recoleta.notified ? 'SIM' : 'NÃO',
        recoleta.observations || '',
    ];
}


// --- Funções Genéricas ---

async function getSheetsApi() {
    const auth = await getAuthClient();
    return google.sheets({ version: 'v4', auth: auth as any });
}

async function resolveSheetName(sheets: any, spreadsheetId: string, preferredSheetName: string): Promise<string> {
    try {
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetList = meta.data.sheets || [];
        
        // 1. Exact match
        const exact = sheetList.find((s: any) => s.properties?.title === preferredSheetName);
        if (exact && exact.properties?.title) return exact.properties.title;

        // 2. Case-insensitive match (e.g. "recoleta", "Recoleta", "fosp", "Fosp")
        const ci = sheetList.find((s: any) => s.properties?.title?.toLowerCase().trim() === preferredSheetName.toLowerCase().trim());
        if (ci && ci.properties?.title) return ci.properties.title;

        // 3. Singular / Plural match (e.g. "Agendamento" vs "Agendamentos", "Recoleta" vs "Recoletas")
        const cleanStr = (str: string) => str.toLowerCase().trim().replace(/s$/, '');
        const normPref = cleanStr(preferredSheetName);
        const matchPlural = sheetList.find((s: any) => {
            const titleNorm = cleanStr(s.properties?.title || '');
            return titleNorm === normPref && titleNorm.length >= 3;
        });
        if (matchPlural && matchPlural.properties?.title) return matchPlural.properties.title;

        // 4. Word match with minimum length of 4 characters to avoid single letter matches
        const wordMatch = sheetList.find((s: any) => {
            const title = (s.properties?.title || '').toLowerCase().trim();
            const pref = preferredSheetName.toLowerCase().trim();
            return (title.length >= 4 && pref.includes(title)) || (pref.length >= 4 && title.includes(pref));
        });
        if (wordMatch && wordMatch.properties?.title) return wordMatch.properties.title;

    } catch (e) {
        console.error(`[Sheets API Warning] Falha ao verificar abas da planilha:`, e);
    }
    return preferredSheetName;
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

async function deleteRow(spreadsheetId: string, id: string, sheetName: string, idColumnRange: string) {
  if (!id) {
    throw new Error("O ID é necessário para excluir.");
  }
  const sheets = await getSheetsApi();
  const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
  const range = `${targetSheetName}!${idColumnRange}`;
  const rowNumber = await findRowById(sheets, spreadsheetId, id, range);

  if (!rowNumber) {
      console.warn(`Tentativa de exclusão de um item com ID '${id}' que não foi encontrado.`);
      return; 
  }

  try {
    const sheetIdResponse = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // Find the sheet ID for the specific sheetName
    const sheet = sheetIdResponse.data.sheets?.find(s => s.properties?.title === targetSheetName);
    const sheetNumId = sheet?.properties?.sheetId;

    if (sheetNumId === null || sheetNumId === undefined) {
      throw new Error(`Não foi possível encontrar o ID da aba da planilha com o nome '${targetSheetName}'.`);
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetNumId,
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

export async function getExams(spreadsheetId: string, sheetName: string = 'Sheet1'): Promise<Exam[]> {
  noStore();
  if (!spreadsheetId) return [];
  try {
    const sheets = await getSheetsApi();
    const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
    const range = `${targetSheetName}!${EXAM_SHEETS_RANGE}`;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });

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

export async function addExam(spreadsheetId: string, sheetName: string, exam: Omit<Exam, 'id' | 'rowNumber'>) {
    const sheets = await getSheetsApi();
    const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
    const newId = randomUUID();
    const values = [mapExamToRow({ ...exam, id: newId })];
    const range = `${targetSheetName}!${EXAM_SHEETS_RANGE}`;
    await sheets.spreadsheets.values.append({ spreadsheetId, range, valueInputOption: 'USER_ENTERED', requestBody: { values } });
}

export async function updateExam(spreadsheetId: string, sheetName: string, exam: Exam) {
    if (!exam.id) throw new Error("O ID do exame é necessário para atualizar.");
    const sheets = await getSheetsApi();
    const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
    const rowNumber = await findRowById(sheets, spreadsheetId, exam.id, `${targetSheetName}!A:A`);

    if (!rowNumber) {
        console.warn(`Exame com ID ${exam.id} não encontrado. Adicionando como novo.`);
        await addExam(spreadsheetId, targetSheetName, exam);
        return;
    }

    const range = `${targetSheetName}!A${rowNumber}:F${rowNumber}`;
    const values = [mapExamToRow(exam)];
    await sheets.spreadsheets.values.update({ spreadsheetId, range, valueInputOption: 'USER_ENTERED', requestBody: { values } });
}

export async function deleteExam(spreadsheetId: string, sheetName: string, id: string) {
    await deleteRow(spreadsheetId, id, sheetName, 'A:A');
}

// --- Funções de Recoleta ---

export async function getRecoletas(spreadsheetId: string, sheetName: string = 'Recoleta'): Promise<Recoleta[]> {
    noStore();
    if (!spreadsheetId) return [];
    try {
        const sheets = await getSheetsApi();
        const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
        const range = `${targetSheetName}!${RECOLETA_SHEETS_RANGE}`;
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
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

export async function addRecoleta(spreadsheetId: string, sheetName: string, recoleta: Omit<Recoleta, 'id' | 'rowNumber'>) {
    try {
        const sheets = await getSheetsApi();
        const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
        const newId = randomUUID();
        const values = [mapRecoletaToRow({ ...recoleta, id: newId })];
        const range = `${targetSheetName}!${RECOLETA_SHEETS_RANGE}`;
        await sheets.spreadsheets.values.append({ spreadsheetId, range, valueInputOption: 'USER_ENTERED', requestBody: { values } });
        return { success: true };
    } catch (error: any) {
        console.error(`[Sheets API Error] Falha ao adicionar recoleta:`, error);
        return { error: error.message || 'Failed to add data to Google Sheets.' };
    }
}

export async function updateRecoleta(spreadsheetId: string, sheetName: string, recoleta: Recoleta) {
    if (!recoleta.id) return { error: "O ID da recoleta é necessário para atualizar." };
    try {
        const sheets = await getSheetsApi();
        const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
        const rowNumber = await findRowById(sheets, spreadsheetId, recoleta.id, `${targetSheetName}!A:A`);

        if (!rowNumber) {
            console.warn(`Recoleta com ID ${recoleta.id} não encontrada. Adicionando como nova.`);
            return await addRecoleta(spreadsheetId, targetSheetName, recoleta);
        }

        const range = `${targetSheetName}!A${rowNumber}:F${rowNumber}`;
        const values = [mapRecoletaToRow(recoleta)];
        await sheets.spreadsheets.values.update({ spreadsheetId, range, valueInputOption: 'USER_ENTERED', requestBody: { values } });
        return { success: true };
    } catch (error: any) {
        console.error(`[Sheets API Error] Falha ao atualizar recoleta:`, error);
        return { error: error.message || 'Failed to update data in Google Sheets.' };
    }
}

export async function deleteRecoleta(spreadsheetId: string, sheetName: string, id: string) {
    try {
        await deleteRow(spreadsheetId, id, sheetName, 'A:A');
        return { success: true };
    } catch (error: any) {
        console.error(`[Sheets API Error] Falha ao excluir recoleta:`, error);
        return { error: error.message || 'Failed to delete data from Google Sheets.' };
    }
}

// --- Funções de FOSP ---

const FOSP_SHEETS_RANGE = 'A:G';

function mapRowToFosp(row: any[], index: number): Fosp | null {
    const rowNumber = index + 2;
    if (!row || row.length === 0) return null;

    let id: string;
    let patientName: string;
    let sentStr: string;
    let sentDateStr: string;
    let receivedBackStr: string;
    let examType: string;
    let observations: string;

    const isSimNao = (val: any) => String(val || '').trim().toUpperCase() === 'SIM' || String(val || '').trim().toUpperCase() === 'NÃO';

    if (isSimNao(row[2])) {
        // 7-column layout: ID, Paciente, Enviado, Data Envio, Recebido de Volta, Tipo de Exame, Observações
        id = String(row[0] || `MISSING_ID_ROW_${rowNumber}`);
        patientName = String(row[1] || '');
        sentStr = String(row[2] || '').toUpperCase();
        sentDateStr = String(row[3] || '');
        receivedBackStr = String(row[4] || '').toUpperCase();
        examType = String(row[5] || '');
        observations = String(row[6] || '');
    } else if (isSimNao(row[1])) {
        // 6-column layout: Paciente, Enviado, Data Envio, Recebido de Volta, Tipo de Exame, Observações
        id = `ROW_${rowNumber}`;
        patientName = String(row[0] || '');
        sentStr = String(row[1] || '').toUpperCase();
        sentDateStr = String(row[2] || '');
        receivedBackStr = String(row[3] || '').toUpperCase();
        examType = String(row[4] || '');
        observations = String(row[5] || '');
    } else {
        id = String(row[0] || `MISSING_ID_ROW_${rowNumber}`);
        patientName = String(row[1] || row[0] || '');
        sentStr = String(row[2] || '').toUpperCase();
        sentDateStr = String(row[3] || '');
        receivedBackStr = String(row[4] || '').toUpperCase();
        examType = String(row[5] || '');
        observations = String(row[6] || '');
    }

    if (!patientName || patientName.trim() === '') {
        return null;
    }

    let sentDate: string | undefined = undefined;
    if (sentDateStr && sentDateStr.trim() !== '') {
        try {
            const dateString = String(sentDateStr).trim();
            let parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
            if (isValid(parsedDate)) {
                sentDate = parsedDate.toISOString();
            } else {
                sentDate = dateString;
            }
        } catch (e) {
            sentDate = sentDateStr;
        }
    }

    return {
        id,
        patientName: patientName.trim(),
        sent: sentStr === 'SIM',
        sentDate,
        receivedBack: receivedBackStr === 'SIM',
        examType: examType || '',
        observations: observations || '',
        rowNumber: rowNumber
    };
}

function mapFospToRow(fosp: Partial<Omit<Fosp, 'rowNumber'>>): any[] {
    let displaySentDate = '';
    if (fosp.sentDate) {
        try {
            displaySentDate = fosp.sentDate.includes('T') ? format(new Date(fosp.sentDate), 'dd/MM/yyyy') : fosp.sentDate;
        } catch (e) {
            displaySentDate = fosp.sentDate;
        }
    }

    return [
        fosp.id || '',
        fosp.patientName || '',
        fosp.sent ? 'SIM' : 'NÃO',
        displaySentDate,
        fosp.receivedBack ? 'SIM' : 'NÃO',
        fosp.examType || '',
        fosp.observations || '',
    ];
}

export async function getFosps(spreadsheetId: string, sheetName: string = 'FOSP'): Promise<Fosp[]> {
    noStore();
    if (!spreadsheetId) return [];
    try {
        const sheets = await getSheetsApi();
        const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
        const range = `${targetSheetName}!${FOSP_SHEETS_RANGE}`;
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        if (!rows || rows.length <= 1) return [];

        return rows.slice(1)
            .map((row: any[], index: number) => mapRowToFosp(row, index + 1))
            .filter((item: Fosp | null): item is Fosp => item !== null && item.patientName.trim() !== '');
    } catch (error) {
        console.error(`[Sheets API Error] Falha ao buscar registros FOSP:`, error);
        throw new Error('Failed to fetch data from Google Sheets.');
    }
}

export async function addFosp(spreadsheetId: string, sheetName: string, fosp: Omit<Fosp, 'id' | 'rowNumber'>) {
    try {
        const sheets = await getSheetsApi();
        const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
        const newId = randomUUID();
        const values = [mapFospToRow({ ...fosp, id: newId })];
        const range = `${targetSheetName}!${FOSP_SHEETS_RANGE}`;
        await sheets.spreadsheets.values.append({ spreadsheetId, range, valueInputOption: 'USER_ENTERED', requestBody: { values } });
        return { success: true };
    } catch (error: any) {
        console.error(`[Sheets API Error] Falha ao adicionar FOSP:`, error);
        return { error: error.message || 'Failed to add data to Google Sheets.' };
    }
}

export async function updateFosp(spreadsheetId: string, sheetName: string, fosp: Fosp) {
    if (!fosp.id) return { error: "O ID é necessário para atualizar." };
    try {
        const sheets = await getSheetsApi();
        const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
        const rowNumber = await findRowById(sheets, spreadsheetId, fosp.id, `${targetSheetName}!A:A`);

        if (!rowNumber) {
            console.warn(`Registro FOSP com ID ${fosp.id} não encontrado. Adicionando como novo.`);
            return await addFosp(spreadsheetId, targetSheetName, fosp);
        }

        const range = `${targetSheetName}!A${rowNumber}:G${rowNumber}`;
        const values = [mapFospToRow(fosp)];
        await sheets.spreadsheets.values.update({ spreadsheetId, range, valueInputOption: 'USER_ENTERED', requestBody: { values } });
        return { success: true };
    } catch (error: any) {
        console.error(`[Sheets API Error] Falha ao atualizar FOSP:`, error);
        return { error: error.message || 'Failed to update data in Google Sheets.' };
    }
}

export async function deleteFosp(spreadsheetId: string, sheetName: string, id: string) {
    try {
        await deleteRow(spreadsheetId, id, sheetName, 'A:A');
        return { success: true };
    } catch (error: any) {
        console.error(`[Sheets API Error] Falha ao excluir FOSP:`, error);
        return { error: error.message || 'Failed to delete data from Google Sheets.' };
    }
}

// --- Funções de Agendamento & WhatsApp ---

function mapRowToAppointment(row: any[], index: number): Appointment | null {
    const rowNumber = index + 2;
    const [id, patientName, examDateStr, phone, notifiedStr, statusStr, observations] = row;

    if (!patientName || String(patientName).trim() === '') {
        return null;
    }

    let examDate: string = '';
    if (examDateStr) {
        try {
            const dateString = String(examDateStr).trim();
            if (dateString) {
                if (dateString.includes('-') && dateString.length === 10) {
                    examDate = dateString;
                } else {
                    let parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
                    if (isValid(parsedDate)) {
                        examDate = format(parsedDate, 'yyyy-MM-dd');
                    }
                }
            }
        } catch (e) {
            // fail silently
        }
    }

    let status: AppointmentStatus = 'pendente';
    const rawStatus = String(statusStr || '').toUpperCase().trim();
    if (rawStatus === 'VAI' || rawStatus === 'CONFIRMADO') {
        status = 'vai';
    } else if (rawStatus === 'NAO_VAI' || rawStatus === 'NÃO VAI' || rawStatus === 'CANCELADO') {
        status = 'nao_vai';
    }

    return {
        id: String(id || `MISSING_ID_ROW_${rowNumber}`),
        rowNumber,
        patientName: String(patientName || ''),
        examDate: examDate || '',
        phone: String(phone || ''),
        notified: String(notifiedStr).toUpperCase() === 'SIM',
        status,
        observations: observations || '',
    };
}

function mapAppointmentToRow(app: Partial<Omit<Appointment, 'rowNumber'>>): any[] {
    let displayDate = app.examDate || '';
    if (app.examDate && app.examDate.includes('-')) {
        try {
            const [y, m, d] = app.examDate.split('-');
            if (y && m && d) displayDate = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        } catch (e) {}
    }

    let statusStr = 'PENDENTE';
    if (app.status === 'vai') statusStr = 'VAI';
    if (app.status === 'nao_vai') statusStr = 'NAO_VAI';

    return [
        app.id || '',
        app.patientName || '',
        displayDate,
        app.phone || '',
        app.notified ? 'SIM' : 'NÃO',
        statusStr,
        app.observations || '',
    ];
}

export async function getAppointments(spreadsheetId: string, sheetName: string): Promise<Appointment[]> {
    noStore();
    if (!spreadsheetId) return [];
    try {
        const sheets = await getSheetsApi();
        const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
        let range = `${targetSheetName}!${AGENDAMENTO_SHEETS_RANGE}`;
        
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        
        const rows = response.data.values;
        if (!rows || rows.length <= 1) return [];

        return rows.slice(1)
            .map((row: any[], index: number) => mapRowToAppointment(row, index + 1))
            .filter((app: Appointment | null): app is Appointment => app !== null && app.patientName.trim() !== '');
    } catch (error) {
        console.error(`[Sheets API Error] Falha ao buscar agendamentos:`, error);
        throw new Error('Failed to fetch appointments data from Google Sheets.');
    }
}

export async function addAppointment(spreadsheetId: string, sheetName: string, appointment: Omit<Appointment, 'id' | 'rowNumber'>) {
    try {
        const sheets = await getSheetsApi();
        const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
        const newId = randomUUID();
        const values = [mapAppointmentToRow({ ...appointment, id: newId })];
        const range = `${targetSheetName}!${AGENDAMENTO_SHEETS_RANGE}`;
        await sheets.spreadsheets.values.append({ spreadsheetId, range, valueInputOption: 'USER_ENTERED', requestBody: { values } });
        return { success: true };
    } catch (error: any) {
        console.error(`[Sheets API Error] Falha ao adicionar agendamento:`, error);
        return { error: error.message || 'Failed to add appointment data to Google Sheets.' };
    }
}

export async function updateAppointment(spreadsheetId: string, sheetName: string, appointment: Appointment) {
    if (!appointment.id) return { error: "O ID é necessário para atualizar." };
    try {
        const sheets = await getSheetsApi();
        const targetSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
        const rowNumber = await findRowById(sheets, spreadsheetId, appointment.id, `${targetSheetName}!A:A`);

        if (!rowNumber) {
            console.warn(`Agendamento com ID ${appointment.id} não encontrado. Adicionando como novo.`);
            return await addAppointment(spreadsheetId, targetSheetName, appointment);
        }

        const range = `${targetSheetName}!A${rowNumber}:G${rowNumber}`;
        const values = [mapAppointmentToRow(appointment)];
        await sheets.spreadsheets.values.update({ spreadsheetId, range, valueInputOption: 'USER_ENTERED', requestBody: { values } });
        return { success: true };
    } catch (error: any) {
        console.error(`[Sheets API Error] Falha ao atualizar agendamento:`, error);
        return { error: error.message || 'Failed to update appointment in Google Sheets.' };
    }
}

export async function deleteAppointment(spreadsheetId: string, sheetName: string, id: string) {
    try {
        await deleteRow(spreadsheetId, id, sheetName, 'A:A');
        return { success: true };
    } catch (error: any) {
        console.error(`[Sheets API Error] Falha ao excluir agendamento:`, error);
        return { error: error.message || 'Failed to delete appointment from Google Sheets.' };
    }
}

// Re-export the new upload function for convenience
export { uploadPdfToCloudinary };

