
export type PdfLink = {
  url: string;
  name: string;
};

export type Exam = {
  id: string; // Gerado e salvo na planilha
  rowNumber: number; // Apenas para referência interna temporária, não é um ID confiável
  patientName: string;
  observations?: string;
  receivedDate?: string; // ISO 8601 format string
  withdrawnBy?: string;
  pdfLinks?: PdfLink[]; // Array of PDF links and names
};

export type Recoleta = {
  id: string;
  rowNumber: number;
  patientName: string;
  ubs: string;
  tubeColor?: string;
  notified: boolean;
  observations?: string;
};

export type Fosp = {
  id: string;
  rowNumber: number;
  patientName: string;
  sent: boolean;
  sentDate?: string;
  receivedBack: boolean;
  examType: string;
  observations?: string;
};
