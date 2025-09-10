'use server';
import { google } from 'googleapis';
import type { Exam, PdfLink } from './types';
import { parse, isValid, getYear, format } from 'date-fns';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
];
const SHEETS_RANGE = 'A:F'; 
const ID_COLUMN_INDEX = 0; // Column A

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

// --- Google Sheets Functions ---

function mapRowToExam(row: any[], index: number): Exam | null {
  const rowNumber = index + 2; 
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

  let pdfLinks: PdfLink[] | undefined;
  if (pdfData) {
    try {
      pdfLinks = JSON.parse(pdfData);
    } catch (e) {
      // Handle legacy single URL format
      if (typeof pdfData === 'string' && pdfData.startsWith('http')) {
        pdfLinks = [{ url: pdfData, name: 'Resultado.pdf' }];
      }
    }
  }


  return {
    id: String(id || `ROW${rowNumber}`),
    rowNumber,
    patientName: String(patientName || ''),
    receivedDate,
    withdrawnBy: withdrawnBy || undefined,
    observations: observations || '',
    pdfLinks,
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

async function getSheetsApi() {
    const auth = await getAuthClient();
    return google.sheets({ version: 'v4', auth });
}

export async function getExams(spreadsheetId: string): Promise<Exam[]> {
  if (!spreadsheetId) {
    return [];
  }
  try {
    const sheets = await getSheetsApi();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: SHEETS_RANGE,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length <= 1) { 
      return [];
    }
    
    const exams = rows
      .slice(1)
      .map((row: any[], index: number) => mapRowToExam(row, index + 1))
      .filter((exam: Exam | null): exam is Exam => exam !== null && exam.patientName.trim() !== '');
    
    return exams;

  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    console.error(`[Sheets API Error] Falha ao buscar exames para a planilha ${spreadsheetId}`, errorMessage);
    throw new Error('Failed to fetch data from Google Sheets.');
  }
}

export async function addExam(spreadsheetId: string, exam: Omit<Exam, 'id' | 'rowNumber'>) {
    const sheets = await getSheetsApi();
    const newId = randomUUID();
    const examWithId = { ...exam, id: newId };
    const values = [mapExamToRow(examWithId)];

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: SHEETS_RANGE,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });
    } catch (error: any) {
        throw new Error(`Falha ao adicionar exame: ${error.message}`);
    }
}

async function findRowById(sheets: any, spreadsheetId: string, id: string): Promise<number | null> {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `A:A`, // Only search in the ID column
    });
    const ids = response.data.values;
    if (!ids) return null;

    for (let i = 0; i < ids.length; i++) {
        if (ids[i][0] === id) {
            return i + 1; // Return 1-based row number
        }
    }
    return null;
}

export async function updateExam(spreadsheetId: string, exam: Exam) {
    if (!exam.id) {
        throw new Error("O ID do exame é necessário para atualizar.");
    }
    const sheets = await getSheetsApi();
    const rowNumber = await findRowById(sheets, spreadsheetId, exam.id);

    if (!rowNumber) {
        throw new Error("Exame não encontrado para atualização. Pode ter sido excluído.");
    }

    const range = `A${rowNumber}:F${rowNumber}`;
    const values = [mapExamToRow(exam)];

    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });
    } catch (error: any) {
        throw new Error(`Falha ao atualizar exame: ${error.message}`);
    }
}

export async function deleteExam(spreadsheetId: string, id: string) {
  if (!id) {
    throw new Error("O ID do exame é necessário para excluir.");
  }
  const sheets = await getSheetsApi();
  const rowNumber = await findRowById(sheets, spreadsheetId, id);

  if (!rowNumber) {
      console.warn(`Tentativa de exclusão de um exame com ID '${id}' que não foi encontrado.`);
      return; // Silently fail if not found, as it might have been already deleted.
  }

  try {
    const sheetIdResponse = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties.sheetId)',
    });

    const sheetId = sheetIdResponse.data.sheets?.[0]?.properties?.sheetId;

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
    throw new Error(`Falha ao excluir exame: ${error.message}`);
  }
}

// --- Google Drive Functions ---

async function getDriveApi() {
    const auth = await getAuthClient();
    return google.drive({ version: 'v3', auth });
}

export async function uploadPdfToDrive(fileBuffer: Buffer, fileName: string): Promise<PdfLink> {
    const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!driveFolderId) {
        throw new Error("A variável de ambiente GOOGLE_DRIVE_FOLDER_ID não está definida.");
    }

    const drive = await getDriveApi();

    try {
        const file = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [driveFolderId],
                mimeType: 'application/pdf',
            },
            media: {
                mimeType: 'application/pdf',
                body: Readable.from([fileBuffer]),
            },
            fields: 'id, webContentLink',
        });

        const fileId = file.data.id;
        if (!fileId) {
            throw new Error("Falha ao obter o ID do arquivo após o upload.");
        }

        // Tornar o arquivo publicamente legível
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        if (!file.data.webContentLink) {
             throw new Error("Falha ao obter o link de download do arquivo.");
        }

        return { url: file.data.webContentLink, name: fileName };
    } catch (error: any) {
        console.error("[Drive API Error] Falha ao fazer upload do arquivo:", error);
        throw new Error(`Falha ao fazer upload do PDF para o Drive: ${error.message}`);
    }
}
