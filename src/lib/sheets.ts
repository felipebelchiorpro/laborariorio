
'use server';
import { GoogleAuth } from 'google-auth-library';
import type { Exam } from './types';
import { parse, isValid, getYear, format } from 'date-fns';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const RANGE = 'A:E'; 

async function getAuthClient() {
  const base64Credentials = process.env.GOOGLE_CREDENTIALS_BASE64;

  if (!base64Credentials) {
    console.error("[AUTH ERROR] A variável de ambiente GOOGLE_CREDENTIALS_BASE64 não foi encontrada.");
    throw new Error('A variável de ambiente GOOGLE_CREDENTIALS_BASE64 não foi encontrada.');
  }

  try {
    const credentialsStr = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const credentials = JSON.parse(credentialsStr.trim());

    const auth = new GoogleAuth({
      credentials,
      scopes: SCOPES,
    });

    return auth.getClient();
  } catch (error: any) {
    console.error("[AUTH ERROR] Falha ao decodificar ou processar as credenciais Base64:", error.message);
    throw new Error("As credenciais fornecidas em GOOGLE_CREDENTIALS_BASE64 não são válidas.");
  }
}

function mapRowToExam(row: any[], index: number): Exam | null {
  const rowNumber = index + 2; 
  const [patientName, receivedDateStr, withdrawnBy, observations, pdfUrl] = row;

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

  return {
    id: `ROW${rowNumber}`,
    rowNumber,
    patientName: String(patientName || ''),
    receivedDate,
    withdrawnBy: withdrawnBy || undefined,
    observations: observations || '',
    pdfUrl: pdfUrl || undefined,
  };
}

function mapExamToRow(exam: Omit<Exam, 'id' | 'rowNumber'>): any[] {
  const displayDate = exam.receivedDate ? format(new Date(exam.receivedDate), 'dd/MM/yyyy') : '';
  return [
    exam.patientName || '',
    displayDate,
    exam.withdrawnBy || '',
    exam.observations || '',
    exam.pdfUrl || '',
  ];
}


export async function getExams(spreadsheetId: string): Promise<Exam[]> {
  if (!spreadsheetId) {
    return [];
  }
  try {
    const authClient = await getAuthClient();
    const tokenResponse = await authClient.getAccessToken();
    const token = tokenResponse.token;

    if (!token) {
        throw new Error("Falha ao obter o token de acesso.");
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${RANGE}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Sheets API Fetch Error] A API retornou um erro:", errorData);
      throw new Error(`Falha na chamada da API do Sheets: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length <= 1) { 
      return [];
    }
    
    // Filtra as linhas vazias antes de mapear
    const exams = rows
      .slice(1)
      .map((row: any[], index: number) => mapRowToExam(row, index + rows.slice(0, 1).length))
      .filter((exam: Exam | null): exam is Exam => exam !== null && exam.patientName.trim() !== '');

    
    return exams;

  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    console.error(`[Sheets API Error] Falha ao buscar exames para a planilha ${spreadsheetId}`, errorMessage);
    throw new Error('Failed to fetch data from Google Sheets.');
  }
}

export async function addExam(spreadsheetId: string, exam: Omit<Exam, 'id' | 'rowNumber'>) {
    const authClient = await getAuthClient();
    const tokenResponse = await authClient.getAccessToken();
    const token = tokenResponse.token;
     if (!token) {
        throw new Error("Falha ao obter o token de acesso.");
    }
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${RANGE}:append?valueInputOption=USER_ENTERED`;
    
    const values = [mapExamToRow(exam)];
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
    });

     if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Falha ao adicionar exame: ${errorData.error.message}`);
    }
}

export async function updateExam(spreadsheetId: string, exam: Exam) {
    if (!exam.rowNumber) {
        throw new Error("O número da linha é necessário para atualizar o exame.");
    }
    const authClient = await getAuthClient();
    const tokenResponse = await authClient.getAccessToken();
    const token = tokenResponse.token;
     if (!token) {
        throw new Error("Falha ao obter o token de acesso.");
    }
    const range = `A${exam.rowNumber}:E${exam.rowNumber}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

    const values = [mapExamToRow(exam)];

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Falha ao atualizar exame: ${errorData.error.message}`);
    }
}

export async function deleteExam(spreadsheetId: string, rowNumber: number) {
  if (!rowNumber) {
    throw new Error("O número da linha é necessário para excluir o exame.");
  }
  const authClient = await getAuthClient();
  const tokenResponse = await authClient.getAccessToken();
  const token = tokenResponse.token;
  if (!token) {
    throw new Error("Falha ao obter o token de acesso.");
  }
  
  // A API do Google Sheets espera um corpo de requisição para limpar a linha, 
  // mesmo que ele esteja vazio, para limpar os valores.
  // Para excluir a linha, teríamos que usar uma chamada mais complexa (batchUpdate).
  // Por simplicidade, vamos apenas limpar os valores da linha.
  const range = `A${rowNumber}:E${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}), // Corpo vazio é necessário para a API de clear
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("[Sheets API Delete Error]", errorData);
    throw new Error(`Falha ao excluir exame: ${errorData.error.message}`);
  }
}
